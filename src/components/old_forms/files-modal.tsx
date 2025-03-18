import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import { X, Loader2 } from "lucide-react"
import React from "react"
import { useFileParser } from "@/hooks/use-file-parser"
import { useSourceUpload } from "@/hooks/use-source-upload"

interface FilesModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSourcesUpdated: () => void
}

export function FilesModal({ open, onOpenChange, onSourcesUpdated }: FilesModalProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const { isLoading: parsingFiles, parseFiles, supportedTypes } = useFileParser()
  const {
    isLoading,
    processedSources,
    sourceNames,
    currentTags,
    handleProcessedFiles,
    updateSourceName,
    addTag: addCustomTag,
    removeTag,
    uploadSources
  } = useSourceUpload()
  
  const [tagInput, setTagInput] = useState("")

  // Reset state when modal closes
  React.useEffect(() => {
    if (!open) {
      setTagInput("")
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }, [open])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return
    const files = Array.from(e.target.files)
    const parsedFiles = await parseFiles(files)
    handleProcessedFiles(parsedFiles)
  }

  const handleAddSources = async () => {
    const success = await uploadSources()
    if (success) {
      onOpenChange(false)
      onSourcesUpdated()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Process Files</DialogTitle>
          <DialogDescription>
            Extract content from files to create new knowledge sources.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
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
                      addCustomTag(tagInput.trim())
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
        </div>

        <DialogFooter className="mt-6 border-t pt-4">
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