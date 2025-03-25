import CustomTable from "@/components/ui/custom-table"
import { ColumnDef } from "@tanstack/react-table"

export function UsageSettings() {
  const mockUsageData = [
    {
      id: "1",
      metric: "Total Tokens",
      usage: "1.2M",
      limit: "2M",
      status: "60% used"
    },
    {
      id: "2",
      metric: "API Calls",
      usage: "8,432",
      limit: "20,000",
      status: "40% used"
    },
    {
      id: "3",
      metric: "Storage",
      usage: "2.1 GB",
      limit: "10 GB",
      status: "21% used"
    }
  ]

  const mockHistoryData = [
    {
      id: "1",
      date: "Mar 15, 2024",
      tokensUsed: "125K",
      apiCalls: "842",
      storageChange: "+120MB"
    },
    {
      id: "2",
      date: "Mar 14, 2024",
      tokensUsed: "98K",
      apiCalls: "731",
      storageChange: "+85MB"
    },
    {
      id: "3",
      date: "Mar 13, 2024",
      tokensUsed: "156K",
      apiCalls: "912",
      storageChange: "+250MB"
    }
  ]

  const columnsUsage: ColumnDef<any>[] = [
    { id: "metric", accessorKey: "metric", header: "Metric", enableResizing: true, enableHiding: true, enableSorting: false, cell: (info) => info.getValue() },
    { id: "usage", enableResizing: true, enableHiding: true, accessorKey: "usage", header: "Usage", enableSorting: false, cell: (info) => info.getValue() },
    { id: "limit", enableResizing: true, enableHiding: true, accessorKey: "limit", header: "Limit", enableSorting: false, cell: (info) => info.getValue() },
    {
      id: "status", enableResizing: true, enableHiding: true, accessorKey: "status", header: "Status", enableSorting: false, cell: ({ row }) => (
        <span className='text-green-600'>
          {row.original.status}
        </span>
      )
    },
  ]

  const columnsHistory: ColumnDef<any>[] = [
    { id: "date", accessorKey: "date", header: "Date", enableResizing: true, enableHiding: true, enableSorting: false, cell: (info) => info.getValue() },
    { id: "tokensUsed", enableResizing: true, enableHiding: true, accessorKey: "tokensUsed", header: "Tokens Used", enableSorting: false, cell: (info) => info.getValue() },
    { id: "apiCalls", enableResizing: true, enableHiding: true, accessorKey: "apiCalls", header: "API Calls", enableSorting: false, cell: (info) => info.getValue() },
    { id: "storageChange", enableResizing: true, enableHiding: true, accessorKey: "storageChange", header: "Storage Change", enableSorting: false, cell: (info) => info.getValue() },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Usage</h3>
        <p className="text-sm text-muted-foreground">
          Monitor your organization's AI usage and limits
        </p>
      </div>

      <div className="grid gap-4">
        <CustomTable tableId="usage-table" columns={columnsUsage as any} data={mockUsageData} placeholder="No usage data found" />

        <div className="mt-8">
          <h4 className="text-sm font-medium mb-4">Usage History</h4>
          <CustomTable tableId="usage-history-table" columns={columnsHistory as any} data={mockHistoryData} placeholder="No usage history found" />
        </div>
      </div>
    </div>
  )
} 