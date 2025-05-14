import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { useRef, useState } from "react"
import { useFileParser, ParsedFile } from "@/lib/fileUtilities/use-file-parser"
import { SourceNameEditor } from "./components/source-name-editor"
import { TagManager } from "./components/tag-manager"
import { useTeamStore } from "@/lib/hooks/useTeam"
import { useSupabase } from "@/hooks/use-supabase"

interface FileUploadTabProps {
  onSourcesUpdated: () => void
  onOpenChange: (open: boolean) => void
}

export function FileUploadTab({ onSourcesUpdated, onOpenChange }: FileUploadTabProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = useSupabase()
  const { parseFiles, supportedTypes, isLoading: parsingFiles } = useFileParser()
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [files, setFiles] = useState<ParsedFile[]>([])
  const [sourceNames, setSourceNames] = useState<Record<string, string>>({})
  const [currentTags, setCurrentTags] = useState<string[]>([])

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = event.target.files
    if (!fileList) return

    setIsLoading(true)
    setProgress(0)

    try {
      const parsedFiles = await parseFiles(Array.from(fileList))
      setFiles(parsedFiles)
      // Initialize source names with file names
      const initialNames = parsedFiles.reduce((acc, file) => {
        acc[file.id] = file.name
        return acc
      }, {} as Record<string, string>)
      setSourceNames(initialNames)
    } catch (error) {
      console.error('Error parsing files:', error)
    } finally {
      setIsLoading(false)
      setProgress(0)
    }
  }

  const handleNameChange = (id: string, name: string) => {
    setSourceNames(prev => ({ ...prev, [id]: name }))
  }

  const handleAddTag = (tag: string) => {
    setCurrentTags(prev => [...prev, tag])
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setCurrentTags(prev => prev.filter(tag => tag !== tagToRemove))
  }

  const handleSubmit = async () => {
    if (files.length === 0) return

    setIsLoading(true)
    setProgress(0)

    try {
      const selectedTeam = useTeamStore.getState().selectedTeam
      if (!selectedTeam) {
        throw new Error('No team selected')
      }

      // Ensure tags exist
      const tagPromises = ['File Upload', ...currentTags].map(async tagName => {
        const { data: tags } = await supabase
          .from('tags')
          .select('*')
          .eq('name', tagName)
          .maybeSingle()

        if (tags) return tags.id

        const { data: newTag } = await supabase
          .from('tags')
          .insert([{ name: tagName }])
          .select()
          .single()

        return newTag?.id
      })

      await Promise.all(tagPromises)

      // Add sources
      const sourcePromises = files.map(async (source, index) => {
        const name = sourceNames[source.id]?.trim() || source.name

        // Format tags properly for PostgreSQL array
        const formattedTags = JSON.stringify(['File Upload', ...currentTags, source.name.split('.').pop() || ''])
          .replace(/"/g, '')
          .replace('[', '{')
          .replace(']', '}')

        await supabase
          .from('sources')
          .insert([{
            name,
            type: 'File',
            content: source.content,
            tags: formattedTags,
            team_id: selectedTeam.id
          }])

        setProgress(((index + 1) / files.length) * 100)
      })

      await Promise.all(sourcePromises)
      onSourcesUpdated()
      onOpenChange(false)
    } catch (error) {
      console.error('Error uploading sources:', error)
    } finally {
      setIsLoading(false)
      setProgress(0)
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="file-select" className="text-right">Select Files</Label>
        <Input
          id="file-select"
          type="file"
          multiple
          onChange={handleFileChange}
          className="col-span-3"
          disabled={isLoading}
          ref={fileInputRef}
        />
      </div>
      <p className="text-sm text-muted-foreground col-start-2 col-span-3">
        Select one or more files. Supported formats: {supportedTypes.join(', ')}
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

      <div className="flex justify-end">
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