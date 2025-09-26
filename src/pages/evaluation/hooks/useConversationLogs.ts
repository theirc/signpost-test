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
    queryFn: async ({ signal }): Promise<ConversationLog[]> => {
      if (!teamId) {
        return []
      }
      
      const conversationWorkers = ConversationLogProcessor.getConversationWorkers()
      const chunkSize = 500
      const maxRecords = 50000
      const totalChunks = Math.ceil(maxRecords / chunkSize)
      
      const chunkPromises = []
      
      for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
        const chunkOffset = chunkIndex * chunkSize
        const chunkLimit = chunkSize
        
        const chunkPromise = (async () => {
          try {
            if (signal?.aborted) {
              throw new Error('Query cancelled')
            }
            
            let query = supabase
              .from('logs')
              .select('id, agent, worker, workerId, execution, session, type, message, parameters, state, handles, inputTokens, outputTokens, created_at, team_id, uid')
              .eq('team_id', teamId)
              .in('worker', conversationWorkers)
              .not('uid', 'is', null)
              .order('created_at', { ascending: true })
              .range(chunkOffset, chunkOffset + chunkLimit - 1)
            
            if (filters.selectedAgent && filters.selectedAgent !== 'all') {
              query = query.eq('agent', filters.selectedAgent)
            }
            
            if (filters.dateRange.from) {
              query = query.gte('created_at', `${filters.dateRange.from}T00:00:00.000Z`)
            }
            if (filters.dateRange.to) {
              query = query.lte('created_at', `${filters.dateRange.to}T23:59:59.999Z`)
            }
            
            const queryPromise = query
            const cancellationPromise = new Promise((_, reject) => {
              if (signal) {
                signal.addEventListener('abort', () => {
                  reject(new Error('Query cancelled'))
                })
              }
            })
            
            const { data: logs, error } = await Promise.race([queryPromise, cancellationPromise]) as any
            
            if (error) {
              if (error.code === '57014') {
                return { logs: [], chunkIndex }
              }
              throw error
            }
            return { logs: logs || [], chunkIndex }
          } catch (error) {
            if (signal?.aborted) {
              throw error
            }
            return { logs: [], chunkIndex }
          }
        })()
        
        chunkPromises.push(chunkPromise)
      }
      
      try {
        const chunkResults = await Promise.allSettled(chunkPromises)
        
        if (signal?.aborted) {
          throw new Error('Query cancelled')
        }
        
        const successfulChunks = chunkResults
          .filter((result): result is PromiseFulfilledResult<{ logs: any[], chunkIndex: number }> => 
            result.status === 'fulfilled')
          .map(result => result.value)
        
        const allLogs = successfulChunks.flatMap(result => result.logs)

        const conversations = ConversationLogProcessor.groupLogsByConversation(
          allLogs as LogRawData[], 
          agents
        )
        
        return ConversationFilterService.filterConversations(conversations, filters)
        
      } catch (error) {
        if (signal?.aborted) {
          throw error
        }
        
        const fallbackQuery = supabase
          .from('logs')
          .select('id, agent, worker, workerId, execution, session, type, message, parameters, state, handles, inputTokens, outputTokens, created_at, team_id, uid')
          .eq('team_id', teamId)
          .in('worker', conversationWorkers)
          .not('uid', 'is', null)
          .order('created_at', { ascending: true })
          .limit(1000)
        
        if (filters.selectedAgent && filters.selectedAgent !== 'all') {
          fallbackQuery.eq('agent', filters.selectedAgent)
        }
        
        if (filters.dateRange.from) {
          fallbackQuery.gte('created_at', `${filters.dateRange.from}T00:00:00.000Z`)
        }
        if (filters.dateRange.to) {
          fallbackQuery.lte('created_at', `${filters.dateRange.to}T23:59:59.999Z`)
        }
        
        const fallbackQueryPromise = fallbackQuery
        const fallbackCancellationPromise = new Promise((_, reject) => {
          if (signal) {
            signal.addEventListener('abort', () => {
              reject(new Error('Query cancelled'))
            })
          }
        })
        
        const { data: fallbackLogs, error: fallbackError } = await Promise.race([fallbackQueryPromise, fallbackCancellationPromise]) as any
        if (fallbackError) {
          throw new Error(`Query failed: ${fallbackError.message}`)
        }
        
        const fallbackConversations = ConversationLogProcessor.groupLogsByConversation(
          fallbackLogs as LogRawData[], 
          agents
        )
        
        return ConversationFilterService.filterConversations(fallbackConversations, filters)
      }
    },
    enabled: !!teamId,
    retry: 1,
    retryDelay: 2000,
    staleTime: 5 * 60 * 1000
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