import { useState, useCallback, useEffect } from "react"
import { useTeamStore } from "@/lib/hooks/useTeam"
import { supabase } from "@/lib/agents/db"
import { Source } from "./types"
import { transformSourcesForDisplay } from "./utils"

/**
 * Custom hook for managing sources
 */
export const useSources = () => {
  const [sources, setSources] = useState<Source[]>([])
  const [sourcesDisplay, setSourcesDisplay] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { selectedTeam } = useTeamStore()

  /**
   * Fetch all sources for the current team
   */
  const fetchSources = useCallback(async () => {
    if (!selectedTeam) return
    
    setLoading(true)
    try {
      const { data, error } = await supabase.from('sources')
        .select('id, name, type, created_at, last_updated, tags, team_id')
        .eq('team_id', selectedTeam.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error("Error fetching sources:", error)
        setSources([])
        return
      }

      setSources(data as Source[])
      setSourcesDisplay(transformSourcesForDisplay(data as Source[]))
    } catch (err) {
      console.error("Error in fetchSources:", err)
      setSources([])
    } finally {
      setLoading(false)
    }
  }, [selectedTeam])

  // Set up real-time subscription to sources
  useEffect(() => {
    if (!selectedTeam) return

    const channel = supabase
      .channel('sources-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'sources' },
        payload => {
          console.log('Sources real-time update received:', payload)
          fetchSources() // Refresh sources on change
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [selectedTeam, fetchSources])

  // Initial fetch
  useEffect(() => {
    fetchSources()
  }, [fetchSources])

  return {
    sources,
    sourcesDisplay,
    loading,
    fetchSources
  }
}
