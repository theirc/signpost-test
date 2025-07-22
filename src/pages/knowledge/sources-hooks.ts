import { supabase } from "@/lib/agents/db"
import { useTeamStore } from "@/lib/hooks/useTeam"
import { Source } from "./types"
import { useQuery } from "@tanstack/react-query"

export const useSources = () => {
  const { selectedTeam } = useTeamStore()

  const fetchSources = async () => {
    if (!selectedTeam) return []
    const { data, error } = await supabase
      .from("sources")
      .select("id, name, type, content, tags, created_at, last_updated, team_id")
      .eq("team_id", selectedTeam.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching sources:", error)
      return []
    }
    return data as Source[]
  }

  const { data: sources, isLoading, refetch } = useQuery({
    queryKey: ['sources', selectedTeam?.id],
    queryFn: fetchSources,
    enabled: !!selectedTeam
  })


  const deleteSource = async (id: string) => {
    try {
      const { error } = await supabase.from("sources").delete().eq("id", id)
      if (error) throw error
      refetch()
    } catch (error) {
      console.error("Error deleting source:", error)
    }
  }

  return {
    sources: sources ?? [],
    loading: isLoading,
    deleteSource,
    refetchSources: refetch
  }
}
