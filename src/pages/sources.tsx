import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import React, { useState } from "react"
import { FilesModal } from "../components/old_forms/files-modal"
import { LiveDataModal } from "../components/old_forms/live-data-modal"
import { SourcesTable } from "@/components/sources-table"
import { Loader2, RefreshCcw, MoreVertical } from "lucide-react"
import { useSources } from "@/hooks/use-sources"
import { useSourceDisplay } from "@/hooks/use-source-display"
import { useSourceConfig } from "@/hooks/use-source-config"

export default function Sources() {
  const { sources, loading: sourcesLoading, fetchSources, deleteSource } = useSources()
  const { sourcesDisplay, setSourcesDisplay } = useSourceDisplay(sources, sourcesLoading)
  const { getConfigForSource } = useSourceConfig()
  const [loading, setLoading] = useState(false)
  const [previewContent, setPreviewContent] = React.useState<{ name: string; content: string; type?: 'content' | 'config' } | null>(null)
  const [filesModalOpen, setFilesModalOpen] = React.useState(false)
  const [liveDataModalOpen, setLiveDataModalOpen] = React.useState(false)

  // Manual refresh button handler  
  const handleRefresh = () => {
    setLoading(true)
    fetchSources().finally(() => setLoading(false))
  }

  const handleDelete = async (id: string) => {
    try {
      // Call the deleteSource function from the hook
      const success = await deleteSource(id)

      if (success) {
        // Update local state
        setSourcesDisplay(sourcesDisplay.filter(source => source.id !== id))
      }
    } catch (error) {
      console.error("Error deleting source:", error)
    }
  }

  const handleViewContent = async (source: { id: string; name: string; content: string; tags?: string[] }) => {
    setPreviewContent({
      name: `${source.name} - Content`,
      content: source.content,
      type: 'content'
    })
  }

  const handleViewConfig = async (source: { id: string; name: string; content: string; tags?: string[] }) => {
    const config = await getConfigForSource(source.id)
    setPreviewContent({
      name: `${source.name} - Configuration`,
      content: config ? JSON.stringify(config, null, 2) : 'No configuration found',
      type: 'config'
    })
  }

  // Custom action renderer for the SourcesTable
  const renderActions = (source: { id: string; name: string; content: string; tags?: string[] }) => {
    const isLiveData = source.tags?.includes('Live Data')
    
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => handleViewContent(source)}>
            View Content
          </DropdownMenuItem>
          {isLiveData && (
            <DropdownMenuItem onClick={() => handleViewConfig(source)}>
              View Config
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            onClick={() => handleDelete(source.id)}
            className="text-red-600"
          >
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  // Update sources when files modal closes
  const handleFilesModalOpenChange = (open: boolean) => {
    setFilesModalOpen(open)
  }

  // Handle live data modal close
  const handleLiveDataModalOpenChange = (open: boolean) => {
    setLiveDataModalOpen(open)
    if (!open) {
      // Refresh sources when modal closes
      fetchSources()
    }
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">All Sources</h1>
        <div className="flex gap-2">
          <Button onClick={() => setFilesModalOpen(true)}>
            Upload Files
          </Button>
          <Button onClick={() => setLiveDataModalOpen(true)} variant="outline">
            Add Live Data
          </Button>
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCcw className="h-4 w-4 mr-2" />
            Refresh Sources
          </Button>
        </div>
      </div>

      {loading || sourcesLoading ? (
        <div className="w-full h-64 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <SourcesTable
          sources={sourcesDisplay}
          showCheckboxes={false}
          showActions={true}
          renderActions={renderActions}
        />
      )}

      {/* Content Preview Dialog */}
      <Dialog open={!!previewContent} onOpenChange={() => setPreviewContent(null)}>
        <DialogContent className="sm:max-w-[800px] h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{previewContent?.name}</DialogTitle>
            <DialogDescription>
              {previewContent?.type === 'config' ? 'Source configuration details' : 'Source content'}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 mt-4 min-h-0">
            <div className="bg-muted p-4 rounded-md h-full overflow-y-auto">
              <pre className="text-sm font-mono whitespace-pre-wrap break-words" style={{ maxWidth: '100%' }}>
                {previewContent?.content}
              </pre>
            </div>
          </div>
          <DialogFooter className="mt-4 border-t pt-4">
            <Button variant="outline" onClick={() => setPreviewContent(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <FilesModal
        open={filesModalOpen}
        onOpenChange={handleFilesModalOpenChange}
      />

      <LiveDataModal
        open={liveDataModalOpen}
        onOpenChange={handleLiveDataModalOpenChange}
      />
    </div>
  )
} 