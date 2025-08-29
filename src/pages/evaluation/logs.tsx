import React, { useState, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { usePermissions } from "@/lib/hooks/usePermissions"
import { useTeamStore } from "@/lib/hooks/useTeam"
import { HighlightText } from "@/components/ui/shadcn-io/highlight-text"
import { Button } from "@/components/ui/button"

import { LogsTabs } from "./components/logs-tabs"
import { LogsFilters } from "./components/logs-filters"
import { ExecutionLogsTable } from "./components/execution-logs-table"
import { ConversationLogsTable } from "./components/conversation-logs-table"
import { ConversationDetailDialog } from "./components/conversation-detail-dialog"
import { ConversationAnalysisManager } from "./components/conversation-analysis-manager"

import { ConversationLog, LogFilters, ConversationAnalysisResult } from "./types"
import { ConversationFilterService } from "./services/conversationFilterService"
import { CSVExportService } from "./services/csvExportService"
import { useAgents } from "./hooks/useAgents"
import { useConversationLogs } from "./hooks/useConversationLogs"

export function BotLogsTable() {
  const navigate = useNavigate()
  const { canRead } = usePermissions()
  const { selectedTeam } = useTeamStore()
  
  const [activeTab, setActiveTab] = useState<'execution' | 'conversation'>('conversation')
  const [filters, setFilters] = useState<LogFilters>(ConversationFilterService.getDefaultFilters())
  const [selectedConversation, setSelectedConversation] = useState<ConversationLog | null>(null)
  const [showConversationDetail, setShowConversationDetail] = useState(false)
  const [conversationsWithAnalysis, setConversationsWithAnalysis] = useState<ConversationLog[]>([])
  const [hasAnalysisData, setHasAnalysisData] = useState(false)

  const { data: agents } = useAgents(selectedTeam?.id)
  const { data: conversationLogs } = useConversationLogs(selectedTeam?.id, filters, agents || [])

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
    <div className="flex flex-col h-full">
      <div className="flex-1 p-8 pt-6">
        <div className="mb-6">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-3">
            <HighlightText text="Bot Logs" className="text-4xl font-bold" />
          </h1>
          <p className="text-lg text-gray-600 font-medium leading-relaxed">
            Monitor and analyze agent execution logs and conversation flows.
          </p>
        </div>

        <LogsTabs activeTab={activeTab} onTabChange={setActiveTab} />

        <LogsFilters
          filters={filters}
          onFilterChange={setFilters}
          agents={agents || []}
          hasActiveFilters={ConversationFilterService.hasActiveFilters(filters)}
          onClearFilters={() => setFilters(ConversationFilterService.getDefaultFilters())}
        />

        {activeTab === 'execution' ? (
          <ExecutionLogsTable 
            filters={ConversationFilterService.buildSupabaseFilters(filters)} 
            onExport={handleExportExecution}
          />
        ) : (
          <>
            {!filters.selectedAgent || filters.selectedAgent === 'all' ? (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
                <div className="max-w-md mx-auto">
                  <div className="text-blue-600 mb-4">
                    <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-blue-900 mb-2">Select an Agent</h3>
                  <p className="text-blue-700">
                    Please select a specific agent from the filters above to view conversation logs and analysis tools.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <ConversationAnalysisManager
                  conversations={conversationLogs || []}
                  onAnalysisComplete={handleAnalysisComplete}
                />
                <ConversationLogsTable
                  data={displayConversations}
                  onViewConversation={handleViewConversation}
                  onExport={handleExportConversations}
                />
              </div>
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