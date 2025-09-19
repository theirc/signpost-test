import { useQuery } from "@tanstack/react-query"
import { useMemo } from "react"
import { supabase } from "@/lib/agents/db"
import { LogFilters, ConversationLog, LogRawData, Agent } from "../types"
import { ConversationLogProcessor } from "../services/conversationLogProcessor"
import { ConversationFilterService } from "../services/conversationFilterService"

export function useConversationLogs(
  teamId: string | undefined,
  filters: LogFilters,
  agents: Agent[]
) {
  const query = useQuery({
    queryKey: ['conversationLogs', teamId, filters.selectedAgent, filters.dateRange, filters.searchQuery],
    queryFn: async (): Promise<ConversationLog[]> => {
      if (!teamId) {
        return []
      }
      
      const conversationWorkers = ConversationLogProcessor.getConversationWorkers()
      
      let query = supabase
        .from('logs')
        .select('*')
        .eq('team_id', teamId)
        .in('worker', conversationWorkers)
        .order('created_at', { ascending: true })

      // Only filter by agent if a specific agent is selected
      if (filters.selectedAgent && filters.selectedAgent !== 'all') {
        query = query.eq('agent', filters.selectedAgent)
      }

      // Apply date filters at database level for better performance
      if (filters.dateRange.from) {
        query = query.gte('created_at', `${filters.dateRange.from}T00:00:00.000Z`)
      }
      if (filters.dateRange.to) {
        query = query.lte('created_at', `${filters.dateRange.to}T23:59:59.999Z`)
      }

      const { data: logs, error } = await query
      if (error) throw error

      const conversations = ConversationLogProcessor.groupLogsByConversation(
        logs as LogRawData[], 
        agents
      )
      
      // Apply client-side filters (search query and any additional filtering)
      return ConversationFilterService.filterConversations(conversations, filters)
    },
    enabled: !!teamId
  })

  const processedData = useMemo(() => {
    if (!query.data) return []
    return query.data.map(ConversationLogProcessor.sortConversationSteps)
  }, [query.data])

  return {
    ...query,
    data: processedData
  }
}
