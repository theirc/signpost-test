import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import React, { useState } from "react"
import { FilesModal } from "../components/old_forms/files-modal"
import { LiveDataModal } from "../components/old_forms/live-data-modal"
import { SourcesTable } from "@/components/sources-table"
import { Loader2, RefreshCcw } from "lucide-react"
import { useSources } from "@/hooks/use-sources"
import { useSourceDisplay } from "@/hooks/use-source-display"
import { useSourceConfig, LiveDataElement } from "@/hooks/use-source-config"

interface PreviewContent {
  name: string;
  content: string;
  liveDataElements?: LiveDataElement[];
  isLiveData?: boolean;
}

export default function Sources() {
  const { sources, loading: sourcesLoading, fetchSources, deleteSource } = useSources()
  const { sourcesDisplay, setSourcesDisplay } = useSourceDisplay(sources, sourcesLoading)
  const { getConfigForSource, getLiveDataElements } = useSourceConfig()
  const [loading, setLoading] = useState(false)
  const [previewContent, setPreviewContent] = React.useState<PreviewContent | null>(null)
  const [selectedElement, setSelectedElement] = React.useState<LiveDataElement | null>(null)
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

  const handlePreview = async (source: { id: string; name: string; content: string; tags?: string[] }) => {
    const isLiveData = source.tags?.includes('Live Data')
    if (isLiveData) {
      const config = await getConfigForSource(source.id)
      const elements = config ? await getLiveDataElements(source.id) : []
      setPreviewContent({
        name: source.name,
        content: config ? JSON.stringify(config, null, 2) : 'No configuration found',
        liveDataElements: elements,
        isLiveData: true
      })
    } else {
      setPreviewContent({
        name: source.name,
        content: source.content,
        isLiveData: false
      })
    }
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
          onPreview={handlePreview}
          onDelete={handleDelete}
        />
      )}

      {/* Content Preview Dialog */}
      <Dialog open={!!previewContent} onOpenChange={() => setPreviewContent(null)}>
        <DialogContent className="sm:max-w-[800px] h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{previewContent?.name}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 mt-4 min-h-0">
            {previewContent?.isLiveData ? (
              <div className="h-full">
                <div className="bg-muted p-4 rounded-md overflow-y-auto h-full">
                  <h3 className="font-semibold mb-4">Live Data Elements</h3>
                  <div className="space-y-2">
                    {previewContent.liveDataElements?.map((element) => (
                      <div
                        key={element.id}
                        onClick={() => setSelectedElement(element)}
                        className="p-4 bg-background rounded cursor-pointer hover:bg-accent"
                      >
                        <div className="font-medium">{element.metadata?.title || 'Untitled'}</div>
                        <div className="text-sm text-muted-foreground mt-1">
                          Last updated: {new Date(element.last_updated || '').toLocaleString()}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Version: {element.version}
                        </div>
                      </div>
                    ))}
                    {(!previewContent.liveDataElements || previewContent.liveDataElements.length === 0) && (
                      <div className="text-center text-muted-foreground p-4">
                        No live data elements found
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-muted p-4 rounded-md h-full overflow-y-auto">
                <pre className="text-sm font-mono whitespace-pre-wrap break-words">
                  {previewContent?.content}
                </pre>
              </div>
            )}
          </div>
          <DialogFooter className="mt-4 border-t pt-4">
            <Button variant="outline" onClick={() => setPreviewContent(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Live Data Element Detail Modal */}
      <Dialog open={!!selectedElement} onOpenChange={() => setSelectedElement(null)}>
        <DialogContent className="sm:max-w-[800px] h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{selectedElement?.metadata?.title || 'Live Data Element'}</DialogTitle>
            <DialogDescription>
              Version: {selectedElement?.version} | Status: {selectedElement?.status}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 mt-4 min-h-0">
            <div className="bg-muted p-4 rounded-md h-full overflow-y-auto">
              <pre className="text-sm font-mono whitespace-pre-wrap break-words">
                {selectedElement?.content}
              </pre>
            </div>
          </div>
          <DialogFooter className="mt-4 border-t pt-4">
            <Button variant="outline" onClick={() => setSelectedElement(null)}>Close</Button>
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