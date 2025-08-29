import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/agents/db"
import { Agent } from "../types"

export function useAgents(teamId: string | undefined) {
  return useQuery({
    queryKey: ['agents', teamId],
    queryFn: async (): Promise<Agent[]> => {
      if (!teamId) return []
      
      const { data, error } = await supabase
        .from('agents')
        .select('id, title')
        .eq('team_id', teamId)
        .order('title')
      
      if (error) throw error
      return data || []
    },
    enabled: !!teamId
  })
}
