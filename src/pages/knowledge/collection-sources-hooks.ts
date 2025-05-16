import { useState, useCallback } from "react"
import { supabase } from "@/lib/agents/db"
import { Source, CollectionSourcesMap } from "./types"
import { transformSourcesForDisplay } from "./utils"

/**
 * Custom hook for managing collection sources
 */
export const useCollectionSources = () => {
  const [collectionSources, setCollectionSources] = useState<CollectionSourcesMap>({})
  const [loading, setLoading] = useState(false)

  /**
   * Load sources for a specific collection
   */
  const loadCollectionSources = useCallback(async (collectionId: string): Promise<Source[]> => {
    console.log(`[loadCollectionSources] Loading sources for collection: ${collectionId}`)
    setLoading(true)

    try {
      type CollectionSourceResponse = {
        source_id: string;
        sources: Source;
      }
      
      const { data, error } = await supabase.from('collection_sources')
        .select(`
          source_id,
          sources:source_id(*)
        `)
        .eq('collection_id', collectionId) as {
          data: CollectionSourceResponse[] | null,
          error: Error | null
        }

      if (error) {
        console.error(`[loadCollectionSources] Error fetching sources for ${collectionId}:`, error)
        setCollectionSources(prev => ({ ...prev, [collectionId]: [] }))
        return []
      }

      const sources = (data || []).map(item => {
        if (!item.sources) {
          console.warn(`[loadCollectionSources] No source data found for source_id in collection ${collectionId}`)
          return null
        }
        return item.sources
      }).filter((source): source is Source => source !== null)

      console.log(`[loadCollectionSources] Found ${sources.length} sources for collection ${collectionId}`)
      setCollectionSources(prev => ({ ...prev, [collectionId]: sources }))
      return sources
    } catch (error) {
      console.error(`[loadCollectionSources] Error:`, error)
      setCollectionSources(prev => ({ ...prev, [collectionId]: [] }))
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Add sources to a collection
   */
  const addSourcesToCollection = useCallback(async (
    collectionId: string, 
    sourceIds: string[]
  ): Promise<boolean> => {
    if (!sourceIds.length) return true
    
    try {
      console.log(`[addSourcesToCollection] Adding ${sourceIds.length} sources to collection ${collectionId}`)
      
      const addPromises = sourceIds.map(async (sourceId) => {
        const { error } = await supabase.from('collection_sources')
          .insert([{ collection_id: collectionId, source_id: sourceId }])
        
        if (error) {
          console.error(`[addSourcesToCollection] Error adding source ${sourceId}:`, error)
          return false
        }
        return true
      })
      
      const results = await Promise.all(addPromises)
      const success = results.every(result => result === true)
      
      if (success) {
        // Refresh the collection sources
        await loadCollectionSources(collectionId)
      }
      
      return success
    } catch (error) {
      console.error(`[addSourcesToCollection] Error:`, error)
      return false
    }
  }, [loadCollectionSources])

  /**
   * Remove sources from a collection
   */
  const removeSourcesFromCollection = useCallback(async (
    collectionId: string, 
    sourceIds: string[]
  ): Promise<boolean> => {
    if (!sourceIds.length) return true
    
    try {
      console.log(`[removeSourcesFromCollection] Removing ${sourceIds.length} sources from collection ${collectionId}`)
      
      const removePromises = sourceIds.map(async (sourceId) => {
        const { error } = await supabase.from('collection_sources')
          .delete()
          .match({ collection_id: collectionId, source_id: sourceId })
        
        if (error) {
          console.error(`[removeSourcesFromCollection] Error removing source ${sourceId}:`, error)
          return false
        }
        return true
      })
      
      const results = await Promise.all(removePromises)
      const success = results.every(result => result === true)
      
      if (success) {
        // Update local state
        setCollectionSources(prev => {
          const updated = { ...prev }
          if (updated[collectionId]) {
            updated[collectionId] = updated[collectionId].filter(
              source => !sourceIds.includes(source.id)
            )
          }
          return updated
        })
      }
      
      return success
    } catch (error) {
      console.error(`[removeSourcesFromCollection] Error:`, error)
      return false
    }
  }, [])

  return {
    collectionSources,
    loading,
    loadCollectionSources,
    addSourcesToCollection,
    removeSourcesFromCollection
  }
}
