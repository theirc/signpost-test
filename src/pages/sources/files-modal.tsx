import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState, useEffect, useCallback } from "react"
import { X, Loader2, Upload, FolderOpen } from "lucide-react"
import React from "react"
import { useFileParser } from "@/lib/fileUtilities/use-file-parser"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FolderCrawler } from "./folder-crawler"
import { supabase } from '@/lib/data/supabaseFunctions'
import { useTeamStore } from "@/lib/hooks/useTeam"

// Define Tag type if needed
type Tag = { id: string; name: string; };

interface FilesModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSourcesUpdated: () => void
  initialFiles?: File[]
}

export function FilesModal({ open, onOpenChange, onSourcesUpdated, initialFiles = [] }: FilesModalProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const { isLoading: parsingFiles, parseFiles, supportedTypes } = useFileParser()
  const [tags, setTags] = useState<Tag[]>([])
  const [tagsLoading, setTagsLoading] = useState(true)
  const { selectedTeam } = useTeamStore()
  
  const [uploading, setUploading] = useState(false)
  const [processedSources, setProcessedSources] = useState<any[]>([])
  const [sourceNames, setSourceNames] = useState<Record<string, string>>({})
  const [currentTags, setCurrentTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState("")
  const [activeTab, setActiveTab] = useState<string>("files")

  // Fetch tags on mount
  useEffect(() => {
    const fetchTagsData = async () => {
      setTagsLoading(true);
      try {
        const { data, error } = await supabase
          .from('tags')
          .select('*')
          .order('name', { ascending: true });
          
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

  const handleFiles = useCallback(async (files: File[]) => {
    console.log("handleFiles called with files:", files)
    if (!files.length) return;
    try {
      console.log("Starting to parse files...")
      const parsedSources = await parseFiles(Array.from(files));
      console.log("Files parsed successfully:", parsedSources)
      setProcessedSources(parsedSources);
    } catch (error) {
      console.error('Error processing files:', error);
    }
  }, [parseFiles]);

  // Process initial files when they are provided
  useEffect(() => {
    if (initialFiles.length > 0) {
      handleFiles(initialFiles);
    }
  }, [initialFiles, handleFiles]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log("File input changed:", e.target.files)
    if (!e.target.files?.length) return;
    await handleFiles(Array.from(e.target.files));
  };

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
    console.log("handleAddSources called")
    if (processedSources.length === 0) {
      console.log("No processed sources to upload")
      return false
    }

    if (!selectedTeam) {
      console.error("No team selected")
      return false
    }
    
    console.log("Starting handleAddSources with processedSources:", processedSources)
    console.log("Current tags:", currentTags)
    console.log("Source names:", sourceNames)
    
    setUploading(true)
    try {
      // Ensure tags exist
      const tagPromises = ['File Upload', ...currentTags].map(async tagName => {
        console.log("Processing tag:", tagName)
        const existingTag = tags.find(t => t.name.toLowerCase() === tagName.toLowerCase())
        if (existingTag) {
          console.log("Found existing tag:", existingTag)
          return existingTag.id
        }
        try {
          console.log("Creating new tag:", tagName)
          const { data, error } = await supabase
            .from('tags')
            .insert([{ name: tagName }])
            .select()
            .single();
            
          if (error) throw error;
          console.log("Created new tag:", data)
          return data?.id;
        } catch (err) {
          console.error(`Error creating tag ${tagName}:`, err);
          throw err;
        }
      })
      const tagIds = (await Promise.all(tagPromises)).filter(id => id !== undefined);
      console.log("Final tag IDs:", tagIds)

      if (tagIds.length < ['File Upload', ...currentTags].length) {
        throw new Error('Failed to create/find all required tags.');
      }

      // Add sources
      const sourcePromises = processedSources.map(async source => {
        const name = sourceNames[source.id]?.trim() || source.name
        console.log(`Processing source: ${name}`)

        // Format tags properly for PostgreSQL array
        const formattedTags = JSON.stringify(['File Upload', ...currentTags, source.name.split('.').pop() || ''])
          .replace(/"/g, '')
          .replace('[', '{')
          .replace(']', '}')
        console.log(`Formatted tags for ${name}:`, formattedTags)

        const { data, error } = await supabase
          .from('sources')
          .insert([{
            name,
            type: 'File',
            content: source.content,
            tags: formattedTags,
            team_id: selectedTeam.id
          }])
          .select()
          .single();

        if (error) {
          console.error(`Error adding source ${name}:`, error)
          throw error
        }

        console.log(`Added source ${name}:`, data)
        return data
      })

      await Promise.all(sourcePromises)
      console.log("All sources added successfully")
      
      onOpenChange(false)
      onSourcesUpdated()
      return true
    } catch (error) {
      console.error('Error in handleAddSources:', error)
      return false
    } finally {
      setUploading(false)
    }
  }

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setTagInput("")
      setProcessedSources([])
      setSourceNames({})
      setCurrentTags([])
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) {
        setProcessedSources([]);
        setSourceNames({});
        setCurrentTags([]);
        setUploading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
      onOpenChange(isOpen);
    }}>
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
              open={activeTab === "folder"}
              onOpenChange={onOpenChange}
              onSourcesUpdated={onSourcesUpdated}
            />
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-6 border-t pt-4">
          {activeTab === "files" && (
            <div className="flex justify-between w-full items-center">
              {(parsingFiles || uploading) && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{parsingFiles ? 'Processing files...' : uploading ? 'Adding to knowledge base...' : ''}</span>
                </div>
              )}
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => onOpenChange(false)} disabled={parsingFiles || uploading}>
                  Cancel
                </Button>
                {processedSources.length > 0 && !parsingFiles && !uploading && (
                  <Button onClick={handleAddSources} disabled={parsingFiles || uploading}>
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