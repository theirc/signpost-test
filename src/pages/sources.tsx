import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import React from "react"
import { FilesModal } from "../components/forms/files-modal"
import { LiveDataModal, liveDataConfigs } from "../components/forms/live-data-modal"
import { availableSources, updateAvailableSources } from "../components/forms/files-modal"
import { SourcesTable } from "@/components/sources-table"
import { Book } from "lucide-react"

export function SourcesManagement() {
  const [sources, setSources] = React.useState(availableSources)
  const [previewContent, setPreviewContent] = React.useState<{ name: string; content: string } | null>(null)
  const [filesModalOpen, setFilesModalOpen] = React.useState(false)
  const [liveDataModalOpen, setLiveDataModalOpen] = React.useState(false)

  // Keep sources in sync with availableSources and ensure tags are present
  React.useEffect(() => {
    // Map over sources to ensure each has a tags array
    const sourcesWithTags = availableSources.map(source => ({
      ...source,
      tags: source.tags || [] // Ensure tags is at least an empty array
    }))
    setSources(sourcesWithTags)
  }, [filesModalOpen])

  const handleDelete = (id: string) => {
    // Update both local state and availableSources
    const newSources = sources.filter(source => source.id !== id)
    setSources(newSources)
    updateAvailableSources(availableSources.filter(source => source.id !== id))
  }

  const handlePreview = (source: { id: string; name: string; content: string; tags?: string[] }) => {
    // Check if this is a live data source
    const isLiveData = source.tags?.includes('Live Data')
    if (isLiveData) {
      const config = liveDataConfigs.find(c => c.sourceId === source.id)
      setPreviewContent({
        name: source.name,
        content: config ? JSON.stringify(config, null, 2) : 'No configuration found'
      })
    } else {
      setPreviewContent({
        name: source.name,
        content: source.content
      })
    }
  }

  // Update sources when files modal closes
  const handleFilesModalOpenChange = (open: boolean) => {
    setFilesModalOpen(open)
    if (!open) {
      // Update sources when files modal closes
      setSources(availableSources)
    }
  }

  return (
    <div className="grid gap-4">
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
        <div className="flex flex-col space-y-1.5 p-6">
          <h3 className="text-2xl font-semibold leading-none tracking-tight">Sources Management</h3>
          <p className="text-sm text-muted-foreground">
            Manage your knowledge sources and data connections
          </p>
        </div>
        <div className="p-6 pt-0">
          <div className="space-y-4">
            {sources.length > 0 ? (
              <SourcesTable 
                sources={sources}
                onPreview={handlePreview}
                onDelete={handleDelete}
                onAddNew={() => setFilesModalOpen(true)}
                onConnectLiveData={() => setLiveDataModalOpen(true)}
                showCheckboxes={false}
                showActions={true}
                showAddButton={true}
              />
            ) : (
              <div className="rounded-md border border-dashed p-8 text-center">
                <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center">
                  <Book className="h-10 w-10 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold">No Sources</h3>
                  <p className="text-sm text-muted-foreground mt-2 mb-4">
                    Add your first data source to start building your knowledge base.
                  </p>
                  <div className="flex gap-2">
                    <Button 
                      variant="default"
                      onClick={() => setFilesModalOpen(true)}
                    >
                      Upload Files
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => setLiveDataModalOpen(true)}
                    >
                      Connect Live Data
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content Preview Dialog */}
      <Dialog open={!!previewContent} onOpenChange={() => setPreviewContent(null)}>
        <DialogContent className="sm:max-w-[800px] h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{previewContent?.name}</DialogTitle>
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
        onOpenChange={setLiveDataModalOpen}
        onSourcesUpdate={setSources}
      />
    </div>
  )
} 