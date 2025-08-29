import { useQuery } from "@tanstack/react-query"
import { useMemo } from "react"
import { supabase } from "@/lib/agents/db"
import { LogFilters, ConversationLog, LogRawData, Agent } from "../types"
import { ConversationLogProcessor } from "../services/conversationLogProcessor"
import { ConversationFilterService } from "../services/conversationFilterService"
import { useDebouncedValue } from "./useDebouncedValue"

export function useConversationLogs(
  teamId: string | undefined,
  filters: LogFilters,
  agents: Agent[]
) {
  const debouncedSearchQuery = useDebouncedValue(filters.searchQuery, 300)
  
  const debouncedFilters = useMemo(() => ({
    ...filters,
    searchQuery: debouncedSearchQuery
  }), [filters.selectedAgent, filters.dateRange, debouncedSearchQuery])

  const query = useQuery({
    queryKey: ['conversationLogs', teamId, debouncedFilters.selectedAgent, debouncedFilters.dateRange, debouncedFilters.searchQuery],
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
      if (debouncedFilters.selectedAgent && debouncedFilters.selectedAgent !== 'all') {
        query = query.eq('agent', debouncedFilters.selectedAgent)
      }

      // Apply date filters at database level for better performance
      if (debouncedFilters.dateRange.from) {
        query = query.gte('created_at', `${debouncedFilters.dateRange.from}T00:00:00.000Z`)
      }
      if (debouncedFilters.dateRange.to) {
        query = query.lte('created_at', `${debouncedFilters.dateRange.to}T23:59:59.999Z`)
      }

      const { data: logs, error } = await query
      if (error) throw error

      const conversations = ConversationLogProcessor.groupLogsByConversation(
        logs as LogRawData[], 
        agents
      )
      
      // Apply client-side filters (search query and any additional filtering)
      return ConversationFilterService.filterConversations(conversations, debouncedFilters)
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
