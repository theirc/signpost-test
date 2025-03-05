import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react"
import { Controller, SubmitHandler, useForm } from "react-hook-form"
import { ThumbsDown, ThumbsUp, Flag } from "lucide-react"
import { useMultiState } from "../hooks/use-multistate"
import { api } from "../api/getBots"
import Markdown from "react-markdown"
import { useReactMediaRecorder } from "react-media-recorder"
import { ChatMessage, AI_SCORES } from "@/types/types.ai"

export function BotChatMessage(props: { m: ChatMessage; isWaiting: boolean; rebuild: () => void }) {

  let { isWaiting, rebuild, m } = props
  const [isModalOpen, setIsModalOpen] = useState(false)
  const {
    status,
    startRecording,
    stopRecording,
    mediaBlobUrl,
    clearBlobUrl,
  } = useReactMediaRecorder({ audio: true })

  console.log('MESSAGE ', m);
  const [state, setState] = useMultiState({
    open: false,
    positivie: "fail" as AI_SCORES,
  })

  const showModalPositive = () => {
    setState({ open: true, positivie: "pass" })
  }
  const showModalNegative = () => {
    setState({ open: true, positivie: "fail" })
  }
  const showModalRedFlag = () => {
    setState({ open: true, positivie: "redflag" })
  }

  const handleClose = () => {
    setIsModalOpen(false)
    setState({ open: false, positivie: "fail" })
  }

  const linklist = []

  if (m.docs && m.docs.length) {
    for (const doc of m.docs) {
      linklist.push(
        <div>
          <a href={doc.metadata.source} key={doc.metadata.source} target="_blank" className="font-medium no-underline text-blue-500">{doc.metadata.title}</a>
        </div>
      )
    }
  }

  return (
    <div>
      <div className="flex">
        {/* {!m.isContacts && <div className="">{m.message}</div>} */}
        {!m.isContacts && !m.tts && <div className="">
          <Markdown components={{
            a: ({ node, ...props }) => (
              <a {...props} target="_blank" rel="noopener noreferrer">
                {props.children}
              </a>
            ),
          }}>
            {m.message}
          </Markdown>
        </div>}

        {m.isContacts && (
          <div className="">
            {m.message}
            <div className="text-xs mt-2 mb-2 uppercase">
              <div className="font-medium no-underline">{linklist}</div>
            </div>
          </div>
        )}
        {!isWaiting && m.needsRebuild && <Button className="mx-2 -mt-1" type="button" onClick={rebuild} disabled={isWaiting}> {isWaiting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Rebuild"}</Button>}
      </div>
      {m.isAnswer && (
        <div className="text-gray-400 flex gap-2 mt-2">
          <ThumbsUp className="cursor-pointer" onClick={showModalPositive} />
          <ThumbsDown
            className="mt-1 cursor-pointer"
            onClick={showModalNegative}
          />
          <Flag
            className="mt-1 cursor-pointer text-red-500"
            onClick={showModalRedFlag}
          />
        </div>
      )}

      {m.tts && (
        <div className="test">
          <AudioComponent message={m.message} />
        </div>
      )}

      {linklist.length > 0 && !m.isContacts && (
        <div className="text-xs mt-4 uppercase">
          <div className="font-medium no-underline">
            <div className="mb-2">References:</div>
            {linklist}
          </div>
        </div>
      )}
      <BotScoreModal
        m={m}
        open={state.open}
        close={handleClose}
        score={state.positivie}
      />
    </div>
  )
}

type Inputs = {
  reporter: string
  sfr: string[]
  qmf: string[]
  redorq: "rtmf" | "qmf"
  expectedResult: string
  prompttype: string
  moderatorresponse: string
  traumametrics: number
  clientmetrics: number
  safetymetric: string
}

const failOptions = [
  {
    value: "Bias",
    label: "Bias",
  },
  {
    value: "Malicious",
    label: "Malicious",
  },
  {
    value: "Discrimination",
    label: "Discrimination",
  },
  {
    value: "Security Risk",
    label: "Security Risk",
  },
  {
    value: "Privacy",
    label: "Privacy",
  },
  {
    value: "Ethical Concern",
    label: "Ethical Concern",
  },
  {
    value: "Displacement",
    label: "Displacement",
  },
  {
    value: "Social Manipulation",
    label: "Social Manipulation",
  },
  {
    value: "Other",
    label: "Other",
  },
]

const qmf = [
  {
    value: "Trauma Informed",
    label: "Trauma Informed",
  },
  {
    value: "Client Centered",
    label: "Client Centered",
  },
  {
    value: "Safety / Do no Harm",
    label: "Safety / Do no Harm",
  },
]

const rating = [
  { value: "1", label: "1" },
  { value: "2", label: "2" },
  { value: "3", label: "3" },
]

const yesno = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
]

const prompttype = [
  {
    value: "user",
    label: "User Prompt",
  },
  {
    value: "synthetic",
    label: "Synthetic Prompt",
  },
]

const redorq = [
  {
    value: "rtmf",
    label: "Red Team Metrics",
  },
  {
    value: "qmf",
    label: "Quality Metric",
  },
]

function BotScoreModal(props: {
  m: ChatMessage
  open: boolean
  close: () => void
  score?: AI_SCORES
}) {
  const { m, open, close, score } = props
  const { botName, id } = m
  const [confirmLoading, setConfirmLoading] = useState(false)
  const {
    register,
    handleSubmit,
    clearErrors,
    formState: { errors },
    trigger,
    control,
    resetField,
    getValues,
    watch,
  } = useForm<Inputs>()

  const [showModeratorResponse, setShowModeratorResponse] = useState(false)
  const [metricType, setmMtricType] = useState("rtmf")

  useEffect(() => {
    const subscription = watch((value, { name, type }) => {
      if (name == "prompttype") {
        if (value.prompttype == "user") {
          setShowModeratorResponse(true)
        } else {
          setShowModeratorResponse(false)
        }
      }

      if (value.redorq == "rtmf") {
        setmMtricType("rtmf")
      } else {
        setmMtricType("qmf")
      }
    })
    return () => subscription.unsubscribe()
  }, [watch])

  const onSubmit: SubmitHandler<Inputs> = async (data) => {

    await api.qualifyBot({
      id,
      score,
      reporter: data.reporter,
      result: data.expectedResult,
      question: m.question,
      answer: m.message,
      failtype: data.sfr || [],
      qualitymetrics: data.qmf || [],
      prompttype: data.prompttype,
      moderatorresponse: data.moderatorresponse,
      clientmetrics: data.clientmetrics,
      safetymetric: data.safetymetric,
      traumametrics: data.traumametrics,
      logid: `https://directus-qa.azurewebsites.net/admin/content/botlogs/${m.logID}`
    })
  }

  const handleOk = async () => {
    setConfirmLoading(true)
    const isOk = await trigger()

    if (isOk) {
      await handleSubmit(onSubmit)()
      setConfirmLoading(false)
      close()
    }

    setConfirmLoading(false)
  }

  const onCloseForm = () => {
    clearErrors()
    resetField("expectedResult")
    resetField("sfr")
    resetField("qmf")
    resetField("moderatorresponse")
    resetField("safetymetric")
    resetField("traumametrics")
    resetField("clientmetrics")
  }

  const title =
    score == "fail"
      ? "Qualify Negative"
      : score == "pass"
        ? "Qualify Positive"
        : "Red Flag"

  const isFail = score == "fail" || score == "redflag"
  const required = score == "fail"

  return(
  <Dialog open={open} onOpenChange={close}>
  <DialogContent className="max-h-[calc(100vh-4rem)] overflow-y-auto">
    <DialogHeader>
      <DialogTitle>{botName} - {title}</DialogTitle>
    </DialogHeader>

    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 p-4">
      {/* Reporter */}
      <div>
        <label className="font-medium mb-1 block">Reporter</label>
        <Controller
          name="reporter"
          control={control}
          rules={{ required: true }}
          render={({ field }) => <Input {...field} />}
        />
        {errors.reporter && <span className="text-red-500">This field is required</span>}
      </div>

      {/* Red Team Metrics */}
      {metricType === "rtmf" && (
        <div>
          <label className="font-medium mb-1 block">
            {isFail ? `Red Team Metrics Flag` : `Red Team Objective`}
          </label>
          <Controller
            name="sfr"
            control={control}
            rules={{ required: metricType === "rtmf" }}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value?.toString()}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Please select" />
                </SelectTrigger>
                <SelectContent>
                  {failOptions.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.sfr && <span className="text-red-500">This field is required</span>}
        </div>
      )}

      {metricType === "qmf" && (
        <div>
        <div>
          <label className="font-medium mb-1 block">
            {isFail ? "Quality Metric Flag" : "Quality Team Objective"}
          </label>
          <Controller
            name="qmf"
            control={control}
            rules={{ required: metricType === "qmf" }}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value?.toString()}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Metric" />
                </SelectTrigger>
                <SelectContent>
                  {qmf.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.qmf && <span className="text-red-500">This field is required</span>}
        </div>
        <div>
          <label className="font-medium mb-1 block">Trauma Informed</label>
          <Controller
            name="traumametrics"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value?.toString()}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Rating" />
                </SelectTrigger>
                <SelectContent>
                  {rating.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.traumametrics && <span className="text-red-500">This field is required</span>}
        </div>

        <div>
          <label className="font-medium mb-1 block">Client Centered</label>
          <Controller
            name="clientmetrics"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value?.toString()}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Rating" />
                </SelectTrigger>
                <SelectContent>
                  {rating.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.clientmetrics && <span className="text-red-500">This field is required</span>}
        </div>
        <div>
          <label className="font-medium mb-1 block">Safety / Do No Harm</label>
          <Controller
            name="safetymetric"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Rating" />
                </SelectTrigger>
                <SelectContent>
                  {yesno.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.safetymetric && <span className="text-red-500">This field is required</span>}
        </div>
        </div>
      )}

      {/* Prompt Type */}
      <div>
        <label className="font-medium mb-1 block">Prompt Type</label>
        <Controller
          name="prompttype"
          control={control}
          render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Please select" />
              </SelectTrigger>
              <SelectContent>
                {prompttype.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>

      {/* Moderator Response */}
      {showModeratorResponse && (
        <div>
          <label className="font-medium mb-1 block">Moderator Response</label>
          <Controller
            name="moderatorresponse"
            control={control}
            rules={{ required: true }}
            render={({ field }) => <Textarea {...field} />}
          />
          {errors.moderatorresponse && <span className="text-red-500">This field is required</span>}
        </div>
      )}

      {/* Comments */}
      <div>
        <label className="font-medium mb-1 block">Comments</label>
        <Controller
          name="expectedResult"
          control={control}
          rules={{ required: true }}
          render={({ field }) => <Textarea {...field} />}
        />
        {errors.expectedResult && <span className="text-red-500">This field is required</span>}
      </div>

      {/* Footer Buttons */}
      <DialogFooter>
        <Button type="button" variant="outline" onClick={close}>Cancel</Button>
        <Button type="submit" disabled={confirmLoading}>Submit</Button>
      </DialogFooter>
    </form>
  </DialogContent>
</Dialog>
);
}

function AudioComponent(props: { message: string }) {
  const { message } = props

  const base64ToBlob = (base64: string, contentType = 'audio/wav', sliceSize = 512) => {
    const byteCharacters = atob(base64)
    const byteArrays: Uint8Array[] = []

    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
      const slice = byteCharacters.slice(offset, offset + sliceSize)

      const byteNumbers = new Array(slice.length)
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i)
      }

      const byteArray = new Uint8Array(byteNumbers)
      byteArrays.push(byteArray)
    }

    const audio = new Blob(byteArrays, { type: contentType })

    return URL.createObjectURL(audio)
  }

  return (
    <audio controls src={base64ToBlob(message)} className="mt-4" />
  )
}