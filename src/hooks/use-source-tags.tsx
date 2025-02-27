/**
 * useSourceTags Hook
 * 
 * A hook to manage the relationship between sources and tags.
 * Provides functionality to fetch tags for a source, add tags to a source, and remove tags from a source.
 * 
 * @returns {Object} An object containing source tags operations:
 *   - loading: Boolean indicating if an operation is in progress
 *   - error: Any error that occurred during operations
 *   - getTagsForSource: Function to retrieve tags associated with a specific source
 *   - addTagToSource: Function to associate a tag with a source
 *   - removeTagFromSource: Function to remove a tag association from a source
 */
import { useEffect, useState } from 'react'
import { useSupabase } from './use-supabase'

export type SourceTag = {
  id: string
  source_id: string
  tag_id: string
}

export function useSourceTags() {
  const supabase = useSupabase()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const getTagsForSource = async (sourceId: string) => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('source_tags')
        .select(`
          tag_id,
          tags:tag_id(id, name)
        `)
        .eq('source_id', sourceId)

      if (error) throw error
      return data?.map(item => item.tags) || []
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)))
      return []
    } finally {
      setLoading(false)
    }
  }

  const addTagToSource = async (sourceId: string, tagId: string) => {
    try {
      setLoading(true)
      const { error } = await supabase
        .from('source_tags')
        .insert([{ source_id: sourceId, tag_id: tagId }])

      if (error) throw error
      return true
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)))
      return false
    } finally {
      setLoading(false)
    }
  }

  const removeTagFromSource = async (sourceId: string, tagId: string) => {
    try {
      setLoading(true)
      const { error } = await supabase
        .from('source_tags')
        .delete()
        .match({ source_id: sourceId, tag_id: tagId })

      if (error) throw error
      return true
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)))
      return false
    } finally {
      setLoading(false)
    }
  }

  return { 
    getTagsForSource, 
    addTagToSource, 
    removeTagFromSource, 
    loading, 
    error 
  }
} 