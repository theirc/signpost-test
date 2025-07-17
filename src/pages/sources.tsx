import { useState } from "react"
import { SourcesTable } from "./sources/sources-table"
import { SourcePreview } from "./sources/source-preview"
import { SourceActions } from "./sources/components/source-actions"
import FilesModal from "./sources/files-modal"
import { LiveDataModal } from "./sources/live-data-modal"


export default function Sources() {
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null)
  const [showFilesModal, setShowFilesModal] = useState(false)
  const [showLiveDataModal, setShowLiveDataModal] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handlePreview = (source: { id: string }) => {
    setSelectedSourceId(source.id)
  }

  const handleSourceUpdate = () => {
    setSelectedSourceId(null)
    // Trigger table refresh
    setRefreshTrigger(prev => prev + 1)
  }

  return (
    <div className="flex-1 p-8 pt-6 flex flex-col h-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sources</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your data sources and their content.
          </p>
        </div>
        <SourceActions
          onUploadFiles={() => setShowFilesModal(true)}
          onAddLiveData={() => setShowLiveDataModal(true)}
        />
      </div>

      <SourcesTable onRowClick={handlePreview} refreshTrigger={refreshTrigger} />

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