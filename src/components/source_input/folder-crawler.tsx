import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import { useSupabase } from "@/hooks/use-supabase"
import { uploadSources, ParsedFile } from '@/lib/data/supabaseFunctions'

interface FolderCrawlerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function FolderCrawler({ open, onOpenChange }: FolderCrawlerProps) {
  const supabase = useSupabase()
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState<string>('')
  const [processedSources, setProcessedSources] = useState<ParsedFile[]>([])
  const [sourceNames, setSourceNames] = useState<Record<string, string>>({})
  const [tags, setTags] = useState<string[]>([])

  const resetState = () => {
    setProcessedSources([])
    setSourceNames({})
    setTags([])
    setProgress('')
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return

    setIsLoading(true)
    setProgress('Processing files...')

    try {
      const newProcessedSources: ParsedFile[] = []
      const newSourceNames: Record<string, string> = {}

      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const content = await file.text()
        const name = file.name.replace(/\.[^/.]+$/, '') // Remove file extension

        newProcessedSources.push({
          id: Math.random().toString(36).substring(7), // Generate a random ID
          name,
          content,
          type: 'text'
        })
        newSourceNames[name] = name
      }

      setProcessedSources(newProcessedSources)
      setSourceNames(newSourceNames)
      setProgress(`${files.length} files processed successfully`)
    } catch (error) {
      console.error('Error processing files:', error)
      setProgress('Error processing files')
    } finally {
      setIsLoading(false)
    }
  }

  const updateSourceName = (originalName: string, newName: string) => {
    setSourceNames(prev => ({
      ...prev,
      [originalName]: newName
    }))
  }

  const handleAddTag = (tag: string) => {
    if (!tag.trim()) return
    setTags(prev => [...new Set([...prev, tag.trim()])])
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(prev => prev.filter(tag => tag !== tagToRemove))
  }

  const handleAddSources = async () => {
    if (processedSources.length === 0) return

    setIsLoading(true)
    setProgress('Adding sources...')

    try {
      // Create tags if they don't exist
      if (tags.length > 0) {
        const { error: tagError } = await supabase
          .from('tags')
          .upsert(
            tags.map(tag => ({ name: tag })),
            { onConflict: 'name' }
          )

        if (tagError) throw tagError
      }

      // Upload sources with tags
      const { error: uploadError } = await uploadSources(processedSources, sourceNames, tags)
      if (uploadError) throw uploadError

      setProgress('Sources added successfully')
      resetState()
      onOpenChange(false)
    } catch (error) {
      console.error('Error adding sources:', error)
      setProgress('Error adding sources')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!open) resetState()
      onOpenChange(open)
    }}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Upload Folder</DialogTitle>
          <DialogDescription>
            Upload multiple files from a folder to create sources.
          </DialogDescription>
        </DialogHeader>

        {isLoading && progress && (
          <div className="h-8 bg-secondary/50 flex items-center justify-center border-y">
            <div className="text-sm text-muted-foreground">
              {progress}
            </div>
          </div>
        )}

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="folder-upload" className="text-right">Folder</Label>
            <input
              id="folder-upload"
              type="file"
              multiple
              onChange={handleFileChange}
              className="col-span-3"
            />
          </div>

          {processedSources.length > 0 && (
            <div className="space-y-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Source Names</Label>
                <div className="col-span-3 space-y-2">
                  {processedSources.map((source) => (
                    <div key={source.name} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={sourceNames[source.name]}
                        onChange={(e) => updateSourceName(source.name, e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Tags</Label>
                <div className="col-span-3 space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-2 py-1 rounded-full text-sm bg-secondary"
                      >
                        {tag}
                        <button
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-1 hover:text-destructive"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add tag"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleAddTag(e.currentTarget.value)
                          e.currentTarget.value = ''
                        }
                      }}
                    />
                    <Button
                      variant="outline"
                      onClick={() => {
                        const input = document.querySelector('input[placeholder="Add tag"]') as HTMLInputElement
                        if (input) {
                          handleAddTag(input.value)
                          input.value = ''
                        }
                      }}
                    >
                      Add
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleAddSources}
            disabled={isLoading || processedSources.length === 0}
          >
            {isLoading ? 'Adding...' : 'Add Sources'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 