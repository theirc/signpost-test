import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import React, { useState, useCallback, useMemo, ReactNode } from "react"
import { FilesModal } from "@/components/source_input/files-modal"
import { LiveDataModal } from "@/components/source_input/live-data-modal"
import { Loader2, RefreshCcw, Plus, X } from "lucide-react"
import { useSources } from "@/hooks/use-sources"
import { useSourceDisplay } from "@/hooks/use-source-display"
import { useSourceConfig, LiveDataElement } from "@/hooks/use-source-config"
import { formatDate } from "@/components/source_input/utils"
import { useTags } from "@/hooks/use-tags"
import DateFilter from "@/components/ui/date-filter"
import SearchFilter from "@/components/ui/search-filter"
import SelectFilter from "@/components/ui/select-filter"
import TagsFilter from "@/components/ui/tags-filter"
import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import CustomTable from "@/components/ui/custom-table"


interface PreviewContent {
  id: string;
  name: string;
  content: string;
  tags?: string[] | string;
  liveDataElements?: LiveDataElement[];
  isLiveData?: boolean;
}

export default function Sources() {
  const { sources, loading: sourcesLoading, fetchSources, deleteSource, updateSource } = useSources()
  const { sourcesDisplay, setSourcesDisplay } = useSourceDisplay(sources, sourcesLoading)
  const { getConfigForSource, getLiveDataElements } = useSourceConfig()
  const { tags, loading: tagsLoading, addTag } = useTags()
  const [loading, setLoading] = useState(false)
  const [previewContent, setPreviewContent] = React.useState<PreviewContent | null>(null)
  const [selectedElement, setSelectedElement] = React.useState<LiveDataElement | null>(null)
  const [filesModalOpen, setFilesModalOpen] = React.useState(false)
  const [liveDataModalOpen, setLiveDataModalOpen] = React.useState(false)
  const [newTag, setNewTag] = useState("")
  const [savingTags, setSavingTags] = useState(false)
  console.log('sources:', sourcesDisplay);

  const refreshSources = useCallback(() => {
    setLoading(true)
    fetchSources().finally(() => setLoading(false))
  }, [fetchSources])

  // Memoize the delete handler
  const handleDelete = useCallback(async (id: string) => {
    try {
      const success = await deleteSource(id)
      if (success) {
        setSourcesDisplay(prev => prev.filter(source => source.id !== id))
      }
    } catch (error) {
      console.error("Error deleting source:", error)
    }
  }, [deleteSource, setSourcesDisplay])

  // Memoize the preview handler
  const handlePreview = useCallback(async (id: string) => {
    const source = sources.find(source => source.id === id)
    if (!source) return
    const isLiveData = source.tags?.includes('Live Data')
    if (isLiveData) {
      const config = await getConfigForSource(source.id)
      const elements = config ? await getLiveDataElements(source.id) : []
      setPreviewContent({
        id: source.id,
        name: source.name,
        content: config ? JSON.stringify(config, null, 2) : 'No configuration found',
        tags: source.tags,
        liveDataElements: elements,
        isLiveData: true
      })
    } else {
      setPreviewContent({
        id: source.id,
        name: source.name,
        content: source.content,
        tags: source.tags,
        isLiveData: false
      })
    }
  }, [getConfigForSource, getLiveDataElements])

  // Handle adding a tag to the source
  const handleAddTag = async () => {
    if (!previewContent || !newTag.trim()) return;

    try {
      setSavingTags(true);

      // Ensure the tag exists in the tags table
      await addTag(newTag.trim());

      // Get the current tags and add the new one if not already present
      const currentTags = previewContent.tags || [];
      if (!currentTags.includes(newTag.trim())) {
        const updatedTags = [...currentTags, newTag.trim()];

        // Update the source with the new tags
        const updatedSource = await updateSource(previewContent.id, { tags: updatedTags });

        // Update the preview content and sources display
        setPreviewContent(prev => prev ? { ...prev, tags: updatedTags } : null);
        setSourcesDisplay(prev => prev.map(source =>
          source.id === previewContent.id ? { ...source, tags: updatedTags } : source
        ));
      }

      setNewTag("");
    } catch (error) {
      console.error("Error adding tag:", error);
    } finally {
      setSavingTags(false);
    }
  };

  // Handle removing a tag from the source
  const handleRemoveTag = async (tagToRemove: string) => {
    if (!previewContent) return;

    try {
      setSavingTags(true);

      // Get the current tags and remove the specified one
      const currentTags = previewContent.tags || [];
      const updatedTags = Array.isArray(currentTags)
        ? currentTags.filter((tag) => tag !== tagToRemove)
        : []

      // Update the source with the new tags
      const updatedSource = await updateSource(previewContent.id, { tags: updatedTags });

      // Update the preview content and sources display
      setPreviewContent(prev => prev ? { ...prev, tags: updatedTags } : null);
      setSourcesDisplay(prev => prev.map(source =>
        source.id === previewContent.id ? { ...source, tags: updatedTags } : source
      ));
    } catch (error) {
      console.error("Error removing tag:", error);
    } finally {
      setSavingTags(false);
    }
  };

  // Memoize modal handlers
  const handleFilesModalOpenChange = useCallback((open: boolean) => {
    setFilesModalOpen(open)
    if (!open) {
      refreshSources()
    }
  }, [refreshSources])

  const handleLiveDataModalOpenChange = useCallback((open: boolean) => {
    setLiveDataModalOpen(open)
    if (!open) {
      refreshSources()
    }
  }, [refreshSources])

  // Memoize the refresh handler
  const handleRefresh = useCallback(() => {
    refreshSources()
  }, [refreshSources])

  // Memoize the selected element content for preview
  const selectedElementContent = useMemo(() => {
    if (!selectedElement) return null
    return {
      title: selectedElement.metadata?.title || 'Live Data Element',
      version: selectedElement.version,
      status: selectedElement.status,
      content: selectedElement.content
    }
  }, [selectedElement])

  const columns: ColumnDef<any>[] = [
    { id: "name", accessorKey: "name", header: "Name", enableResizing: true, enableHiding: true, enableSorting: true, cell: (info) => info.getValue() },
    { id: "type", enableResizing: true, enableHiding: true, accessorKey: "type", header: "Type", enableSorting: false, cell: (info) => info.getValue() },
    { id: "lastUpdated", enableResizing: true, enableHiding: true, accessorKey: "lastUpdated", header: "Last Updated", enableSorting: true, cell: (info) => format(new Date(info.getValue() as string), "MMM dd, yyyy") },
    {
      id: "tags",
      accessorKey: "tags",
      header: "Tags",
      enableResizing: true,
      enableHiding: true,
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          {(row.original.tags || []).map(tag => {
            let tagStyle = "bg-muted"
            if (tag === 'File Upload') {
              tagStyle = "bg-blue-100 text-blue-800"
            } else if (tag === 'Live Data') {
              tagStyle = "bg-purple-100 text-purple-800"
            }
            return (
              <span
                key={tag}
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${tagStyle}`}
              >
                {tag}
              </span>
            )
          })}
        </div>
      ),
    }
  ]

  const filters = [
    {
      id: "search",
      label: "Search",
      component: SearchFilter,
      props: { filterKey: "search", placeholder: "Search sources..." },
    },
    {
      id: "types",
      label: "Types",
      component: SelectFilter,
      props: { filterKey: "type", placeholder: "All Types" },
    },
    {
      id: "range",
      label: "Date Created",
      component: DateFilter,
      props: { filterKey: "date_created", placeholder: "Pick a date" },
    },
    {
      id: "tags",
      label: "Tags",
      component: TagsFilter,
      props: { filterKey: "tags", placeholder: "All Tags" },
    }
  ]


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
        <div className="space-y-4">
          <CustomTable tableId="sources-table" columns={columns as any} data={sourcesDisplay} filters={filters} placeholder="No sources found" onEdit={handlePreview} onDelete={handleDelete} />
        </div>
      )}

      {/* Content Preview Dialog */}
      <Dialog open={!!previewContent} onOpenChange={() => setPreviewContent(null)}>
        <DialogContent className="sm:max-w-[800px] h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{previewContent?.name}</DialogTitle>
            <DialogDescription>
              {previewContent?.isLiveData ? 'Live data elements for this source' : 'Source content preview'}
            </DialogDescription>
          </DialogHeader>

          {/* Tag Management Section */}
          <div className="border-b pb-3">
            <h3 className="text-sm font-semibold mb-2">Tags</h3>
            <div className="flex flex-wrap gap-2 mb-3">
              {Array.isArray(previewContent?.tags) && previewContent?.tags?.map(tag => (
                <div key={tag} className="flex items-center bg-muted px-2 py-1 rounded text-sm">
                  <span>{tag}</span>
                  <button
                    className="ml-1 text-muted-foreground hover:text-foreground"
                    onClick={() => handleRemoveTag(tag)}
                    disabled={savingTags}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {!previewContent?.tags?.length && (
                <div className="text-sm text-muted-foreground">No tags</div>
              )}
            </div>
            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Add a new tag"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newTag.trim()) {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                className="max-w-xs"
              />
              <Button
                size="sm"
                onClick={handleAddTag}
                disabled={!newTag.trim() || savingTags}
              >
                {savingTags ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Add
              </Button>
            </div>
          </div>

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
                          Last updated: {formatDate(element.last_updated)}
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
            <DialogTitle>{selectedElementContent?.title}</DialogTitle>
            <DialogDescription>
              Version: {selectedElementContent?.version} | Status: {selectedElementContent?.status}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 mt-4 min-h-0">
            <div className="bg-muted p-4 rounded-md h-full overflow-y-auto">
              <pre className="text-sm font-mono whitespace-pre-wrap break-words">
                {selectedElementContent?.content}
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
        onSourcesUpdated={refreshSources}
      />

      <LiveDataModal
        open={liveDataModalOpen}
        onOpenChange={handleLiveDataModalOpenChange}
      />
    </div>
  )
} 