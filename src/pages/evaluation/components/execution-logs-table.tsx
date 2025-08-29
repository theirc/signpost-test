import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Download } from "lucide-react"
import { format } from "date-fns"
import { ExecutionLog } from "../types"
import PaginatedSupabaseTableWrapper from "@/components/ui/PaginatedSupabaseTableWrapper"
import { EnhancedDataTable } from "@/components/ui/enhanced-data-table"

export function ExecutionLogsTable({ filters, onExport }: { filters: any; onExport: () => void }) {
  const columns: ColumnDef<ExecutionLog>[] = [
    {
      id: "created_at",
      accessorKey: "created_at",
      header: "Created At",
      cell: (info) => format(new Date(info.getValue() as string), "MMM dd, yyyy HH:mm:ss"),
      enableResizing: true,
      enableHiding: true,
    },
    { 
      id: "id", 
      accessorKey: "id", 
      header: "ID",
      enableResizing: true, 
      enableHiding: true
    },
    {
      id: "agent",
      accessorKey: "agent",
      header: "Agent",
      enableResizing: true,
      enableHiding: true,
    },
    {
      id: "worker",
      accessorKey: "worker",
      header: "Worker",
      cell: ({ row }) => (
        <Badge variant={row.original.worker === 'request' ? 'default' : 'secondary'}>
          {row.original.worker}
        </Badge>
      ),
      enableResizing: true,
      enableHiding: true,
    },
    {
      id: "message",
      accessorKey: "message",
      header: "Message",
      cell: ({ row }) => (
        <div className="max-w-md truncate" title={row.original.message || ''}>
          {row.original.message || 'No message'}
        </div>
      ),
      enableResizing: true,
      enableHiding: true,
    },
  ]

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg border">
          <h3 className="text-lg font-semibold text-gray-900">Execution Logs</h3>
          <Button variant="default" size="sm" onClick={onExport} className="bg-blue-600 hover:bg-blue-700">
            <Download className="h-4 w-4 mr-2" />
            Export Logs
          </Button>
        </div>
        <PaginatedSupabaseTableWrapper
          table="logs"
          columns={columns}
          tableComponent={EnhancedDataTable}
          filters={filters}
          searchKey="message"
          onRowClick={(row) => {}}
          placeholder="No logs found"
          searchPlaceholder="Search logs..."
        />
      </div>
    </div>
  )
}