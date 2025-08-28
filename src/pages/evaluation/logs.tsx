import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import { usePermissions } from "@/lib/hooks/usePermissions"
import { useTeamStore } from "@/lib/hooks/useTeam"
import { useQuery } from "@tanstack/react-query"
import { HighlightText } from "@/components/ui/shadcn-io/highlight-text"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/agents/db"

// Import new components
import { LogsTabs } from "./components/logs-tabs"
import { LogsFilters } from "./components/logs-filters"
import { ExecutionLogsTable } from "./components/execution-logs-table"
import { ConversationLogsTable } from "./components/conversation-logs-table"
import { ConversationDetailDialog } from "./components/conversation-detail-dialog"

// Import types and utils
import { ConversationLog, LogFilters } from "./types"
import { buildFilters, hasActiveFilters, clearFilters, exportToCSV, exportConversationsToCSV } from "./utils"

export function BotLogsTable() {
  const navigate = useNavigate()
  const { canRead } = usePermissions()
  const { selectedTeam } = useTeamStore()
  
  // Tab state
  const [activeTab, setActiveTab] = useState<'execution' | 'conversation'>('execution')
  
  // Filter states
  const [filters, setFilters] = useState<LogFilters>({
    selectedAgent: 'all',
    selectedWorker: 'all',
    selectedType: 'all',
    searchQuery: '',
    dateRange: { from: '', to: '' }
  })

  // Conversation detail dialog state
  const [selectedConversation, setSelectedConversation] = useState<ConversationLog | null>(null)
  const [showConversationDetail, setShowConversationDetail] = useState(false)

  // Fetch agents for filtering
  const { data: agents } = useQuery({
    queryKey: ['agents', selectedTeam?.id],
    queryFn: async () => {
      if (!selectedTeam?.id) return []
      const { data, error } = await supabase
        .from('agents')
        .select('id, title')
        .eq('team_id', selectedTeam.id)
        .order('title')
      
      if (error) throw error
      return data || []
    },
    enabled: !!selectedTeam?.id
  })

  // Fetch unique workers for filtering
  const { data: workers } = useQuery({
    queryKey: ['workers', selectedTeam?.id],
    queryFn: async () => {
      if (!selectedTeam?.id) return []
      const { data, error } = await supabase
        .from('logs')
        .select('worker')
        .eq('team_id', selectedTeam.id)
        .not('worker', 'is', null)
      
      if (error) throw error
      const uniqueWorkers = [...new Set(data?.map(log => log.worker).filter(Boolean))]
      return uniqueWorkers.sort()
    },
    enabled: !!selectedTeam?.id
  })

  // Fetch unique types for filtering
  const { data: types } = useQuery({
    queryKey: ['types', selectedTeam?.id],
    queryFn: async () => {
      if (!selectedTeam?.id) return []
      const { data, error } = await supabase
        .from('logs')
        .select('type')
        .eq('team_id', selectedTeam.id)
        .not('type', 'is', null)
      
      if (error) throw error
      const uniqueTypes = [...new Set(data?.map(log => log.type).filter(Boolean))]
      return uniqueTypes.sort()
    },
    enabled: !!selectedTeam?.id
  })

  // Fetch conversation logs
  const { data: conversationLogs } = useQuery({
    queryKey: ['conversationLogs', selectedTeam?.id, filters.selectedAgent],
    queryFn: async () => {
      if (!selectedTeam?.id) return []
      
      // Only get logs for response and request workers
      const conversationWorkers = ['response', 'request']
      
      let query = supabase
        .from('logs')
        .select('*')
        .eq('team_id', selectedTeam.id)
        .in('worker', conversationWorkers)
        .order('created_at', { ascending: true })

      if (filters.selectedAgent && filters.selectedAgent !== 'all') {
        query = query.eq('agent', filters.selectedAgent)
      }

      const { data: logs, error } = await query
      if (error) throw error

      // Group logs by UID and agent
      const conversations: { [key: string]: ConversationLog } = {}
      
      logs?.forEach((log: any) => {
        const key = `${log.uid || 'no-uid'}_${log.agent}`
        
        if (!conversations[key]) {
          const agentTitle = agents?.find((a: any) => a.id === log.agent)?.title || log.agent
          conversations[key] = {
            uid: log.uid || 'no-uid',
            agent: log.agent,
            agentTitle,
            conversationSteps: [],
            totalSteps: 0,
            startedAt: log.created_at,
            lastActivity: log.created_at
          }
        }
        
        // Convert handles from object to array format for easier processing
        let processedHandles: any[] = []
        if (log.handles && typeof log.handles === 'object') {
          if (Array.isArray(log.handles)) {
            processedHandles = log.handles
          } else {
            // Convert object format {handleId: handleData} to array format
            processedHandles = Object.values(log.handles).map((handle: any) => ({
              id: handle.id || 'unknown',
              name: handle.name || 'unknown',
              type: handle.type || 'unknown',
              value: handle.value || null,
              direction: handle.direction || 'unknown'
            }))
          }
        }
        
        conversations[key].conversationSteps.push({
          id: log.id,
          worker: log.worker,
          message: log.message || '',
          created_at: log.created_at,
          handles: processedHandles,
          parameters: log.parameters || {},
          state: log.state || {}
        })
        
        conversations[key].totalSteps = conversations[key].conversationSteps.length
        conversations[key].lastActivity = log.created_at
      })

      return Object.values(conversations)
    },
    enabled: !!selectedTeam?.id
  })

  const handleViewConversation = (conversation: ConversationLog) => {
    setSelectedConversation(conversation)
    setShowConversationDetail(true)
  }



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

        {/* Tabs */}
        <LogsTabs activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Filters Section */}
        <LogsFilters
          filters={filters}
          onFilterChange={setFilters}
          agents={agents || []}
          workers={workers || []}
          types={types || []}
          hasActiveFilters={hasActiveFilters(filters)}
          onClearFilters={() => clearFilters(setFilters)}
        />

        {/* Content based on active tab */}
        {activeTab === 'execution' ? (
          <ExecutionLogsTable 
            filters={buildFilters(filters)} 
            onExport={() => exportToCSV(selectedTeam?.id || '')}
          />
        ) : (
          <ConversationLogsTable
            data={conversationLogs || []}
            onViewConversation={handleViewConversation}
            onExport={() => exportConversationsToCSV(conversationLogs || [])}
          />
        )}
      </div>

      {/* Conversation Detail Dialog */}
      <ConversationDetailDialog
        conversation={selectedConversation}
        open={showConversationDetail}
        onOpenChange={setShowConversationDetail}
      />
    </div>
  )
} 