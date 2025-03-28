import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import { X, Loader2, Upload, FolderOpen } from "lucide-react"
import React from "react"
import { useFileParser } from "@/lib/fileUtilities/use-file-parser"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FolderCrawler } from "./folder-crawler"
import { uploadSources, ParsedFile, fetchTags, addTag as addTagToDb } from '@/lib/data/supabaseFunctions'

// Define Tag type if needed
type Tag = { id: string; name: string; };

interface FilesModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSourcesUpdated: () => void
}

export function FilesModal({ open, onOpenChange, onSourcesUpdated }: FilesModalProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const { isLoading: parsingFiles, parseFiles, supportedTypes } = useFileParser()
  const [tags, setTags] = useState<Tag[]>([])
  const [tagsLoading, setTagsLoading] = useState(true)
  
  const [isLoading, setIsLoading] = useState(false)
  const [processedSources, setProcessedSources] = useState<ParsedFile[]>([])
  const [sourceNames, setSourceNames] = useState<Record<string, string>>({})
  const [currentTags, setCurrentTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState("")
  const [activeTab, setActiveTab] = useState<string>("files")

  // Fetch tags on mount
  React.useEffect(() => {
    const fetchTagsData = async () => {
      setTagsLoading(true);
      try {
        const { data, error } = await fetchTags();
        if (error) {
          console.error("Error fetching tags:", error);
          setTags([]);
        } else {
          setTags(data || []);
        }
      } catch (err) {
        console.error("Error fetching tags:", err);
        setTags([]);
      } finally {
        setTagsLoading(false);
      }
    };
    if (open) { // Only fetch when modal opens
      fetchTagsData();
    }
  }, [open]);

  // Reset state when modal closes
  React.useEffect(() => {
    if (!open) {
      setTagInput("")
      setProcessedSources([])
      setSourceNames({})
      setCurrentTags([])
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }, [open])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return
    const files = Array.from(e.target.files)
    const parsedFiles = await parseFiles(files)
    const names: Record<string, string> = {}
    parsedFiles.forEach(file => {
      names[file.id] = file.name
    })
    setProcessedSources(parsedFiles)
    setSourceNames(names)
  }

  const updateSourceName = (sourceId: string, name: string) => {
    setSourceNames(prev => ({
      ...prev,
      [sourceId]: name
    }))
  }

  const addTag = (tag: string) => {
    if (!tag.trim()) return
    setCurrentTags(prev => [...new Set([...prev, tag.trim()])])
  }

  const removeTag = (tag: string) => {
    setCurrentTags(prev => prev.filter(t => t !== tag))
  }

  const handleAddSources = async () => {
    if (processedSources.length === 0) return false
    
    setIsLoading(true)
    try {
      // Ensure tags exist
      const tagPromises = ['File Upload', ...currentTags].map(async tagName => {
        const existingTag = tags.find(t => t.name.toLowerCase() === tagName.toLowerCase())
        if (existingTag) return existingTag.id
        // Use imported addTag (renamed to addTagToDb) directly here, explicitly handle promise
        try {
          const result = await addTagToDb(tagName);
          if (result.error) {
            console.error(`Error creating tag ${tagName}:`, result.error);
            throw result.error; // Propagate the error
          }
          return result.data?.id;
        } catch (err) {
          console.error(`Exception creating tag ${tagName}:`, err);
          throw err; // Re-throw exception
        }
      })
      // Filter out potential undefined IDs from failed tag creations
      const tagIds = (await Promise.all(tagPromises)).filter(id => id !== undefined);

      // Check if all required tags were successfully created/found
      if (tagIds.length < ['File Upload', ...currentTags].length) {
          console.error('Failed to create/find all required tags.');
          throw new Error('Failed to create/find all required tags.');
      }
      
      const { success, error } = await uploadSources(processedSources, sourceNames, currentTags)
      if (error) {
        console.error('Error uploading sources:', error)
        return false
      }
      
      if (success) {
        onOpenChange(false)
        onSourcesUpdated()
        return true
      }
      
      return false
    } catch (error) {
      console.error('Error uploading sources:', error)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Content</DialogTitle>
          <DialogDescription>
            Extract content from files to create new knowledge sources.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="files" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              <span>Single Files</span>
            </TabsTrigger>
            <TabsTrigger value="folder" className="flex items-center gap-2">
              <FolderOpen className="h-4 w-4" />
              <span>Folder Import</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="files" className="space-y-4 mt-4">
            <div className="space-y-8">
              <div className="space-y-2">
                <Label>Files</Label>
                <Input
                  id="files"
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept={supportedTypes.join(',')}
                  multiple
                />
                <p className="text-sm text-muted-foreground">
                  Supported formats: {supportedTypes.join(', ').toUpperCase()}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex-1 space-y-2">
                  <Input
                    placeholder="Add tags (press Enter)"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && tagInput.trim()) {
                        e.preventDefault()
                        addTag(tagInput.trim())
                        setTagInput("")
                      }
                    }}
                  />
                  {currentTags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {currentTags.map(tag => (
                        <span key={tag} className="inline-flex items-center gap-1 bg-muted px-2 py-1 rounded-md text-sm">
                          {tag}
                          <button
                            onClick={() => removeTag(tag)}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {processedSources.length > 0 && !parsingFiles && (
              <div className="mt-8 space-y-4 p-4 border rounded-md bg-muted/30">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Name Your Sources</h3>
                  <p className="text-sm text-muted-foreground">
                    Give each source a descriptive name before adding to your knowledge base.
                  </p>
                </div>
                <div className="space-y-4 mt-3">
                  {processedSources.map(source => (
                    <div key={source.id} className="grid grid-cols-1 gap-1 bg-card p-3 rounded-md">
                      <Label className="mb-1">Source Name:</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          value={sourceNames[source.id] || source.name}
                          onChange={(e) => updateSourceName(source.id, e.target.value)}
                          className="flex-1"
                          placeholder="Enter a descriptive name"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Original file: {source.name}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="folder" className="mt-4">
            <FolderCrawler 
              open={open} 
              onOpenChange={onOpenChange}
            />
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-6 border-t pt-4">
          {activeTab === "files" && (
            <div className="flex justify-between w-full items-center">
              {(isLoading || parsingFiles) && (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Processing...</span>
                </div>
              )}
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                {processedSources.length > 0 && !isLoading && !parsingFiles && (
                  <Button onClick={handleAddSources}>
                    Add {processedSources.length} Source{processedSources.length > 1 ? 's' : ''} to Knowledge Base
                  </Button>
                )}
              </div>
            </div>
          )}
          
          {activeTab === "folder" && (
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Add this export to maintain compatibility with existing imports
// This can be removed once all imports are updated to use Supabase hooks
export const availableSources: any[] = [];

// Update the function definition to accept but ignore the argument
export const updateAvailableSources = (_sources?: any) => {};

// Add TypeScript global declarations
declare global {
  interface Window {
    pdfjsLib: any;
    mammoth: any;
    Papa: any;
  }
} 