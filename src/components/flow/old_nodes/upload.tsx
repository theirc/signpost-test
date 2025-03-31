import { LabeledHandle } from "@/components/labeled-handle"
import { Position } from '@xyflow/react'
import { Upload } from "lucide-react"
import { NodeLayout } from './node'
import { NodeTitle } from './title'
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

// Import the shared sources and table component from their new location
import { availableSources } from "@/components/source_input/files-modal"
// import { SourcesTable } from "@/components/sources-table"

export function DocumentUploadNode({ data, isConnectable }) {
  const [showOutput, setShowOutput] = useState(false)
  const [previewContent, setPreviewContent] = useState<{ name: string; content: string } | null>(null)
  const [selectedSources, setSelectedSources] = useState<string[]>([])
  const [sources, setSources] = useState(availableSources)

  // Update local sources when shared sources change
  useEffect(() => {
    setSources(availableSources)
  }, [availableSources])

  // Format content in a consistent structure
  const formatContent = () => {
    const selectedContent = selectedSources
      .map(id => sources.find(source => source.id === id))
      .filter(Boolean)
      .map(source => `<h2>${source?.name}</h2>\n${source?.content}`)
      .join('\n\n')

    const formattedContent = `
      <div class="content-wrapper">
          <div class="description mb-4 text-muted-foreground">
          <h2 class="text-lg font-semibold mb-2">Selected Sources</h2>
          <p>Combined content from ${selectedSources.length} selected sources</p>
        </div>
        <div class="main-content">
          ${selectedContent}
          </div>
      </div>
    `

    // Store the formatted content directly in the node's data
    if (data) {
      data.content = formattedContent
      data.type = "source-content"
      data.description = `Combined content from ${selectedSources.length} selected sources`
      data.rawContent = selectedSources
        .map(id => sources.find(source => source.id === id))
        .filter(Boolean)
        .map(source => source?.content)
        .join('\n\n')
      data.icon = "Upload"
      data.title = "Source Content"
      data.lastUpdated = new Date().toISOString()
      data.selectedSources = selectedSources
    }

    return formattedContent
  }

  const handleToggleSelect = (id: string) => {
    setSelectedSources(prev =>
      prev.includes(id)
        ? prev.filter(sourceId => sourceId !== id)
        : [...prev, id]
    )
    // Format and store content when selection changes
    formatContent()
  }

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedSources(event.target.checked ? sources.map(source => source.id) : [])
    // Format and store content when selection changes
    formatContent()
  }

  // Initialize content on mount
  useEffect(() => {
    formatContent()
  }, [])

  return <NodeLayout>
    <NodeTitle title="Select Sources" icon={Upload} />
    <div className="relative">
      <LabeledHandle
        id="output"
        title="Output"
        type="source"
        position={Position.Right}
        style={{ top: 20 }}
      />
      <div className="w-full px-4 pt-16 pb-4">
        <div className='space-y-4'>
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-medium">Available Sources</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowOutput(true)}
              className="px-2 py-1 h-7"
            >
              View Output
            </Button>
          </div>

          {/* <SourcesTable
            sources={sources}
            selectedSources={selectedSources}
            onToggleSelect={handleToggleSelect}
            onSelectAll={handleSelectAll}
            onPreview={(source) => setPreviewContent({
              name: source.name,
              content: source.content
            })}
            showCheckboxes={true}
          /> */}

          <div className="text-sm text-gray-500">
            {selectedSources.length} sources selected
          </div>
        </div>
      </div>

      {/* Content Preview Dialog */}
      <Dialog open={!!previewContent} onOpenChange={() => setPreviewContent(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{previewContent?.name}</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <div className="bg-muted p-4 rounded-md">
              <pre className="whitespace-pre-wrap text-sm font-mono">
                {previewContent?.content}
              </pre>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Output Preview Dialog */}
      <Dialog open={showOutput} onOpenChange={setShowOutput}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Combined Content</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <div className="bg-muted p-4 rounded-md">
              {selectedSources.length > 0 ? (
                <pre className="whitespace-pre-wrap text-sm font-mono">
                  {formatContent()}
                </pre>
              ) : (
                <p className="text-sm text-muted-foreground">No sources selected</p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  </NodeLayout>
} 