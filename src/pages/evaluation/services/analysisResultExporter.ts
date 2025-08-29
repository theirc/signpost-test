import { ConversationAnalysisResult } from "../types"

export class AnalysisResultExporter {
  
  private static escapeCSV(text: any): string {
    if (!text) return ''
    const escaped = text.toString().replace(/"/g, '""')
    return `"${escaped}"`
  }

  static exportAnalysisResults(results: ConversationAnalysisResult[]) {
    if (results.length === 0) return

    const headers = ['Conversation UID', 'Config', 'Processed At', 'Error']
    const allFields = new Set<string>()
    
    results.forEach(result => {
      Object.keys(result.results || {}).forEach(key => allFields.add(key))
    })
    
    const fieldHeaders = Array.from(allFields).sort()
    const csvHeaders = [...headers, ...fieldHeaders]
    
    const csvContent = [
      csvHeaders.join(','),
      ...results.map(result => [
        this.escapeCSV(result.conversationUid),
        this.escapeCSV(result.configId),
        this.escapeCSV(result.processedAt),
        this.escapeCSV(result.error || ''),
        ...fieldHeaders.map(field => {
          const value = result.results?.[field]
          if (Array.isArray(value)) return this.escapeCSV(value.join('; '))
          if (value !== null && value !== undefined) return this.escapeCSV(value.toString())
          return 'N/A'
        })
      ].join(','))
    ].join('\n')
    
    this.downloadCSV(csvContent, this.generateFileName())
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

  private static generateFileName(): string {
    return `conversation-analysis-${new Date().toISOString().split('T')[0]}.csv`
  }
}
