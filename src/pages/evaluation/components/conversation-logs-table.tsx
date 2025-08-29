import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Eye, Download } from "lucide-react"
import { format } from "date-fns"
import { ConversationLog } from "../types"
import { EnhancedDataTable } from "@/components/ui/enhanced-data-table"

interface ConversationLogsTableProps {
  data: ConversationLog[]
  onViewConversation: (conversation: ConversationLog) => void
  onExport: () => void
}

export function ConversationLogsTable({ data, onViewConversation, onExport }: ConversationLogsTableProps) {
  const columns: ColumnDef<ConversationLog>[] = [
    {
      id: "startedAt",
      accessorKey: "startedAt",
      header: "Started At",
      cell: ({ row }) => format(new Date(row.original.startedAt), "MMM dd, yyyy HH:mm:ss"),
      enableResizing: true,
      enableHiding: true,
    },
    {
      id: "lastActivity",
      accessorKey: "lastActivity",
      header: "Last Activity",
      cell: ({ row }) => format(new Date(row.original.lastActivity), "MMM dd, yyyy HH:mm:ss"),
      enableResizing: true,
      enableHiding: true,
    },
    {
      id: "uid",
      accessorKey: "uid",
      header: "UID",
      cell: ({ row }) => (
        <div className="font-mono text-sm">{row.original.uid}</div>
      ),
      enableResizing: true,
      enableHiding: true,
    },
    {
      id: "agent",
      accessorKey: "agentTitle",
      header: "Agent",
      cell: ({ row }) => (
        <div className="font-medium">{row.original.agentTitle}</div>
      ),
      enableResizing: true,
      enableHiding: true,
    },
    {
      id: "totalSteps",
      accessorKey: "totalSteps",
      header: "Total Steps",
      cell: ({ row }) => (
        <div className="text-sm">{row.original.totalSteps}</div>
      ),
      enableResizing: true,
      enableHiding: true,
    },
    {
      id: "conversationSummary",
      header: "Conversation Summary",
      cell: ({ row }) => (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 max-w-xs mt-2 mb-2">
          <div className="text-xs font-medium text-blue-900 mb-2">Conversation Summary</div>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 text-xs"
            onClick={() => onViewConversation(row.original)}
          >
            <Eye className="h-3 w-3 mr-1" />
            View
          </Button>
        </div>
      ),
      enableResizing: true,
      enableHiding: true,
      enableSorting: false,
    },
  ]

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg border">
          <h3 className="text-lg font-semibold text-gray-900">Conversation Logs</h3>
          <Button variant="default" size="sm" onClick={onExport} className="bg-blue-600 hover:bg-blue-700">
            <Download className="h-4 w-4 mr-2" />
            Export Logs
          </Button>
        </div>
        <EnhancedDataTable
          data={data}
          columns={columns}
          placeholder="No conversations found"
        />
      </div>
    </div>
  )
}