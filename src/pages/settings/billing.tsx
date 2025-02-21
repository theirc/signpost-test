import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export function BillingSettings() {
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Invoice</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>Mar 1, 2024</TableCell>
                <TableCell>Enterprise Plan - Monthly</TableCell>
                <TableCell>$499.00</TableCell>
                <TableCell>
                  <span className="text-green-600">Paid</span>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm">Download</Button>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Feb 1, 2024</TableCell>
                <TableCell>Enterprise Plan - Monthly</TableCell>
                <TableCell>$499.00</TableCell>
                <TableCell>
                  <span className="text-green-600">Paid</span>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm">Download</Button>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Jan 1, 2024</TableCell>
                <TableCell>Enterprise Plan - Monthly</TableCell>
                <TableCell>$499.00</TableCell>
                <TableCell>
                  <span className="text-green-600">Paid</span>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm">Download</Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
} 