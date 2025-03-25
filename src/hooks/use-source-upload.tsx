import { useState } from 'react'
import { useSources } from './use-sources'
import { useTags } from './use-tags'
import type { ParsedFile } from './use-file-parser'

interface SourceUploadState {
  processedSources: ParsedFile[]
  sourceNames: Record<string, string>
  currentTags: string[]
}

export function useSourceUpload() {
  const { addSource } = useSources()
  const { tags, addTag: createTag } = useTags()
  const [isLoading, setIsLoading] = useState(false)
  const [state, setState] = useState<SourceUploadState>({
    processedSources: [],
    sourceNames: {},
    currentTags: []
  })

  const handleProcessedFiles = (parsedFiles: ParsedFile[]) => {
    const names: Record<string, string> = {}
    parsedFiles.forEach(file => {
      names[file.id] = file.name
    })

    setState(prev => ({
      ...prev,
      processedSources: parsedFiles,
      sourceNames: names
    }))
  }

  const updateSourceName = (sourceId: string, name: string) => {
    setState(prev => ({
      ...prev,
      sourceNames: {
        ...prev.sourceNames,
        [sourceId]: name
      }
    }))
  }

  const updateTags = (tags: string[]) => {
    setState(prev => ({
      ...prev,
      currentTags: tags
    }))
  }

  const addTag = (tag: string) => {
    if (!tag.trim()) return
    setState(prev => ({
      ...prev,
      currentTags: [...new Set([...prev.currentTags, tag.trim()])]
    }))
  }

  const removeTag = (tag: string) => {
    setState(prev => ({
      ...prev,
      currentTags: prev.currentTags.filter(t => t !== tag)
    }))
  }

  const uploadSources = async () => {
    if (state.processedSources.length === 0) return false
    
    setIsLoading(true)
    try {
      // Ensure tags exist
      const tagPromises = ['File Upload', ...state.currentTags].map(async tagName => {
        const existingTag = tags.find(t => t.name.toLowerCase() === tagName.toLowerCase())
        if (existingTag) return existingTag.id
        const newTag = await createTag(tagName)
        return newTag?.id
      })
      await Promise.all(tagPromises)
      
      // Add sources
      await Promise.all(state.processedSources.map(async source => {
        const name = state.sourceNames[source.id]?.trim() || source.name
        await addSource({
          name,
          type: 'File',
          content: source.content,
          tags: JSON.stringify(['File', ...state.currentTags, source.name.split('.').pop() || ''])
            .replace(/"/g, '')
            .replace('[', '{')
            .replace(']', '}')
        })
      }))
      
      // Reset state after successful upload
      setState({
        processedSources: [],
        sourceNames: {},
        currentTags: []
      })

      return true
    } catch (error) {
      console.error('Error uploading sources:', error)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  return {
    isLoading,
    processedSources: state.processedSources,
    sourceNames: state.sourceNames,
    currentTags: state.currentTags,
    handleProcessedFiles,
    updateSourceName,
    updateTags,
    addTag,
    removeTag,
    uploadSources
  }
} 