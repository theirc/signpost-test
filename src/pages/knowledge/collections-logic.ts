import { useState, useCallback, useEffect } from "react"
import { useTeamStore } from "@/lib/hooks/useTeam"
import { supabase } from "@/lib/agents/db"
import { 
  Collection, 
  DeleteCollectionResult, 
  VectorGenerationResult,
  CollectionWithSourceCount
} from "./types"
import { generateCollectionVector } from "./vector-generation"

// Export hooks from separate files
export { useCollectionSources } from './collection-sources-hooks'
export { useSources } from './sources-hooks'

/**
 * Custom hook for managing collections
 */
export const useCollections = () => {
  const [collections, setCollections] = useState<CollectionWithSourceCount[]>([])
  const [loading, setLoading] = useState(true)
  const { selectedTeam } = useTeamStore()
  const [collectionSourceCounts, setCollectionSourceCounts] = useState<Record<string, { total: number, vectorized: number }>>({})

  /**
   * Fetch collections from the database
   */
  const fetchCollections = useCallback(async () => {
    if (!selectedTeam) return

    setLoading(true)
    try {
      // Fetch collections
      const { data, error } = await supabase.from('collections')
        .select('*')
        .eq('team_id', selectedTeam.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching collections:', error)
        setCollections([])
        return
      }

      // Get source counts for each collection
      const sourceCounts = await getCollectionSourceCounts(data.map(c => c.id))
      
      // Enhance collections with source counts
      const enhancedCollections = data.map(collection => ({
        ...collection,
        sourceCount: sourceCounts[collection.id]?.total || 0,
        vectorizedCount: sourceCounts[collection.id]?.vectorized || 0
      }))

      setCollections(enhancedCollections)
      setCollectionSourceCounts(sourceCounts)
    } catch (err) {
      console.error('Error in fetchCollections:', err)
      setCollections([])
    } finally {
      setLoading(false)
    }
  }, [selectedTeam])

  /**
   * Get source counts for collections, including vectorization status
   */
  const getCollectionSourceCounts = async (collectionIds: string[]): Promise<Record<string, { total: number, vectorized: number }>> => {
    if (!collectionIds.length) return {}
    
    try {
      // Query to get all collection sources with their vector status
      const { data, error } = await supabase
        .from('collection_sources')
        .select(`
          collection_id,
          sources:source_id (
            id,
            vector
          )
        `)
        .in('collection_id', collectionIds)

      if (error) {
        console.error('Error fetching collection source counts:', error)
        return {}
      }

      // Process the results to count total and vectorized sources per collection
      const counts: Record<string, { total: number, vectorized: number }> = {}
      
      data.forEach(item => {
        const collectionId = item.collection_id
        
        if (!counts[collectionId]) {
          counts[collectionId] = { total: 0, vectorized: 0 }
        }
        
        counts[collectionId].total++
        
        // Check if the source has a vector
        if (item.sources?.vector) {
          counts[collectionId].vectorized++
        }
      })

      return counts
    } catch (error) {
      console.error('Error in getCollectionSourceCounts:', error)
      return {}
    }
  }

  /**
   * Delete a collection and its relationships
   */
  const deleteCollection = async (id: string): Promise<DeleteCollectionResult> => {
    try {
      console.log(`[deleteCollection] Starting deletion of collection ${id}`)

      if (!selectedTeam) {
        throw new Error('No team selected')
      }

      // 1. Get any bots using this collection
      const { data: linkedBots, error: botsError } = await supabase
        .from('bots')
        .select('id')
        .eq('collection', id)

      if (botsError) {
        console.error(`[deleteCollection] Error checking for linked bots:`, botsError)
        throw botsError
      }

      if (linkedBots && linkedBots.length > 0) {
        console.log(`[deleteCollection] Found ${linkedBots.length} bots linked to collection ${id}`)
        // 1a. Unlink the bots by setting their collection to null
        const { error: unlinkError } = await supabase
          .from('bots')
          .update({ collection: null })
          .eq('collection', id)

        if (unlinkError) {
          console.error(`[deleteCollection] Error unlinking bots:`, unlinkError)
          throw unlinkError
        }
        console.log(`[deleteCollection] Successfully unlinked ${linkedBots.length} bots`)
      }

      // 2. Delete collection_sources relationships
      const { error: deleteRelationshipsError } = await supabase
        .from('collection_sources')
        .delete()
        .eq('collection_id', id)

      if (deleteRelationshipsError) {
        console.error(`[deleteCollection] Error deleting collection relationships:`, deleteRelationshipsError)
        throw deleteRelationshipsError
      }

      // 3. Delete the collection itself
      const { error: deleteCollectionError } = await supabase
        .from('collections')
        .delete()
        .eq('id', id)
        .eq('team_id', selectedTeam.id)
        
      if (deleteCollectionError) {
        console.error(`[deleteCollection] Error deleting collection:`, deleteCollectionError)
        throw deleteCollectionError
      }

      console.log(`[deleteCollection] Successfully deleted collection ${id} and its relationships`)
      return { success: true, error: null }
    } catch (error) {
      console.error(`[deleteCollection] Error:`, error)
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error))
      }
    }
  }

  // Use the imported generateCollectionVector function

  // Set up real-time subscription to collections
  useEffect(() => {
    if (!selectedTeam) return

    const channel = supabase
      .channel('collections-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'collections' },
        payload => {
          console.log('Collections real-time update received:', payload)
          fetchCollections() // Refresh collections on change
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [selectedTeam, fetchCollections])

  // Initial fetch
  useEffect(() => {
    fetchCollections()
  }, [fetchCollections])

  return {
    collections,
    loading,
    fetchCollections,
    deleteCollection,
    generateCollectionVector,
    collectionSourceCounts
  }
}
