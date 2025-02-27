/**
 * useSources Hook
 * 
 * A hook to manage source data in the application.
 * Provides functionality to fetch, add, update, and delete sources from the database.
 * Also handles formatting of tags and other source data management.
 * 
 * @returns {Object} An object containing sources data and operations:
 *   - sources: The current list of sources
 *   - loading: Boolean indicating if sources are being loaded
 *   - error: Any error that occurred during loading
 *   - addSource: Function to add a new source
 *   - deleteSource: Function to delete a source
 *   - fetchSources: Function to refresh sources
 */
import { useEffect, useState, useCallback } from 'react'
import { useSupabase } from './use-supabase'

export type Source = {
  id: string
  name: string
  type_id: string
  content: string
  url?: string
  tags?: string[] | string
  created_at: string
  last_updated?: string
}

export function useSources() {
  const supabase = useSupabase()
  const [sources, setSources] = useState<Source[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // Define fetchSources outside useEffect so it can be called manually
  const fetchSources = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('sources')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setSources(data || [])
    } catch (error) {
      setError(error instanceof Error ? error : new Error(String(error)))
    } finally {
      setLoading(false)
    }
  }, [supabase])

  // Initial fetch
  useEffect(() => {
    fetchSources()
  }, [fetchSources])

  const addSource = async (sourceData: Partial<Source>): Promise<Source | null> => {
    try {
      setLoading(true)
      
      console.log("Adding source with data:", sourceData)
      
      // Make sure we have all required fields
      if (!sourceData.name || !sourceData.type_id || !sourceData.content) {
        console.error("Missing required fields for source:", sourceData)
        return null
      }
      
      // Ensure tags is properly formatted for PostgreSQL
      if (!sourceData.tags) {
        // Format as PostgreSQL array format: {tag1,tag2}
        sourceData.tags = `{${sourceData.type_id}}`;
      } else if (Array.isArray(sourceData.tags)) {
        // Convert JavaScript array to PostgreSQL array format
        sourceData.tags = `{${sourceData.tags.join(',')}}`;
      }
      
      // Insert the source into the database
      const { data, error } = await supabase
        .from('sources')
        .insert([sourceData])
        .select('*')
        .single()
        
      if (error) {
        console.error("Supabase error:", error)
        throw error
      }
      
      if (!data) {
        console.error("No data returned from insert")
        return null
      }
      
      // Update local state
      setSources(prev => [data as Source, ...prev])
      
      console.log("Source inserted successfully:", data)
      return data as Source
    } catch (err) {
      console.error("Error in addSource:", err)
      return null
    } finally {
      setLoading(false)
    }
  }

  const deleteSource = async (id: string) => {
    try {
      const { error } = await supabase
        .from('sources')
        .delete()
        .eq('id', id)

      if (error) throw error
      setSources(prev => prev.filter(source => source.id !== id))
      return true
    } catch (error) {
      setError(error instanceof Error ? error : new Error(String(error)))
      return false
    }
  }

  return { sources, loading, error, addSource, deleteSource, fetchSources }
} 