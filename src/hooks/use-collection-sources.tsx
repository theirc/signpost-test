import { useEffect, useState } from 'react'
import { useSupabase } from './use-supabase'
import { Source } from './use-sources'

/**
 * Custom hook for managing sources within collections.
 * 
 * This hook provides functions to interact with the collection_sources table
 * in the Supabase database, allowing you to fetch, add, and remove sources
 * from collections.
 * 
 * Collection sources are used to determine which sources are used in a collection.
 * 
 * @returns {Object} An object containing functions and state for managing collection sources
 */
export function useCollectionSources() {
  const supabase = useSupabase()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  
  // Track active requests to avoid state thrashing
  const [activeRequests, setActiveRequests] = useState(0)
  
  // Update loading state based on active requests
  useEffect(() => {
    setLoading(activeRequests > 0)
  }, [activeRequests])

  /**
   * Retrieves all sources associated with a specific collection.
   * 
   * @param {string} collectionId - The ID of the collection to fetch sources for
   * @returns {Promise<Source[]>} Array of Source objects belonging to the collection
   */
  const getSourcesForCollection = async (collectionId: string) => {
    console.log(`[useCollectionSources] Getting sources for collection: ${collectionId}`)
    
    try {
      // Increment active requests instead of directly setting loading
      setActiveRequests(prev => prev + 1)
      
      const { data, error } = await supabase
        .from('collection_sources')
        .select(`
          source_id,
          sources:source_id(*)
        `)
        .eq('collection_id', collectionId)

      if (error) {
        console.error(`[useCollectionSources] Error fetching sources for collection ${collectionId}:`, error)
        throw error
      }
      
      console.log(`[useCollectionSources] Retrieved ${data?.length || 0} sources for collection ${collectionId}`)
      
      // Fix the typecasting issue
      return (data || []).map(item => {
        // Make sure we're returning a properly structured Source object
        return item.sources as unknown as Source;
      });
    } catch (err) {
      console.error(`[useCollectionSources] Exception in getSourcesForCollection:`, err)
      setError(err instanceof Error ? err : new Error(String(err)))
      return []
    } finally {
      // Decrement active requests instead of directly setting loading
      setActiveRequests(prev => Math.max(0, prev - 1))
    }
  }

  /**
   * Adds a source to a collection by creating a new record in the collection_sources table.
   * 
   * @param {string} collectionId - The ID of the collection to add the source to
   * @param {string} sourceId - The ID of the source to add to the collection
   * @returns {Promise<boolean>} True if successful, false if an error occurred
   */
  const addSourceToCollection = async (collectionId: string, sourceId: string) => {
    console.log(`[useCollectionSources] Adding source ${sourceId} to collection ${collectionId}`)
    
    try {
      // Don't manipulate global loading state for parallel operations
      const { error, data } = await supabase
        .from('collection_sources')
        .insert([{ collection_id: collectionId, source_id: sourceId }])
        .select()

      if (error) {
        console.error(`[useCollectionSources] Error adding source ${sourceId} to collection ${collectionId}:`, error)
        throw error
      }
      
      console.log(`[useCollectionSources] Successfully added source ${sourceId} to collection ${collectionId}`, data)
      return true
    } catch (err) {
      console.error(`[useCollectionSources] Exception in addSourceToCollection:`, err)
      // Don't set global error state for parallel operations
      return false
    }
  }

  /**
   * Removes a source from a collection by deleting the corresponding record
   * from the collection_sources table.
   * 
   * @param {string} collectionId - The ID of the collection to remove the source from
   * @param {string} sourceId - The ID of the source to remove
   * @returns {Promise<boolean>} True if successful, false if an error occurred
   */
  const removeSourceFromCollection = async (collectionId: string, sourceId: string) => {
    console.log(`[useCollectionSources] Removing source ${sourceId} from collection ${collectionId}`)
    
    try {
      // Don't manipulate global loading state for parallel operations
      const { error, data } = await supabase
        .from('collection_sources')
        .delete()
        .match({ collection_id: collectionId, source_id: sourceId })
        .select()

      if (error) {
        console.error(`[useCollectionSources] Error removing source ${sourceId} from collection ${collectionId}:`, error)
        throw error
      }
      
      console.log(`[useCollectionSources] Successfully removed source ${sourceId} from collection ${collectionId}`, data)
      return true
    } catch (err) {
      console.error(`[useCollectionSources] Exception in removeSourceFromCollection:`, err)
      // Don't set global error state for parallel operations
      return false
    }
  }

  return { 
    getSourcesForCollection, 
    addSourceToCollection, 
    removeSourceFromCollection, 
    loading, 
    error 
  }
} 