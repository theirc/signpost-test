/**
 * useTags Hook
 * 
 * A hook to manage tags in the application.
 * Provides functionality to fetch, add, update, and delete tags from the database.
 * 
 * @returns {Object} An object containing:
 *   - tags: The current list of tags
 *   - loading: Boolean indicating if tags are being loaded
 *   - error: Any error that occurred during loading
 *   - addTag: Function to add a new tag
 *   - deleteTag: Function to delete a tag
 *   - fetchTags: Function to refresh tags
 */
import { useEffect, useState } from 'react'
import { useSupabase } from './use-supabase'

export type Tag = {
  id: string
  name: string
}

export function useTags() {
  const supabase = useSupabase()
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchTags = async () => {
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from('tags')
          .select('*')
          .order('name')

        if (error) throw error
        setTags(data || [])
      } catch (error) {
        setError(error instanceof Error ? error : new Error(String(error)))
      } finally {
        setLoading(false)
      }
    }

    fetchTags()
  }, [supabase])

  const addTag = async (name: string) => {
    try {
      const { data, error } = await supabase
        .from('tags')
        .insert([{ name }])
        .select()

      if (error) throw error
      setTags(prev => [...prev, ...(data || [])])
      return data?.[0]
    } catch (error) {
      setError(error instanceof Error ? error : new Error(String(error)))
      return null
    }
  }

  return { tags, loading, error, addTag }
} 