import { NodeHandlers, WorkerLabeledHandle } from "@/components/flow/handles"
import { Row, useForm } from "@/components/forms"
import { Input } from "@/components/forms/input"
import { InputTextArea } from "@/components/forms/textarea"
import { workerRegistry } from "@/lib/agents/registry"
import { createModel } from "@/lib/data/model"
import { NodeProps } from '@xyflow/react'
import { AudioLines, FileText, Image, Paperclip, Type } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { useWorker } from "../hooks"
import { NodeLayout } from './node'
import { ConditionHandler } from "../condition"
import { Select } from "@/components/forms/select"
import { DropZone } from "@/components/ui/drop-zone"
import { Button } from "@/components/ui/button"
import { SwirlingEffectSpinner } from "../progress"
import { supabase } from "@/lib/agents/db"
import { ulid } from "ulid"
import { useForceUpdate } from "@/lib/utils"
import { MemoizedWorker } from "../memoizedworkers"
import { app } from "@/lib/app"

const { text } = workerRegistry

text.icon = Paperclip
const BUCKET_NAME = "static"

const contentTypes = [
  { value: "text", label: "Text" },
  { value: "number", label: "Number" },
  { value: "audio", label: "Audio" },
  { value: "image", label: "Image" },
  { value: "file", label: "File" },
  { value: "Timestamp", label: "Timestamp" },
]

const model = createModel({
  fields: {
    output: { title: "Content", type: "string", required: false },
    numberValue: { title: "Number", type: "number", required: false },
    contentType: { title: "Content Type", type: "string", required: false, list: contentTypes },
  }
})


