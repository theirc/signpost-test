import React, { useState, useCallback } from "react"
import { usePermissions } from "@/lib/hooks/usePermissions"
import { useTeamStore } from "@/lib/hooks/useTeam"
import { HighlightText } from "@/components/ui/shadcn-io/highlight-text"
import { Button } from "@/components/ui/button"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Brain, Eye, Download, Activity, MessageSquare } from "lucide-react"
import { LogsFilters } from "@/components/logs-filters"
import { DataTableSupabase } from "@/components/datatable/supadatatable"
import { DataTable } from "@/components/datatable/datatable"
import { ConversationLogsTable } from "./components/conversation-logs-table"
import { ConversationDetailDialog } from "./components/conversation-detail-dialog"
import { ConversationAnalysisManager } from "./components/conversation-analysis-manager"

import { ConversationLog, LogFilters, ConversationAnalysisResult } from "./types"
import { ConversationFilterService } from "./services/conversationFilterService"
import { CSVExportService } from "./services/csvExportService"
import { useAgents } from "./hooks/useAgents"
import { Tables } from "@/lib/agents/supabase"
import { useConversationLogs } from "./hooks/useConversationLogs"

type Table = Tables<"logs">
const executionLogsColumns: Columns<Table> = {
  id: { header: "ID" },
  uid: { header: "UID" },
  created_at: { header: "Created", cell: DataTable.cellRender.date },
  agent: { header: "Agent" },
  team_id: { header: "Team" },
  type: { header: "Type" },
  worker: { header: "Worker" },
  message: { header: "Message" },
  parameters: { header: "Parameters", cell: DataTable.cellRender.json },
  handles: { header: "Handles", cell: DataTable.cellRender.json },
  inputTokens: { header: "Input Tokens", cell: DataTable.cellRender.number },
  outputTokens: { header: "Output Tokens", cell: DataTable.cellRender.number },
}

function buildExecutionLogFilter(filters: LogFilters, teamId: string) {
  return (builder: any) => {
    let query = builder.eq("team_id", teamId)
    
    if (filters.selectedAgent && filters.selectedAgent !== 'all') {
      query = query.eq("agent", filters.selectedAgent)
    }
    
    if (filters.dateRange?.from) {
      query = query.gte("created_at", `${filters.dateRange.from}T00:00:00.000Z`)
    }
    
    if (filters.dateRange?.to) {
      query = query.lte("created_at", `${filters.dateRange.to}T23:59:59.999Z`)
    }
    
    if (filters.searchQuery) {
      query = query.ilike("message", `%${filters.searchQuery}%`)
    }
    
    return query
  }
}

