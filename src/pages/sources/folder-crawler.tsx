import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useState, useRef } from "react"
import { useSupabase } from "@/hooks/use-supabase"
import { useFileParser, ParsedFile } from "@/lib/fileUtilities/use-file-parser"
import { Input } from "@/components/ui/input"
import { X, Loader2 } from "lucide-react"
import { useTeamStore } from "@/lib/hooks/useTeam"
import { SourceNameEditor } from "./components/source-name-editor"
import { TagManager } from "./components/tag-manager"
import { useFolderCrawler } from "./folder-crawler-logic"

interface FolderCrawlerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSourcesUpdated: () => void
}

export function FolderCrawler({ open, onOpenChange, onSourcesUpdated }: FolderCrawlerProps) {
  const supabase = useSupabase()
  const { parseFiles, supportedTypes, isLoading: parsingFiles } = useFileParser()
  const [state, actions] = useFolderCrawler(onSourcesUpdated, onOpenChange, parseFiles)
  const { isLoading, progress, files, sourceNames, currentTags } = state
  const { handleFileChange, handleNameChange, handleAddTag, handleRemoveTag, handleSubmit } = actions
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleInputChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    await handleFileChange(event.target.files)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Import Folder</DialogTitle>
          <DialogDescription>
            Select a folder to import files. Supported file types: {supportedTypes.join(', ')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="folder-select" className="text-right">Select Folder</Label>
            <input
              id="folder-select"
              type="file"
              {...{
                webkitdirectory: "true",
                directory: "true"
              } as any}
              onChange={handleInputChange}
              className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isLoading}
              ref={fileInputRef}
            />
          </div>

          <p className="text-sm text-muted-foreground col-start-2 col-span-3">
            Select a folder to import files. Supported formats: {supportedTypes.join(', ')}
          </p>

          {files.length > 0 && (
            <>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Source Names</Label>
                <div className="col-span-3">
                  <SourceNameEditor
                    sources={files}
                    sourceNames={sourceNames}
                    onNameChange={handleNameChange}
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Tags</Label>
                <div className="col-span-3">
                  <TagManager
                    currentTags={currentTags}
                    onAddTag={handleAddTag}
                    onRemoveTag={handleRemoveTag}
                  />
                </div>
              </div>
            </>
          )}

          {isLoading && (
            <div className="w-full">
              <div className="h-2 w-full rounded-full bg-secondary">
                <div
                  className="h-2 rounded-full bg-primary transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            onClick={handleSubmit}
            disabled={files.length === 0 || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              'Add Sources'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 