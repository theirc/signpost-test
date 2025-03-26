import { Button } from "@/components/ui/button"
import CustomTable from "@/components/ui/custom-table"
import { ColumnDef } from "@tanstack/react-table"

export function BillingSettings() {
  const mockBillingData = [
    {
      id: "1",
      date: "Mar 1, 2024",
      description: "Enterprise Plan - Monthly",
      amount: "$499.00",
      status: "paid"
    },
    {
      id: "2",
      date: "Feb 1, 2024",
      description: "Enterprise Plan - Monthly",
      amount: "$499.00",
      status: "paid"
    },
    {
      id: "3",
      date: "Jan 1, 2024",
      description: "Enterprise Plan - Monthly",
      amount: "$499.00",
      status: "paid"
    }
  ]

  const columns: ColumnDef<any>[] = [
    { id: "date", accessorKey: "date", header: "Date", enableResizing: true, enableHiding: true, enableSorting: false, cell: (info) => info.getValue() },
    { id: "description", enableResizing: true, enableHiding: true, accessorKey: "description", header: "Description", enableSorting: false, cell: (info) => info.getValue() },
    { id: "amount", enableResizing: true, enableHiding: true, accessorKey: "amount", header: "Amount", enableSorting: false, cell: (info) => info.getValue() },
    {
      id: "status", enableResizing: true, enableHiding: true, accessorKey: "status", header: "Status", enableSorting: false, cell: ({ row }) => (
        <span className={`capitalize ${row.original.status === 'paid' ? 'text-green-600' : 'text-gray-500'}`}>
          {row.original.status}
        </span>
      )
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Billing & Subscription</h3>
          <p className="text-sm text-muted-foreground">
            Manage your billing information and subscription plan
          </p>
        </div>
        <Button>Update Payment Method</Button>
      </div>

      <div className="grid gap-6">
        <div className="rounded-lg border p-4">
          <h4 className="text-sm font-medium mb-4">Current Plan</h4>
          <div className="flex justify-between items-center">
            <div>
              <p className="font-medium">Enterprise Plan</p>
              <p className="text-sm text-muted-foreground">$499/month</p>
            </div>
            <Button variant="outline">Change Plan</Button>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium mb-4">Billing History</h4>
          <CustomTable tableId="billing-history-table" columns={columns as any} data={mockBillingData} placeholder="No billing history found" />
        </div>
      </div>
    </div>
  )
} 