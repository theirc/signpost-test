import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { SourcesTable } from "./sources/sources-table"
import { SourceActions } from "./sources/components/source-actions"
import FilesModal from "./sources/files-modal"
import { LiveDataModal } from "./sources/live-data-modal"
import { HighlightText } from "@/components/ui/shadcn-io/highlight-text"


export default function Sources() {
  const navigate = useNavigate()
  const [showFilesModal, setShowFilesModal] = useState(false)
  const [showLiveDataModal, setShowLiveDataModal] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handlePreview = (source: { id: string }) => {
    navigate(`/sources/${source.id}`)
  }

  const handleSourceUpdate = () => {
    // Trigger table refresh
    setRefreshTrigger(prev => prev + 1)
  }

  return (
    <div className="flex-1 p-8 pt-6 flex flex-col h-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-3"><HighlightText text="Sources" className="text-4xl font-bold" /></h1>
          <p className="text-lg text-gray-600 font-medium leading-relaxed">
            Manage your data sources and their content.
          </p>
        </div>
        <SourceActions
          onUploadFiles={() => setShowFilesModal(true)}
          onAddLiveData={() => setShowLiveDataModal(true)}
        />
      </div>

      <SourcesTable onRowClick={handlePreview} refreshTrigger={refreshTrigger} />

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