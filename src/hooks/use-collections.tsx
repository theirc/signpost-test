/**
 * useCollections Hook
 * 
 * A hook to manage collections in the application.
 * Provides functionality to fetch, add, and delete collections from the database.
 * 
 * A collection is a group of sources uwhich can be used to create a Knowledge base.
 * 
 * @returns {Object} An object containing collections data and operations:
 *   - collections: The current list of collections
 *   - loading: Boolean indicating if collections are being loaded
 *   - error: Any error that occurred during loading
 *   - addCollection: Function to add a new collection
 *   - deleteCollection: Function to delete a collection
 *   - fetchCollections: Function to refresh collections
 */
import { useEffect, useState } from 'react'
import { useSupabase } from './use-supabase'

export type Collection = {
  id: string
  name: string
  created_at: string
}

export function useCollections() {
  const supabase = useSupabase()
  const [collections, setCollections] = useState<Collection[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchCollections = async () => {
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from('collections')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) throw error
        setCollections(data || [])
      } catch (error) {
        setError(error instanceof Error ? error : new Error(String(error)))
      } finally {
        setLoading(false)
      }
    }

    fetchCollections()
  }, [supabase])

  const addCollection = async (name: string) => {
    try {
      const { data, error } = await supabase
        .from('collections')
        .insert([{ name }])
        .select()

      if (error) throw error
      setCollections(prev => [...prev, ...(data || [])])
      return data?.[0]
    } catch (error) {
      setError(error instanceof Error ? error : new Error(String(error)))
      return null
    }
  }

  const deleteCollection = async (id: string) => {
    try {
      const { error } = await supabase
        .from('collections')
        .delete()
        .eq('id', id)

      if (error) throw error
      setCollections(prev => prev.filter(collection => collection.id !== id))
      return true
    } catch (error) {
      setError(error instanceof Error ? error : new Error(String(error)))
      return false
    }
  }

  /**
   * Updates a collection's name in the database
   * 
   * @param {string} id - The ID of the collection to update
   * @param {string} name - The new name for the collection
   * @returns {Promise<boolean>} True if successful, false if an error occurred
   */
  const updateCollection = async (id: string, name: string) => {
    try {
      console.log(`[useCollections] Updating collection ${id} with name: ${name}`);
      const { error } = await supabase
        .from('collections')
        .update({ name })
        .eq('id', id)
        .select()

      if (error) {
        console.error(`[useCollections] Error updating collection ${id}:`, error);
        throw error;
      }
      
      // Update the local state with the new name
      setCollections(prev => 
        prev.map(collection => 
          collection.id === id 
            ? { ...collection, name } 
            : collection
        )
      );
      
      console.log(`[useCollections] Successfully updated collection ${id} to name: ${name}`);
      return true;
    } catch (error) {
      console.error(`[useCollections] Exception in updateCollection:`, error);
      setError(error instanceof Error ? error : new Error(String(error)));
      return false;
    }
  }

  return { collections, loading, error, addCollection, deleteCollection, updateCollection }
} 