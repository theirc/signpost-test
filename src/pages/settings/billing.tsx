import { Button } from "@/components/ui/button"
import { EnhancedDataTable } from "@/components/ui/enhanced-data-table"
import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { usePermissions } from "@/lib/hooks/usePermissions"

export function BillingSettings() {
  const { canUpdate } = usePermissions()
  const mockBillingData = [
    {
      id: "1",
      date: "2024-01-01",
      amount: "$499.00",
      status: "Paid",
      invoice: "INV-2024-001"
    },
    {
      id: "2",
      date: "2023-12-01",
      amount: "$499.00",
      status: "Paid",
      invoice: "INV-2023-012"
    },
    {
      id: "3",
      date: "2023-11-01",
      amount: "$499.00",
      status: "Paid",
      invoice: "INV-2023-011"
    }
  ]

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => format(new Date(row.original.date), "PPP")
    },
    {
      accessorKey: "amount",
      header: "Amount"
    },
    {
      accessorKey: "status",
      header: "Status"
    },
    {
      accessorKey: "invoice",
      header: "Invoice"
    }
  ]

  return (
    <div>
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Billing & Subscription</h3>
          <p className="text-sm text-muted-foreground">
            Manage your billing information and subscription plan
          </p>
        </div>
        {canUpdate("billing") && (
          <Button>Update Payment Method</Button>
        )}
      </div>

      <div className="rounded-lg border p-4 mb-6">
        <h4 className="text-sm font-medium mb-4">Current Plan</h4>
        <div className="flex justify-between items-center">
          <div>
            <p className="font-medium">Enterprise Plan</p>
            <p className="text-sm text-muted-foreground">$499/month</p>
          </div>
          {canUpdate("billing") && (
            <Button variant="outline">Change Plan</Button>
          )}
        </div>
      </div>
      <h4 className="text-sm font-medium mb-4">Billing History</h4>
      <EnhancedDataTable columns={columns as any} data={mockBillingData} placeholder="No billing history found" />
    </div>
  )
} 