export function BotLogsTable() {
  const { canRead } = usePermissions()
  const { selectedTeam } = useTeamStore()
  
  const [activeTab, setActiveTab] = useState<'execution' | 'conversation'>('conversation')
  const [filters, setFilters] = useState<LogFilters>(ConversationFilterService.getDefaultFilters())
  const [selectedConversation, setSelectedConversation] = useState<ConversationLog | null>(null)
  const [showConversationDetail, setShowConversationDetail] = useState(false)
  const [conversationsWithAnalysis, setConversationsWithAnalysis] = useState<ConversationLog[]>([])
  const [hasAnalysisData, setHasAnalysisData] = useState(false)

  const { data: agents } = useAgents(selectedTeam?.id)
  const { data: conversationLogs, isLoading } = useConversationLogs(selectedTeam?.id, filters, agents || [])

  const handleViewConversation = useCallback((conversation: ConversationLog) => {
    setSelectedConversation(conversation)
    setShowConversationDetail(true)
  }, [])

  const handleAnalysisComplete = useCallback((results: ConversationAnalysisResult[]) => {
    const updatedConversations = (conversationLogs || []).map(conversation => {
      const analysisResult = results.find(r => r.conversationUid === conversation.uid)
      return analysisResult ? { ...conversation, analysis: analysisResult } : conversation
    })
    
    setConversationsWithAnalysis(updatedConversations)
    setHasAnalysisData(results.length > 0)
  }, [conversationLogs])

  const handleExportConversations = useCallback(() => {
    const dataToExport = conversationsWithAnalysis.length > 0 ? conversationsWithAnalysis : (conversationLogs || [])
    CSVExportService.exportConversationsToCSV(dataToExport, hasAnalysisData)
  }, [conversationsWithAnalysis, conversationLogs, hasAnalysisData])

  const handleExportExecution = useCallback(() => {
    CSVExportService.exportExecutionLogsToCSV(selectedTeam?.id || '')
  }, [selectedTeam?.id])

  const displayConversations = conversationsWithAnalysis.length > 0 ? conversationsWithAnalysis : (conversationLogs || [])

  if (!canRead("logs")) {
    return (
      <div className="flex-1 p-8 pt-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to view logs.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-y-scroll">
      <div className="flex-1 p-8 pt-6">
        <div className="mb-6">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-3">
            <HighlightText text="Bot Logs" className="text-4xl font-bold" />
          </h1>
          <p className="text-lg text-gray-600 font-medium leading-relaxed">
            Monitor and analyze agent execution logs and conversation flows.
          </p>
        </div>

        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('conversation')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'conversation'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <MessageSquare className="h-4 w-4 inline mr-2" />
              Conversation Logs
            </button>
            <button
              onClick={() => setActiveTab('execution')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'execution'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Activity className="h-4 w-4 inline mr-2" />
              Execution Logs
            </button>
          </nav>
        </div>

        <LogsFilters
          filters={filters}
          onFilterChange={setFilters}
          agents={agents || []}
          hasActiveFilters={ConversationFilterService.hasActiveFilters(filters)}
          onClearFilters={() => setFilters(ConversationFilterService.getDefaultFilters())}
        />

        {activeTab === 'execution' ? (
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden h-[calc(100vh-200px)] flex flex-col">
            <div className="p-6 flex-shrink-0">
              <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg border">
                <h3 className="text-lg font-semibold text-gray-900">Execution Logs</h3>
                <Button variant="default" size="sm" onClick={handleExportExecution} className="bg-blue-600 hover:bg-blue-700">
                  <Download className="h-4 w-4 mr-2" />
                  Export Logs
                </Button>
              </div>
            </div>
            <div className="flex-1 overflow-hidden px-6 pb-6">
              <DataTableSupabase
                columns={executionLogsColumns}
                table="logs"
                filter={buildExecutionLogFilter(filters, selectedTeam?.id || '')}
                sort={["created_at", "desc"]}
                hideActions
                hideSelection
                className="h-full"
              />
            </div>
          </div>
        ) : (
          <>
            {!filters.selectedAgent ? (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
                <div className="max-w-md mx-auto">
                  <div className="text-blue-600 mb-4">
                    <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-blue-900 mb-2">Select an Agent</h3>
                  <p className="text-blue-700">
                    Please select an agent from the filters above to view conversation logs and analysis tools.
                  </p>
                </div>
              </div>
            ) : (
              <Accordion type="multiple" defaultValue={[]} className="space-y-4">
                <AccordionItem value="analysis" className="border rounded-lg">
                  <AccordionTrigger className="px-6 py-4 hover:no-underline">
                    <div className="flex items-center gap-3">
                      <Brain className="h-5 w-5 text-purple-600" />
                      <span className="text-lg font-semibold">Conversation Analysis</span>
                      <span className="text-sm text-gray-500">• Analyze conversations with AI to extract insights and patterns</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-6">
                    {isLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="flex flex-col items-center gap-2">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                          <p className="text-sm text-gray-600">Loading conversations for analysis...</p>
                        </div>
                      </div>
                    ) : (
                      <ConversationAnalysisManager
                        conversations={conversationLogs || []}
                        onAnalysisComplete={handleAnalysisComplete}
                      />
                    )}
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="logs" className="border rounded-lg">
                  <AccordionTrigger className="px-6 py-4 hover:no-underline">
                    <div className="flex items-center gap-3">
                      <Eye className="h-5 w-5 text-blue-600" />
                      <span className="text-lg font-semibold">Conversation Logs</span>
                      <span className="text-sm text-gray-500">• Browse and analyze conversation history</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-6">
                    {isLoading ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="flex flex-col items-center gap-3">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                          <p className="text-sm text-gray-600">Loading conversations...</p>
                        </div>
                      </div>
                    ) : (
                      <ConversationLogsTable
                        data={conversationLogs || []}
                        onViewConversation={handleViewConversation}
                        onExport={handleExportConversations}
                      />
                    )}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            )}
          </>
        )}
      </div>

      <ConversationDetailDialog
        conversation={selectedConversation}
        open={showConversationDetail}
        onOpenChange={setShowConversationDetail}
      />
    </div>
  )
}