import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import React, { useState, useCallback, useMemo, useEffect } from "react"
import { FilesModal } from "@/components/source_input/files-modal"
import { LiveDataModal } from "@/components/source_input/live-data-modal"
import { Loader2, RefreshCcw, Plus, X } from "lucide-react"
import { formatDate } from "@/components/source_input/utils"
import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import CustomTable from "@/components/ui/custom-table"
import { DropZone } from "@/components/ui/drop-zone"
import { 
  transformSourcesForDisplay, 
  getConfigForSource, 
  getLiveDataElements,
  SourceDisplay,
  LiveDataElement,
  fetchSources,
  updateSource,
  Source,
  addTag
} from '@/lib/data/supabaseFunctions'

// Define Tag type if not already globally available (or import if defined in supabaseFunctions)
type Tag = { id: string; name: string; }; 

interface PreviewContent {
  id: string;
  name: string;
  content: string;
  tags?: string[] | string;
  liveDataElements?: LiveDataElement[];
  isLiveData?: boolean;
}

export default function Sources() {
  console.log("[Sources Page] Component Mounting/Rendering"); // Mount Log

  const [sources, setSources] = useState<Source[]>([])
  const [loading, setLoading] = useState(true) // Start loading true
  const [previewContent, setPreviewContent] = React.useState<PreviewContent | null>(null)
  const [selectedElement, setSelectedElement] = React.useState<LiveDataElement | null>(null)
  const [filesModalOpen, setFilesModalOpen] = React.useState(false)
  const [liveDataModalOpen, setLiveDataModalOpen] = React.useState(false)
  const [newTag, setNewTag] = useState("")
  const [savingTags, setSavingTags] = useState(false)
  const [sourcesDisplay, setSourcesDisplay] = useState<SourceDisplay[]>([])
  const [droppedFiles, setDroppedFiles] = useState<File[]>([])

  const fetchSourcesData = useCallback(async () => {
    console.log("[fetchSourcesData] Starting fetch...");
    // Use the single loading state
    setLoading(true); 
    console.log("[State Change] setLoading(true)");
    try {
      const { data, error } = await fetchSources()
      if (error) {
        console.error("[fetchSourcesData] Error fetching sources:", error)
        console.log("[fetchSourcesData] Setting sources to [] due to error.");
        setSources([])
      } else {
        const fetchedSources = data || [];
        console.log(`[fetchSourcesData] Fetched ${fetchedSources.length} sources. Setting state.`);
        setSources(fetchedSources)
      }
    } catch (err) {
      console.error("[fetchSourcesData] Exception fetching sources:", err)
      console.log("[fetchSourcesData] Setting sources to [] due to exception.");
      setSources([])
    } finally {
      // Set loading false AFTER data is fetched (and state potentially set)
      setLoading(false);
      console.log("[State Change] setLoading(false)");
    }
  }, []) // Removed fetchSources dependency - it's defined outside

  useEffect(() => {
    console.log("[Initial Fetch Effect] Running...");
    fetchSourcesData()
  }, [fetchSourcesData])

  React.useEffect(() => {
    console.log(`[Transform Effect] Running. Loading: ${loading}, Sources Count: ${sources.length}`);
    if (!loading && sources.length > 0) {
      console.log("[Transform Effect] Transforming sources...");
      const display = transformSourcesForDisplay(sources)
      console.log(`[Transform Effect] Setting sourcesDisplay with ${display.length} items.`);
      setSourcesDisplay(display)
    } else if (!loading && sources.length === 0) {
      console.log("[Transform Effect] Sources empty and not loading. Setting sourcesDisplay to [].");
      setSourcesDisplay([])
    } else if (loading) {
        console.log("[Transform Effect] Still loading. Not transforming yet.");
    }
  }, [sources, loading]) // Depend on sources and the main loading state

  const refreshSources = useCallback(() => {
    console.log("[refreshSources] Triggered.");
    fetchSourcesData() // Directly call fetchSourcesData
  }, [fetchSourcesData])

  const handlePreview = useCallback(async (id: string) => {
    const source = sources.find(source => source.id === id)
    if (!source) return
    const isLiveData = source.tags?.includes('Live Data')
    if (isLiveData) {
      const { data: config, error: configError } = await getConfigForSource(source.id)
      if (configError) {
        console.error('Error getting config:', configError)
        return
      }
      const { data: elements, error: elementsError } = await getLiveDataElements(source.id)
      if (elementsError) {
        console.error('Error getting live data elements:', elementsError)
        return
      }
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
  }, [sources])

  const handleAddTag = async () => {
    if (!previewContent || !newTag.trim()) return;

    try {
      setSavingTags(true);

      const { data: tagData, error: tagError } = await addTag(newTag.trim());
      if (tagError) {
        console.error("Error ensuring tag exists:", tagError);
        throw tagError;
      }

      const currentTags = Array.isArray(previewContent.tags) ? previewContent.tags : [];
      const updatedTags = [...currentTags, newTag.trim()];

      const { data: updatedSourceData, error: updateError } = await updateSource(previewContent.id, { tags: updatedTags });

      if (updateError) {
        console.error("Error updating source tags:", updateError);
        throw updateError;
      }

      if (updatedSourceData) {
        setSources(prevSources => prevSources.map(s =>
          s.id === previewContent.id ? { ...s, tags: updatedTags } : s
        ));
        setPreviewContent(prev => prev ? { ...prev, tags: updatedTags } : null);
      }

      setNewTag("");
    } catch (error) {
      console.error("Error adding tag:", error);
    } finally {
      setSavingTags(false);
    }
  };

  const handleRemoveTag = async (tagToRemove: string) => {
    if (!previewContent) return;

    try {
      setSavingTags(true);

      const currentTags = previewContent.tags || [];
      const updatedTags = Array.isArray(currentTags)
        ? currentTags.filter((tag) => tag !== tagToRemove)
        : []

      const { data: updatedSourceData, error: updateError } = await updateSource(previewContent.id, { tags: updatedTags });

      if (updateError) {
        console.error("Error updating source tags:", updateError);
        throw updateError;
      }

      if (updatedSourceData) {
        setSources(prevSources => prevSources.map(s =>
          s.id === previewContent.id ? { ...s, tags: updatedTags } : s
        ));
        setPreviewContent(prev => prev ? { ...prev, tags: updatedTags } : null);
      }
    } catch (error) {
      console.error("Error removing tag:", error);
    } finally {
      setSavingTags(false);
    }
  };

  const handleFilesDrop = useCallback(async (files: File[]) => {
    setDroppedFiles(files);
    setFilesModalOpen(true);
  }, []);

  const handleRefresh = useCallback(() => {
    refreshSources()
  }, [refreshSources])

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

  // Log state just before render
  console.log(`[Render] SourcesDisplay length: ${sourcesDisplay.length}, Loading: ${loading}`);

  return (
    <DropZone onFilesDrop={handleFilesDrop} className="flex flex-col h-full">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Sources</h1>
          <div className="flex gap-2">
            <Button onClick={() => setLiveDataModalOpen(true)} variant="outline">
              Add Live Data
            </Button>
            <Button variant="outline" onClick={handleRefresh}>
              <RefreshCcw className="h-4 w-4 mr-2" />
              Refresh Sources
            </Button>
            <Button onClick={() => setFilesModalOpen(true)}>
              Upload Files
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Manage your data sources and their content. Drag and drop files anywhere to upload.
          </div>

          {loading ? (
            <div className="w-full h-64 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="space-y-4">
              <CustomTable 
                tableId="sources-table" 
                columns={columns as any} 
                data={sourcesDisplay} 
                filters={[]} // Pass empty array to disable filters
                placeholder="No sources found"
                onRowClick={(row) => handlePreview(row.id)}
              />
            </div>
          )}
        </div>
      </div>

      <FilesModal
        open={filesModalOpen}
        onOpenChange={setFilesModalOpen}
        onSourcesUpdated={handleRefresh}
        initialFiles={droppedFiles}
      />

      <LiveDataModal
        open={liveDataModalOpen}
        onOpenChange={setLiveDataModalOpen}
        onSourcesUpdated={handleRefresh}
      />

      <Dialog open={!!previewContent} onOpenChange={() => setPreviewContent(null)}>
        <DialogContent className="sm:max-w-[800px] h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{previewContent?.name}</DialogTitle>
            <DialogDescription>
              {previewContent?.isLiveData ? 'Live data elements for this source' : 'Source content preview'}
            </DialogDescription>
          </DialogHeader>

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
    </DropZone>
  )
} 