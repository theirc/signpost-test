import { useState } from "react"
import { SourcesTable } from "./sources/sources-table"
import { SourcePreview } from "./sources/source-preview"
import { SourceActions } from "./sources/source-actions"
import { FilesModal } from "./sources/files-modal"
import { LiveDataModal } from "./sources/live-data-modal"
import { DropZone } from "@/components/ui/drop-zone"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/data/supabaseFunctions"
import { useTeamStore } from "@/lib/hooks/useTeam"

export default function Sources() {
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null)
  const [showFilesModal, setShowFilesModal] = useState(false)
  const [showLiveDataModal, setShowLiveDataModal] = useState(false)
  const { toast } = useToast()
  const { selectedTeam } = useTeamStore()

  const handlePreview = (source: { id: string }) => {
    setSelectedSourceId(source.id)
  }

  const handleSourceUpdate = () => {
    setSelectedSourceId(null)
  }

  const handleFilesDrop = async (files: File[]) => {
    console.log("handleFilesDrop called with files:", files)
    if (!selectedTeam) {
      console.log("No team selected in handleFilesDrop")
      toast({
        title: "Error",
        description: "Please select a team first",
        variant: "destructive"
      })
      return
    }
    console.log("Selected team:", selectedTeam)
    try {
      const parsedFiles = await Promise.all(
        files.map(async (file) => {
          const content = await file.text()
          console.log(`Parsed file: ${file.name}, type: ${file.type}`)
          return {
            id: Math.random().toString(36).substring(7),
            name: file.name,
            content,
            type: file.type
          }
        })
      )
      console.log("Parsed files:", parsedFiles)
      const sourcesToInsert = parsedFiles.map(file => {
        const formattedTags = JSON.stringify(['File Upload', file.name.split('.').pop() || ''])
          .replace(/"/g, '')
          .replace('[', '{')
          .replace(']', '}')
        return {
          name: file.name,
          type: 'File',
          content: file.content,
          tags: formattedTags,
          team_id: selectedTeam.id
        }
      })
      console.log("Sources to insert into Supabase:", sourcesToInsert)
      const { error } = await supabase
        .from('sources')
        .insert(sourcesToInsert)
      if (error) {
        console.error("Supabase insert error:", error)
        throw error
      }
      console.log("Files uploaded successfully!")
      toast({
        title: "Success",
        description: "Files uploaded successfully"
      })
      handleSourceUpdate()
    } catch (error) {
      console.error("Error uploading files:", error)
      toast({
        title: "Error",
        description: "Failed to upload files",
        variant: "destructive"
      })
    }
  }

  return (
    <div className="flex-1 p-8 pt-6 flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sources</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your data sources and their content. Drag and drop files anywhere to upload.
          </p>
        </div>
        <SourceActions
          onUploadFiles={() => setShowFilesModal(true)}
          onAddLiveData={() => setShowLiveDataModal(true)}
        />
      </div>

      <div className="mb-6">
        <DropZone onFilesDrop={handleFilesDrop}>
          <div className="text-sm text-muted-foreground">
            Drag and drop files here, or click to select files.
          </div>
        </DropZone>
      </div>

      <div className="flex-1 flex flex-col">
        <SourcesTable onRowClick={handlePreview} />
      </div>

      <SourcePreview
        sourceId={selectedSourceId}
        onClose={() => setSelectedSourceId(null)}
        onSourceUpdate={handleSourceUpdate}
      />

      <FilesModal
        open={showFilesModal}
        onOpenChange={setShowFilesModal}
        onSourcesUpdated={handleSourceUpdate}
      />

      <LiveDataModal
        open={showLiveDataModal}
        onOpenChange={setShowLiveDataModal}
        onSourcesUpdated={handleSourceUpdate}
      />
    </div>
  )
} 