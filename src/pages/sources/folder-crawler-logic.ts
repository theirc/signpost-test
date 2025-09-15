import { supabase } from "@/lib/agents/db"
import { ParsedFile } from "@/lib/fileUtilities/use-file-parser"
import { useTeamStore } from "@/lib/hooks/useTeam"
import { useState } from "react"
import { useQueryClient } from '@tanstack/react-query'

export interface FolderCrawlerState {
  isLoading: boolean
  progress: number
  files: ParsedFile[]
  sourceNames: Record<string, string>
  currentTags: string[]
}

export interface FolderCrawlerActions {
  handleFileChange: (fileList: FileList | null) => Promise<void>
  handleNameChange: (id: string, name: string) => void
  handleAddTag: (tag: string) => void
  handleRemoveTag: (tagToRemove: string) => void
  handleSubmit: () => Promise<void>
  handleReset: () => void
}

export function useFolderCrawler(
  onSourcesUpdated: () => void,
  onOpenChange: (open: boolean) => void,
  parseFiles: (files: File[]) => Promise<ParsedFile[]>,
  teamId?: string
): [FolderCrawlerState, FolderCrawlerActions] {
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [files, setFiles] = useState<ParsedFile[]>([])
  const [sourceNames, setSourceNames] = useState<Record<string, string>>({})
  const [currentTags, setCurrentTags] = useState<string[]>([])
  const queryClient = useQueryClient()

  const handleFileChange = async (fileList: FileList | null) => {
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

  const handleReset = () => {
    setFiles([])
    setSourceNames({})
    setCurrentTags([])
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

        await supabase
          .from('sources')
          .insert([{
            name,
            type: 'File',
            content: source.content,
            tags: ['File Upload', ...currentTags, source.name.split('.').pop() || ''],
            team_id: selectedTeam.id
          }])

        setProgress(((index + 1) / files.length) * 100)
      })

      await Promise.all(sourcePromises)
      
      queryClient.invalidateQueries({
        queryKey: ['supabase-table', 'sources'],
        exact: false
      })
      
      onSourcesUpdated()
      onOpenChange(false)
    } catch (error) {
      console.error('Error uploading sources:', error)
    } finally {
      setIsLoading(false)
      setProgress(0)
    }
  }

  return [
    { isLoading, progress, files, sourceNames, currentTags },
    { handleFileChange, handleNameChange, handleAddTag, handleRemoveTag, handleSubmit, handleReset }
  ]
} 