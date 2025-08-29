import { ConversationLog, LogFilters } from "../types"

export class ConversationFilterService {
  
  static filterConversations(
    conversations: ConversationLog[], 
    filters: LogFilters
  ): ConversationLog[] {
    let filteredConversations = [...conversations]
    
    // Note: Agent filtering is handled at the database level in useConversationLogs
    // This function focuses on client-side filtering (search, additional date filtering)
    
    if (filters.dateRange.from || filters.dateRange.to) {
      filteredConversations = this.filterByDateRange(filteredConversations, filters.dateRange)
    }

    if (filters.searchQuery) {
      filteredConversations = this.filterBySearch(filteredConversations, filters.searchQuery)
    }

    return filteredConversations
  }

  private static filterByDateRange(
    conversations: ConversationLog[], 
    dateRange: { from: string; to: string }
  ): ConversationLog[] {
    return conversations.filter(conv => {
      const startDate = new Date(conv.startedAt)
      const lastActivityDate = new Date(conv.lastActivity)
      
      if (dateRange.from) {
        const fromDate = new Date(`${dateRange.from}T00:00:00.000Z`)
        if (startDate < fromDate) return false
      }
      
      if (dateRange.to) {
        const toDate = new Date(`${dateRange.to}T23:59:59.999Z`)
        if (lastActivityDate > toDate) return false
      }
      
      return true
    })
  }

  private static filterBySearch(
    conversations: ConversationLog[], 
    searchQuery: string
  ): ConversationLog[] {
    const searchLower = searchQuery.toLowerCase().trim()
    
    return conversations.filter(conv => {
      if (conv.uid.toLowerCase() === searchLower) return true
      if (conv.uid.toLowerCase().includes(searchLower)) return true
      if (conv.agentTitle.toLowerCase().includes(searchLower)) return true
      
      return conv.conversationSteps.some(step => 
        step.message.toLowerCase().includes(searchLower) ||
        step.handles?.some((handle: any) => 
          (handle.value || '').toString().toLowerCase().includes(searchLower)
        )
      )
    })
  }

  static buildSupabaseFilters(filters: LogFilters) {
    const supabaseFilters: any = {}
    
    if (filters.selectedAgent && filters.selectedAgent !== 'all') {
      supabaseFilters.agent = filters.selectedAgent
    }
    
    if (filters.dateRange?.from) {
      supabaseFilters.dateFrom = filters.dateRange.from
    }

    if (filters.dateRange?.to) {
      supabaseFilters.dateTo = filters.dateRange.to
    }
    
    return supabaseFilters
  }

  static hasActiveFilters(filters: LogFilters): boolean {
    return (
      (filters.selectedAgent && filters.selectedAgent !== 'all') ||
      !!filters.searchQuery ||
      !!filters.dateRange?.from ||
      !!filters.dateRange?.to
    )
  }

  static getDefaultFilters(): LogFilters {
    return {
      selectedAgent: 'all',
      searchQuery: '',
      dateRange: { from: '', to: '' }
    }
  }
}