function Parameters({ worker }: { worker: TextWorker }) {
  const update = useForceUpdate()
  const [fileUrl, setFileUrl] = useState<string>(worker.parameters.contentUri || "")
  const [fileName, setFileName] = useState<string>("")
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { form, watch, m } = useForm(model, {
    doNotReset: true,
    values: {
      output: worker.parameters.text || "",
      numberValue: worker.parameters.numberValue || 0,
      contentType: (worker.parameters.contentType || "text") as any,
    }
  })

  // Function to update field type based on content type
  const updateFieldType = useCallback((contentType: string) => {
    if (contentType === "text") {
      worker.fields.output.type = "string"
    } else if (contentType === "number") {
      worker.fields.output.type = "number"
    } else if (contentType === "audio") {
      worker.fields.output.type = "audio"
    } else if (contentType === "image" || contentType === "file") {
      worker.fields.output.type = "file"
    } else if (contentType === "Timestamp") {
      worker.fields.output.type = "date"
    } else {
      worker.fields.output.type = "string"
    }
    update()
    worker.updateWorker()
    app.agent.update()
  }, [worker, update])

  // Set initial field type on mount
  useEffect(() => {
    updateFieldType(worker.parameters.contentType || "text")
  }, [updateFieldType])

  useEffect(() => {
    const subscription = watch((value, { name }) => {
      if (name === "output") worker.parameters.text = value.output
      if (name === "numberValue") worker.parameters.numberValue = value.numberValue
      if (name === "contentType") {
        worker.parameters.contentType = value.contentType as any
        updateFieldType(value.contentType)
      }
    })
    return () => subscription.unsubscribe()
  }, [watch, worker.parameters, updateFieldType])

  const contentType = worker.parameters.contentType

  const handleFileUpload = useCallback(async (files: File[]) => {
    if (files.length === 0) return

    const file = files[0]
    setFileName(file.name)
    setUploading(true)
    setError(null)

    try {
      // If there's an existing file, delete it first
      if (worker.parameters.contentUri) {
        try {
          const urlParts = worker.parameters.contentUri.split('/')
          const filePath = urlParts[urlParts.length - 1]
          await supabase.storage.from(BUCKET_NAME).remove([filePath])
        } catch (deleteError) {
          console.error("Error deleting file:", deleteError)
        }
      }

      const { data, error: uploadError } = await supabase.storage.from(BUCKET_NAME).upload(`${ulid()}-${file.name}`, file, { cacheControl: '3600', upsert: true })

      if (uploadError) {
        setError(`Upload error: ${uploadError.message}`)
        throw uploadError
      }

      if (!data || !data.path) {
        setError("Upload failed: No data returned")
        throw new Error("Upload failed: No data returned")
      }

      // Get public URL
      const { data: urlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(data.path)

      if (urlData) {
        setFileUrl(urlData.publicUrl)
        worker.parameters.contentUri = urlData.publicUrl
      } else {
        setError("Failed to get public URL")
      }

    } catch (error) {
      console.error("Error uploading file:", error)
      setError(error instanceof Error ? error.message : String(error))
    } finally {
      setUploading(false)
    }

  }, [worker])

  const onReplaceFile = useCallback(() => {
    const fileInput = document.getElementById('replaceFileInput') as HTMLInputElement
    if (fileInput) {
      fileInput.value = ''
      fileInput.click()
    }
  }, [worker])

  const onRemoveFile = useCallback(async () => {
    if (!worker.parameters.contentUri) return
    setUploading(true)
    setError(null)
    try {
      const urlParts = worker.parameters.contentUri.split('/')
      const filePath = urlParts[urlParts.length - 1]
      const { error: deleteError } = await supabase.storage.from(BUCKET_NAME).remove([filePath])
      if (deleteError) {
        setError(`Error deleting file: ${deleteError.message}`)
        throw deleteError
      }
      setFileUrl('')
      setFileName('')
      worker.parameters.contentUri = ''
    } catch (error) {
      console.error("Error removing file:", error)
      setError(error instanceof Error ? error.message : String(error))
    } finally {
      setUploading(false)
    }
  }, [worker])

  const type: "text" | "number" | "timestamp" | "other" =
    worker.parameters.contentType === "text" ? "text" :
      worker.parameters.contentType === "number" ? "number" :
        worker.parameters.contentType === "Timestamp" ? "timestamp" :
          "other"

  return <form.context>
    <div className="p-2 flex flex-col gap-2 w-full flex-grow">

      <Row>
        <Select field={m.contentType} span={12} hideLabel className="w-auto" />
      </Row>

      {type === "text" && <Row className="flex-grow w-auto flex flex-col">
        <InputTextArea span={12} field={m.output} hideLabel className='min-h-10 resize-none h-full' controlClassName="flex-grow" />
      </Row>}

      {type === "number" && <Input span={12} field={m.output} type="number" hideLabel className='' />}

      {type === "timestamp" && <div className="p-4 text-center text-gray-500">
        <div className="text-sm">This will generate a current timestamp when executed</div>
        <div className="text-xs mt-1 text-gray-400">No configuration needed</div>
      </div>}

      {type === "other" && <>
        <div className="w-full h-full flex flex-col relative">
          <DropZone onFilesDrop={handleFileUpload} className="flex-grow w-full">
            <div className="flex flex-col items-center justify-center h-full w-full border-2 border-dashed border-gray-300 rounded-md p-2">
              {fileUrl ? (
                <div className="w-full h-full flex flex-col items-center justify-center">
                  {contentType === "image" && <div className="flex justify-center mb-2 flex-grow"><img src={fileUrl} alt="Uploaded" className="max-h-32 max-w-full object-contain" /></div>}
                  {contentType === "audio" && <div className="flex justify-center mb-2 w-full"><audio controls src={fileUrl} className="w-full" /></div>}
                  <div className="text-sm text-center text-gray-500 truncate mb-2 w-[inherit]">
                    {fileName || fileUrl.split('/').pop()}
                  </div>
                  <div className="w-full space-y-2">
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1" onClick={onReplaceFile}>Replace File</Button>
                      <Button variant="outline" size="sm" className="flex-1" onClick={onRemoveFile}>Remove File</Button>
                    </div>
                    <input id="replaceFileInput" type="file" className="hidden" onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) handleFileUpload([e.target.files[0]])
                    }}
                    />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full w-full">
                  <div className="text-4xl text-gray-300 mb-2">
                    {contentType === "audio" && <AudioLines size={32} />}
                    {contentType === "image" && <Image size={32} />}
                    {contentType === "file" && <FileText size={32} />}
                  </div>
                  <p className="text-sm text-center text-gray-500 mb-2">Drag & drop a file here, or click to select</p>
                  <Button variant="outline" size="sm" onClick={() => document.getElementById('fileInput')?.click()}>Select File</Button>
                  <input id="fileInput" type="file" className="hidden" onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) handleFileUpload([e.target.files[0]])
                  }}
                  />
                </div>
              )}
            </div>
          </DropZone>

          {(uploading || error) && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center z-10 rounded-md">
              {uploading && <>
                <SwirlingEffectSpinner />
                <p className="text-sm font-medium mt-2">Uploading file...</p>
              </>
              }
              {!uploading && error && <>
                <div className="text-center p-4">
                  <p className="text-destructive font-medium mb-2">Error</p>
                  <p className="text-sm text-muted-foreground">{error}</p>
                  <Button variant="outline" size="sm" className="mt-4" onClick={() => setError(null)}>Dismiss</Button>
                </div>
              </>}
            </div>
          )}
        </div>
      </>}

    </div>
  </form.context>

}

export function TextNode(props: NodeProps) {
  const worker = useWorker<TextWorker>(props.id)
  return <NodeLayout worker={worker} resizable className="flex flex-col h-full" minHeight={400} minWidth={350}>
    <WorkerLabeledHandle handler={worker.fields.output} />
    <MemoizedWorker worker={worker} name="parameters">
      <Parameters worker={worker} />
    </MemoizedWorker>
    <ConditionHandler />
  </NodeLayout>
}
