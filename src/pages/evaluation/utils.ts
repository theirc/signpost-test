import { supabase } from "@/lib/agents/db"

export function escapeCSV(text: string): string {
  if (!text) return ''
  const escaped = text.toString().replace(/"/g, '""')
  return `"${escaped}"`
}

export function buildFilters(filters: any) {
  const supabaseFilters: any = {}
  
  if (filters.selectedAgent && filters.selectedAgent !== 'all') {
    supabaseFilters.agent = filters.selectedAgent
  }
  
  if (filters.selectedWorker && filters.selectedWorker !== 'all') {
    supabaseFilters.worker = filters.selectedWorker
  }
  
  if (filters.selectedType && filters.selectedType !== 'all') {
    supabaseFilters.type = filters.selectedType
  }
  
  if (filters.searchQuery) {
    supabaseFilters.message = filters.searchQuery
  }
  
  return supabaseFilters
}

export function hasActiveFilters(filters: any): boolean {
  return (
    (filters.selectedAgent && filters.selectedAgent !== 'all') ||
    (filters.selectedWorker && filters.selectedWorker !== 'all') ||
    (filters.selectedType && filters.selectedType !== 'all') ||
    filters.searchQuery ||
    filters.dateRange.from ||
    filters.dateRange.to
  )
}

export function clearFilters(setFilters: any) {
  setFilters({
    selectedAgent: 'all',
    selectedWorker: 'all',
    selectedType: 'all',
    searchQuery: '',
    dateRange: { from: '', to: '' }
  })
}

export async function exportToCSV(teamId: string) {
  try {
    const { data: logs, error } = await supabase
      .from('logs')
      .select('*')
      .eq('team_id', teamId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    
    const csvContent = [
      ['ID', 'Agent', 'Worker', 'Worker ID', 'Execution', 'Session', 'Type', 'Message', 'Parameters', 'State', 'Handles', 'Input Tokens', 'Output Tokens', 'Created At', 'Team ID', 'UID'].join(','),
      ...logs.map(log => [
        escapeCSV(log.id),
        escapeCSV(log.agent),
        escapeCSV(log.worker),
        escapeCSV(log.workerId),
        escapeCSV(log.execution),
        escapeCSV(log.session),
        escapeCSV(log.type),
        escapeCSV(log.message),
        escapeCSV(JSON.stringify(log.parameters)),
        escapeCSV(JSON.stringify(log.state)),
        escapeCSV(JSON.stringify(log.handles)),
        escapeCSV(log.inputTokens?.toString() || ''),
        escapeCSV(log.outputTokens?.toString() || ''),
        escapeCSV(log.created_at),
        escapeCSV(log.team_id),
        escapeCSV((log as any).uid || '')
      ].join(','))
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `logs-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Export failed:', error)
    alert('Failed to export logs. Please try again.')
  }
}

export function exportConversationsToCSV(conversations: any[]) {
  try {
    const csvContent = [
      ['UID', 'Agent', 'Started At', 'Last Activity', 'Total Steps'].join(','),
      ...conversations.map(conversation => [
        escapeCSV(conversation.uid),
        escapeCSV(conversation.agentTitle),
        escapeCSV(conversation.startedAt),
        escapeCSV(conversation.lastActivity),
        escapeCSV(conversation.totalSteps.toString())
      ].join(','))
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `conversation-logs-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Export failed:', error)
    alert('Failed to export conversation logs. Please try again.')
  }
}