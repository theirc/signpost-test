import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { usePermissions } from "@/lib/hooks/usePermissions"
import { useTeamStore } from "@/lib/hooks/useTeam"
import { format } from "date-fns"
import { EnhancedDataTable } from "@/components/ui/enhanced-data-table"
import { supabase } from "@/lib/agents/db"
import { useQuery } from "@tanstack/react-query"
import { HighlightText } from "@/components/ui/shadcn-io/highlight-text"
import { Badge } from "@/components/ui/badge"
import { ArrowUpDown, Download, Filter, X } from "lucide-react"
import PaginatedSupabaseTableWrapper from "@/components/ui/PaginatedSupabaseTableWrapper"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"

type ExecutionLog = {
  id: string
  agent: string
  worker: string
  workerId: string
  execution: string
  session: string
  type: string
  message: string
  parameters: any
  state: any
  handles: any[]
  inputTokens: number
  outputTokens: number
  created_at: string
  team_id: string
  uid: string
}

export function BotLogsTable() {
  const navigate = useNavigate()
  const { canRead } = usePermissions()
  const { selectedTeam } = useTeamStore()
  
  // Filter states
  const [selectedAgent, setSelectedAgent] = useState<string>('all')
  const [selectedWorker, setSelectedWorker] = useState<string>('all')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [dateRange, setDateRange] = useState<{ from: string; to: string }>({ from: '', to: '' })

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

  // Build filters object
  const buildFilters = () => {
    const filters: any = { team_id: selectedTeam?.id }
    
    if (selectedAgent && selectedAgent !== 'all') filters.agent = selectedAgent
    if (selectedWorker && selectedWorker !== 'all') filters.worker = selectedWorker
    if (selectedType && selectedType !== 'all') filters.type = selectedType
    
    return filters
  }

  // Clear all filters
  const clearFilters = () => {
    setSelectedAgent('all')
    setSelectedWorker('all')
    setSelectedType('all')
    setSearchQuery('')
    setDateRange({ from: '', to: '' })
  }

  // Check if any filters are active
  const hasActiveFilters = (selectedAgent && selectedAgent !== 'all') || (selectedWorker && selectedWorker !== 'all') || (selectedType && selectedType !== 'all') || searchQuery || dateRange.from || dateRange.to

  const exportToCSV = async () => {
    try {
      // Build query with current filters
      let query = supabase
        .from('logs')
        .select('*')
        .eq('team_id', selectedTeam?.id)
        .order('created_at', { ascending: false })

      if (selectedAgent && selectedAgent !== 'all') query = query.eq('agent', selectedAgent)
      if (selectedWorker && selectedWorker !== 'all') query = query.eq('worker', selectedWorker)
      if (selectedType && selectedType !== 'all') query = query.eq('type', selectedType)
      if (searchQuery) query = query.or(`message.ilike.%${searchQuery}%,agent.ilike.%${searchQuery}%,worker.ilike.%${searchQuery}%`)
      if (dateRange.from) query = query.gte('created_at', dateRange.from)
      if (dateRange.to) query = query.lte('created_at', dateRange.to)

      const { data: logs, error } = await query

      if (error) throw error

      if (!logs || logs.length === 0) {
        alert('No logs to export')
        return
      }

      // Helper function to safely escape CSV values
      const escapeCSV = (value: any): string => {
        if (value === null || value === undefined) return ''
        if (typeof value === 'object') {
          try {
            // Convert objects to readable JSON strings
            const jsonStr = JSON.stringify(value, null, 2)
            // Replace newlines and quotes for CSV compatibility
            return jsonStr.replace(/\n/g, ' ').replace(/"/g, '""').replace(/\r/g, ' ')
          } catch {
            return String(value).replace(/"/g, '""')
          }
        }
        return String(value).replace(/"/g, '""')
      }

      // Define CSV headers
      const headers = [
        'ID',
        'Agent',
        'Worker',
        'Worker ID',
        'Execution',
        'Session',
        'Type',
        'Message',
        'Parameters',
        'State',
        'Handles',
        'UID',
        'Input Tokens',
        'Output Tokens',
        'Created At',
        'Team ID'
      ]

      // Convert data to CSV format with proper escaping
      const csvContent = [
        headers.join(','),
        ...logs.map((log: any) => [
          escapeCSV(log.id),
          escapeCSV(log.agent),
          escapeCSV(log.worker),
          escapeCSV(log.workerId),
          escapeCSV(log.execution),
          escapeCSV(log.session),
          escapeCSV(log.type),
          escapeCSV(log.message),
          escapeCSV(log.parameters),
          escapeCSV(log.state),
          escapeCSV(log.handles),
          escapeCSV(log.uid),
          escapeCSV(log.inputTokens),
          escapeCSV(log.outputTokens),
          escapeCSV(log.created_at),
          escapeCSV(log.team_id)
        ].map(field => `"${field}"`).join(','))
      ].join('\n')

      // Create and download CSV file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `logs_export_${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error('Error exporting logs:', error)
      alert('Failed to export logs. Please try again.')
    }
  }

  const columns: ColumnDef<ExecutionLog>[] = [
    { 
      id: "id", 
      accessorKey: "id", 
      header: ({ column, table }) => (
        <Button
          variant="ghost"
          onClick={() => {
            const current = column.getIsSorted();
            let next: 'asc' | 'desc';
            if (current === 'asc') next = 'desc';
            else next = 'asc';
            const meta = table.options.meta as any;
            if (meta?.onSort) meta.onSort('id', next);
          }}
          className="h-auto p-0 font-semibold"
        >
          ID
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      enableResizing: true, 
      enableHiding: true, 
      enableSorting: true 
    },
    {
      id: "agent",
      accessorKey: "agent",
      header: ({ column, table }) => (
        <Button
          variant="ghost"
          onClick={() => {
            const current = column.getIsSorted();
            let next: 'asc' | 'desc';
            if (current === 'asc') next = 'desc';
            else next = 'asc';
            const meta = table.options.meta as any;
            if (meta?.onSort) meta.onSort('agent', next);
          }}
          className="h-auto p-0 font-semibold"
        >
          Agent
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      enableResizing: true,
      enableHiding: true,
      enableSorting: true,
    },
    {
      id: "worker",
      accessorKey: "worker",
      header: ({ column, table }) => (
        <Button
          variant="ghost"
          onClick={() => {
            const current = column.getIsSorted();
            let next: 'asc' | 'desc';
            if (current === 'asc') next = 'desc';
            else next = 'asc';
            const meta = table.options.meta as any;
            if (meta?.onSort) meta.onSort('worker', next);
          }}
          className="h-auto p-0 font-semibold"
        >
          Worker
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <Badge variant={row.original.worker === 'request' ? 'default' : 'secondary'}>
          {row.original.worker}
        </Badge>
      ),
      enableResizing: true,
      enableHiding: true,
      enableSorting: true,
    },
    {
      id: "workerId",
      accessorKey: "workerId",
      header: ({ column, table }) => (
        <Button
          variant="ghost"
          onClick={() => {
            const current = column.getIsSorted();
            let next: 'asc' | 'desc';
            if (current === 'asc') next = 'desc';
            else next = 'asc';
            const meta = table.options.meta as any;
            if (meta?.onSort) meta.onSort('workerId', next);
          }}
          className="h-auto p-0 font-semibold"
        >
          Worker ID
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="font-mono text-sm">{row.original.workerId || 'N/A'}</div>
      ),
      enableResizing: true,
      enableHiding: true,
      enableSorting: true,
    },
    {
      id: "execution",
      accessorKey: "execution",
      header: ({ column, table }) => (
        <Button
          variant="ghost"
          onClick={() => {
            const current = column.getIsSorted();
            let next: 'asc' | 'desc';
            if (current === 'asc') next = 'desc';
            else next = 'asc';
            const meta = table.options.meta as any;
            if (meta?.onSort) meta.onSort('execution', next);
          }}
          className="h-auto p-0 font-semibold"
        >
          Execution
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="font-mono text-sm">{row.original.execution || 'N/A'}</div>
      ),
      enableResizing: true,
      enableHiding: true,
      enableSorting: true,
    },
    {
      id: "session",
      accessorKey: "session",
      header: ({ column, table }) => (
        <Button
          variant="ghost"
          onClick={() => {
            const current = column.getIsSorted();
            let next: 'asc' | 'desc';
            if (current === 'asc') next = 'desc';
            else next = 'asc';
            const meta = table.options.meta as any;
            if (meta?.onSort) meta.onSort('session', next);
          }}
          className="h-auto p-0 font-semibold"
        >
          Session
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="font-mono text-sm">{row.original.session || 'N/A'}</div>
      ),
      enableResizing: true,
      enableHiding: true,
      enableSorting: true,
    },
    {
      id: "type",
      accessorKey: "type",
      header: ({ column, table }) => (
        <Button
          variant="ghost"
          onClick={() => {
            const current = column.getIsSorted();
            let next: 'asc' | 'desc';
            if (current === 'asc') next = 'desc';
            else next = 'asc';
            const meta = table.options.meta as any;
            if (meta?.onSort) meta.onSort('type', next);
          }}
          className="h-auto p-0 font-semibold"
        >
          Type
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => row.original.type || 'N/A',
      enableResizing: true,
      enableHiding: true,
      enableSorting: true,
    },
    {
      id: "message",
      accessorKey: "message",
      header: ({ column, table }) => (
        <Button
          variant="ghost"
          onClick={() => {
            const current = column.getIsSorted();
            let next: 'asc' | 'desc';
            if (current === 'asc') next = 'desc';
            else next = 'asc';
            const meta = table.options.meta as any;
            if (meta?.onSort) meta.onSort('message', next);
          }}
          className="h-auto p-0 font-semibold"
        >
          Message
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="max-w-md truncate" title={row.original.message || ''}>
          {row.original.message || 'No message'}
        </div>
      ),
      enableResizing: true,
      enableHiding: true,
      enableSorting: true,
    },
    {
      id: "parameters",
      header: "Parameters",
      cell: ({ row }) => {
        if (!row.original.parameters) return <span className="text-gray-400">No parameters</span>
        const paramStr = JSON.stringify(row.original.parameters)
        return (
          <div className="max-w-md truncate" title={paramStr}>
            <div className="text-xs font-mono bg-gray-50 p-1 rounded">
              {paramStr.length > 100 ? `${paramStr.substring(0, 100)}...` : paramStr}
            </div>
          </div>
        )
      },
      enableResizing: true,
      enableHiding: true,
    },
    {
      id: "state",
      header: "State",
      cell: ({ row }) => {
        if (!row.original.state) return <span className="text-gray-400">No state</span>
        const stateStr = JSON.stringify(row.original.state)
        return (
          <div className="max-w-md truncate" title={stateStr}>
            <div className="text-xs font-mono bg-gray-50 p-1 rounded">
              {stateStr.length > 100 ? `${stateStr.substring(0, 100)}...` : stateStr}
            </div>
          </div>
        )
      },
      enableResizing: true,
      enableHiding: true,
    },
    {
      id: "handles",
      header: "Handles",
      cell: ({ row }) => {
        if (!row.original.handles || row.original.handles.length === 0) {
          return <span className="text-gray-400">No handles</span>
        }
        const handleStr = JSON.stringify(row.original.handles)
        return (
          <div className="max-w-md truncate" title={handleStr}>
            <div className="text-xs font-mono bg-gray-50 p-1 rounded">
              {handleStr.length > 100 ? `${handleStr.substring(0, 100)}...` : handleStr}
            </div>
          </div>
        )
      },
      enableResizing: true,
      enableHiding: true,
    },
    {
      id: "uid",
      accessorKey: "uid",
      header: ({ column, table }) => (
        <Button
          variant="ghost"
          onClick={() => {
            const current = column.getIsSorted();
            let next: 'asc' | 'desc';
            if (current === 'asc') next = 'desc';
            else next = 'asc';
            const meta = table.options.meta as any;
            if (meta?.onSort) meta.onSort('uid', next);
          }}
          className="h-auto p-0 font-semibold"
        >
          UID
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="font-mono text-sm">{row.original.uid || 'N/A'}</div>
      ),
      enableResizing: true,
      enableHiding: true,
      enableSorting: true,
    },
    {
      id: "tokens",
      header: "Tokens",
      cell: ({ row }) => (
        <div className="text-sm text-gray-600">
          {row.original.inputTokens ? `In: ${row.original.inputTokens}` : ''}
          {row.original.outputTokens ? ` Out: ${row.original.outputTokens}` : ''}
        </div>
      ),
      enableResizing: true,
      enableHiding: true,
    },
    {
      id: "created_at",
      accessorKey: "created_at",
      header: ({ column, table }) => (
        <Button
          variant="ghost"
          onClick={() => {
            const current = column.getIsSorted();
            let next: 'asc' | 'desc';
            if (current === 'asc') next = 'desc';
            else next = 'asc';
            const meta = table.options.meta as any;
            if (meta?.onSort) meta.onSort('created_at', next);
          }}
          className="h-auto p-0 font-semibold"
        >
          Created At
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: (info) => format(new Date(info.getValue() as string), "MMM dd, yyyy HH:mm:ss"),
      enableResizing: true,
      enableHiding: true,
      enableSorting: true,
    },
  ]

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-3">
              <HighlightText text="Execution Logs" className="text-4xl font-bold" />
            </h1>
            <p className="text-lg text-gray-600 font-medium leading-relaxed">
              Monitor and analyze agent execution logs and worker performance.
            </p>
          </div>
          <Button variant="outline" className="rounded-lg" onClick={exportToCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export Logs
          </Button>
        </div>

        {/* Filters Section */}
        <div className="bg-white border border-gray-200 p-4 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-4 w-4 text-gray-600" />
            <h3 className="font-medium text-gray-900">Filters</h3>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="ml-auto text-gray-500 hover:text-gray-700"
              >
                <X className="h-3 w-3 mr-1" />
                Clear All
              </Button>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Agent Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Agent</label>
              <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All agents" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All agents</SelectItem>
                  {agents?.map((agent) => (
                    <SelectItem key={agent.id} value={agent.id.toString()}>
                      {agent.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Worker Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Worker</label>
              <Select value={selectedWorker} onValueChange={setSelectedWorker}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All workers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All workers</SelectItem>
                  {workers?.map((worker) => (
                    <SelectItem key={worker} value={worker}>
                      {worker}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  {types?.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Search Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <Input
                placeholder="Search in message, agent, worker..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
          </div>

          {/* Date Range Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
              <Input
                type="date"
                value={dateRange.from}
                onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
              <Input
                type="date"
                value={dateRange.to}
                onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                className="w-full"
              />
            </div>
          </div>
        </div>

        <PaginatedSupabaseTableWrapper
          table="logs"
          columns={columns}
          tableComponent={EnhancedDataTable}
          filters={buildFilters()}
          searchKey="message"
          onRowClick={(row) => console.log('Log clicked:', row)}
          placeholder="No logs found"
          searchPlaceholder="Search logs..."
        />
      </div>
    </div>
  )
} 