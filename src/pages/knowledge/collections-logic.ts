import { useEffect } from "react"
import { useTeamStore } from "@/lib/hooks/useTeam"
import { supabase } from "@/lib/agents/db"
import { 
  DeleteCollectionResult, 
  CollectionWithSourceCount
} from "./types"
import { generateCollectionVector } from "./vector-generation"
import { useQuery } from "@tanstack/react-query"

// Export hooks from separate files
export { useCollectionSources } from './collection-sources-hooks'
export { useSources } from './sources-hooks'

/**
 * Custom hook for managing collections
 */
export const useCollections = () => {
  const { selectedTeam } = useTeamStore()

  const fetchCollections = async () => {
    if (!selectedTeam) return []
    const { data, error } = await supabase
      .from("collections_with_counts")
      .select("*")
      .eq("team_id", selectedTeam.id)
      .order("created_at", { ascending: false })
    if (error) {
      console.error('Error fetching collections:', error)
      return []
    }
    return data as CollectionWithSourceCount[]
  }

  const { data: collections, isLoading, refetch } = useQuery({
    queryKey: ['collections', selectedTeam?.id],
    queryFn: fetchCollections,
    enabled: !!selectedTeam
  })

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
      refetch()
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
          refetch() // Refresh collections on change
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [selectedTeam, refetch])

  return {
    collections: collections ?? [],
    loading: isLoading,
    deleteCollection,
    generateCollectionVector,
    refetchCollections: refetch
  }
}
