import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import { useSupabase } from "@/hooks/use-supabase"
import { useFileParser, ParsedFile } from "@/lib/fileUtilities/use-file-parser"
import { uploadSources, addTag as addTagToDb } from '@/lib/data/supabaseFunctions'
import { Input } from "@/components/ui/input"
import { X, Loader2 } from "lucide-react"

interface FolderCrawlerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSourcesUpdated: () => void
}

export function FolderCrawler({ open, onOpenChange, onSourcesUpdated }: FolderCrawlerProps) {
  const supabase = useSupabase()
  const { parseFiles, supportedTypes, isLoading: parsingFiles } = useFileParser()
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState<string>('')
  const [processedSources, setProcessedSources] = useState<ParsedFile[]>([])
  const [sourceNames, setSourceNames] = useState<Record<string, string>>({})
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState("")

  const resetState = () => {
    setProcessedSources([])
    setSourceNames({})
    setTags([])
    setProgress('')
    setTagInput('')
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setIsLoading(true)
    setProgress('Filtering and processing files...')

    try {
      const supportedFiles = Array.from(files).filter(file => {
        const extension = `.${file.name.split('.').pop()?.toLowerCase()}`
        return supportedTypes.includes(extension)
      })

      if (supportedFiles.length === 0) {
        setProgress(`No supported files found in the selected folder. Supported types: ${supportedTypes.join(', ')}`)
        setIsLoading(false)
        return
      }

      setProgress(`Found ${supportedFiles.length} supported files. Processing...`)

      const parsed = await parseFiles(supportedFiles)

      const newSourceNames: Record<string, string> = {}
      parsed.forEach(source => {
        newSourceNames[source.id] = source.name.replace(/\.[^/.]+$/, '')
      })

      setProcessedSources(parsed)
      setSourceNames(newSourceNames)
      setProgress(`${parsed.length} files processed successfully.`)
    } catch (error) {
      console.error('Error processing folder files:', error)
      setProgress('Error processing folder files.')
    } finally {
      setIsLoading(false)
      if (event.target) {
        event.target.value = '';
      }
    }
  }

  const updateSourceName = (sourceId: string, newName: string) => {
    setSourceNames(prev => ({
      ...prev,
      [sourceId]: newName
    }))
  }

  const handleAddTag = (tag: string) => {
    if (!tag.trim()) return
    setTags(prev => [...new Set([...prev, tag.trim()])])
    setTagInput("")
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(prev => prev.filter(tag => tag !== tagToRemove))
  }

  const handleAddSources = async () => {
    if (processedSources.length === 0) return

    setIsLoading(true)
    setProgress('Adding sources...')

    try {
      const allTags = ['Folder Import', ...tags]
      
      const tagPromises = allTags.map(async tagName => {
        try {
          const result = await addTagToDb(tagName);
          if (result.error) {
            console.error(`Error ensuring tag ${tagName}:`, result.error);
            throw result.error; 
          }
          return result.data?.id;
        } catch (err) {
          console.error(`Exception ensuring tag ${tagName}:`, err);
          throw err; 
        }
      });
      const tagIds = (await Promise.all(tagPromises)).filter(id => id !== undefined);

       if (tagIds.length < allTags.length) {
          console.error('Failed to create/find all required tags for folder import.');
          setProgress('Warning: Could not create all tags. Proceeding with available tags.');
       }

      const { success, error: uploadError } = await uploadSources(
        processedSources, 
        sourceNames, 
        allTags
      )
      if (uploadError) throw uploadError

      if (success) {
          setProgress('Sources added successfully')
          resetState()
          onOpenChange(false)
          onSourcesUpdated()
      } else {
          setProgress('Failed to add sources.')
      }
    } catch (error) {
      console.error('Error adding sources:', error)
      setProgress(`Error adding sources: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setIsLoading(false)
    }
  }

  const isProcessing = isLoading || parsingFiles;

  return (
    <div className="space-y-4 py-4">
        {isProcessing && progress && (
          <div className="h-8 bg-secondary/50 flex items-center justify-center border-y">
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> 
              {progress}
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="folder-select" className="text-right">Select Folder</Label>
            <Input
              id="folder-select"
              type="file"
              {...{ webkitdirectory: "", directory: "" } as any}
              onChange={handleFileChange}
              className="col-span-3"
              disabled={isProcessing}
            />
          </div>
          <p className="text-sm text-muted-foreground col-start-2 col-span-3">
            Select a folder. All supported files ({supportedTypes.join(', ')}) within it will be processed.
          </p>

          {processedSources.length > 0 && (
            <div className="space-y-4 p-4 border rounded-md bg-muted/30">
              <div className="space-y-2">
                 <h3 className="text-lg font-semibold">Name Your Sources</h3>
                 <p className="text-sm text-muted-foreground">
                   Review the detected files and adjust their source names before adding.
                 </p>
               </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <Label className="text-right pt-2">Source Names</Label>
                <div className="col-span-3 space-y-3">
                  {processedSources.map((source) => (
                    <div key={source.id} className="space-y-1">
                      <Label htmlFor={`source-name-${source.id}`} className="text-xs font-medium">{source.name}</Label>
                      <Input
                        id={`source-name-${source.id}`}
                        type="text"
                        value={sourceNames[source.id]}
                        onChange={(e) => updateSourceName(source.id, e.target.value)}
                        className="w-full"
                        placeholder="Enter source name"
                        disabled={isProcessing}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-4 items-start gap-4">
                <Label className="text-right pt-2">Tags</Label>
                <div className="col-span-3 space-y-2">
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                        Folder Import
                    </span>
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 bg-muted px-2 py-1 rounded-md text-sm"
                      >
                        {tag}
                        <button
                          onClick={() => handleRemoveTag(tag)}
                          className="text-muted-foreground hover:text-foreground"
                          disabled={isProcessing}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      placeholder="Add tag and press Enter"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleAddTag(e.currentTarget.value)
                        }
                      }}
                      className="flex-1"
                      disabled={isProcessing}
                    />
                  </div>
                   <p className="text-xs text-muted-foreground">Add optional tags to apply to all sources from this folder.</p>
                </div>
              </div>
            </div>
          )}
        </div>

         {processedSources.length > 0 && (
             <div className="flex justify-end mt-4">
                 <Button
                   onClick={handleAddSources}
                   disabled={isProcessing || processedSources.length === 0}
                 >
                   {isProcessing ? 'Processing...' : `Add ${processedSources.length} Source${processedSources.length > 1 ? 's' : ''}`}
                 </Button>
             </div>
         )}
    </div>
  )
} 