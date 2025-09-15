import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useRef } from "react"
import { useFileParser } from "@/lib/fileUtilities/use-file-parser"
import { Loader2, RotateCcw } from "lucide-react"
import { SourceNameEditor } from "./components/source-name-editor"
import { TagManager } from "./components/tag-manager"
import { useFolderCrawler } from "./folder-crawler-logic"
import { useTeamStore } from "@/lib/hooks/useTeam"

interface FolderCrawlerProps {
  onSourcesUpdated: () => void
  onOpenChange: (open: boolean) => void
}

export function FolderCrawler({ onSourcesUpdated, onOpenChange }: FolderCrawlerProps) {
  const { selectedTeam } = useTeamStore()
  const { parseFiles, supportedTypes, isLoading: parsingFiles } = useFileParser(selectedTeam?.id)
  const [state, actions] = useFolderCrawler(onSourcesUpdated, onOpenChange, parseFiles, selectedTeam?.id)
  const { isLoading, progress, files, sourceNames, currentTags } = state
  const { handleFileChange, handleNameChange, handleAddTag, handleRemoveTag, handleSubmit, handleReset } = actions
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleInputChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    await handleFileChange(event.target.files)
  }

  const handleClearSelection = () => {
    handleReset()
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
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

      <div className="flex justify-end gap-2">
        {files.length > 0 && (
          <Button
            variant="outline"
            onClick={handleClearSelection}
            disabled={isLoading}
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Clear Selection
          </Button>
        )}
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
      </div>
    </div>
  )
} 