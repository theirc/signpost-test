import { ConversationLog } from "../types"
import { supabase } from "@/lib/agents/db"

export class CSVExportService {
  
  private static escapeCSV(text: any): string {
    if (!text) return ''
    const escaped = text.toString().replace(/"/g, '""')
    return `"${escaped}"`
  }

  static exportConversationsToCSV(conversations: ConversationLog[], includeAnalysis: boolean = false) {
    try {
      const baseHeaders = ['UID', 'Agent', 'Started At', 'Last Activity', 'Total Steps']
      
      const analysisFields = new Set<string>()
      if (includeAnalysis) {
        conversations.forEach(conversation => {
          if (conversation.analysis?.results) {
            Object.keys(conversation.analysis.results).forEach(key => analysisFields.add(key))
          }
        })
      }
      
      const analysisHeaders = Array.from(analysisFields).sort().map(field => `Analysis: ${field}`)
      const allHeaders = [...baseHeaders, ...analysisHeaders]
      
      if (includeAnalysis && analysisFields.size > 0) {
        allHeaders.push('Analysis Processed At', 'Analysis Error')
      }
      
      const csvContent = [
        allHeaders.join(','),
        ...conversations.map(conversation => {
          const baseRow = [
            this.escapeCSV(conversation.uid),
            this.escapeCSV(conversation.agentTitle),
            this.escapeCSV(conversation.startedAt),
            this.escapeCSV(conversation.lastActivity),
            this.escapeCSV(conversation.totalSteps.toString())
          ]
          
          if (includeAnalysis && analysisFields.size > 0) {
            const analysisResults = conversation.analysis?.results || {}
            const analysisRow = Array.from(analysisFields).sort().map(field => {
              const value = analysisResults[field]
              
              if (Array.isArray(value)) {
                return this.escapeCSV(value.length > 0 ? value.join('; ') : 'N/A')
              }
              if (value !== null && value !== undefined && value !== '') {
                return this.escapeCSV(value.toString())
              }
              return 'N/A'
            })
            
            const metaRow = [
              this.escapeCSV(conversation.analysis?.processedAt || 'Not analyzed'),
              this.escapeCSV(conversation.analysis?.error || (conversation.analysis ? '' : 'No analysis data'))
            ]
            
            return [...baseRow, ...analysisRow, ...metaRow].join(',')
          }
          
          return baseRow.join(',')
        })
      ].join('\n')
      
      this.downloadCSV(csvContent, this.generateConversationFileName(includeAnalysis, analysisFields.size > 0))
    } catch (error) {
      console.error('Export failed:', error)
      alert('Failed to export conversation logs. Please try again.')
    }
  }

  static async exportExecutionLogsToCSV(teamId: string) {
    try {
      const { data: logs, error } = await supabase
        .from('logs')
        .select('*')
        .eq('team_id', teamId)
        .order('created_at', { ascending: false })

      if (error) throw error

      if (!logs || logs.length === 0) {
        alert('No logs found to export.')
        return
      }

      const headers = [
        'ID', 'Agent', 'Worker', 'Execution', 'Session', 'Type', 'Message',
        'Input Tokens', 'Output Tokens', 'Created At', 'Team ID', 'UID'
      ]

      const csvContent = [
        headers.join(','),
        ...logs.map((log: any) => [
          this.escapeCSV(log.id),
          this.escapeCSV(log.agent),
          this.escapeCSV(log.worker),
          this.escapeCSV(log.execution),
          this.escapeCSV(log.session),
          this.escapeCSV(log.type),
          this.escapeCSV(log.message),
          this.escapeCSV(log.inputTokens?.toString() || ''),
          this.escapeCSV(log.outputTokens?.toString() || ''),
          this.escapeCSV(log.created_at),
          this.escapeCSV(log.team_id),
          this.escapeCSV((log as any).uid || '')
        ].join(','))
      ].join('\n')

      this.downloadCSV(csvContent, this.generateExecutionFileName())
    } catch (error) {
      console.error('Export failed:', error)
      alert('Failed to export logs. Please try again.')
    }
  }

  private static downloadCSV(content: string, filename: string) {
    const blob = new Blob([content], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    window.URL.revokeObjectURL(url)
  }

  private static generateConversationFileName(includeAnalysis: boolean, hasAnalysisData: boolean): string {
    const suffix = includeAnalysis && hasAnalysisData ? '-with-analysis' : ''
    return `conversation-logs${suffix}-${new Date().toISOString().split('T')[0]}.csv`
  }

  private static generateExecutionFileName(): string {
    return `execution-logs-${new Date().toISOString().split('T')[0]}.csv`
  }
}