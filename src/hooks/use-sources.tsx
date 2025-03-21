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

export interface Source {
  id: string
  name: string
  type: string
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
    if (!sourceData.name || !sourceData.type || !sourceData.content) {
      throw new Error('Name, type, and content are required')
    }

    // If no tags provided, use the type as the only tag
    if (!sourceData.tags) {
      sourceData.tags = `{${sourceData.type}}`;
    }

    try {
      const { data, error } = await supabase
        .from('sources')
        .insert([sourceData])
        .select()
        .single()

      if (error) throw error

      // Add new source to state
      setSources(prev => [...prev, data])
      return data
    } catch (error) {
      console.error('Error adding source:', error)
      throw error
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

  const updateSource = async (id: string, updates: Partial<Source>) => {
    try {
      // Ensure tags are in the correct PostgreSQL array format if provided
      if (updates.tags && Array.isArray(updates.tags)) {
        updates.tags = `{${updates.tags.join(',')}}`;
      }

      const { data, error } = await supabase
        .from('sources')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      // Update the source in state
      setSources(prev => 
        prev.map(source => source.id === id ? { ...source, ...data } : source)
      );
      
      return data;
    } catch (error) {
      console.error('Error updating source:', error);
      throw error;
    }
  };

  return { sources, loading, error, addSource, deleteSource, updateSource, fetchSources }
} 