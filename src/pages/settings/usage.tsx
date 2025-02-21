import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export function UsageSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Usage</h3>
        <p className="text-sm text-muted-foreground">
          Monitor your organization's AI usage and limits
        </p>
      </div>

      <div className="grid gap-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Metric</TableHead>
              <TableHead>Usage</TableHead>
              <TableHead>Limit</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium">Total Tokens</TableCell>
              <TableCell>1.2M</TableCell>
              <TableCell>2M</TableCell>
              <TableCell>
                <span className="text-green-600">60% used</span>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">API Calls</TableCell>
              <TableCell>8,432</TableCell>
              <TableCell>20,000</TableCell>
              <TableCell>
                <span className="text-green-600">40% used</span>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Storage</TableCell>
              <TableCell>2.1 GB</TableCell>
              <TableCell>10 GB</TableCell>
              <TableCell>
                <span className="text-green-600">21% used</span>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>

        <div className="mt-8">
          <h4 className="text-sm font-medium mb-4">Usage History</h4>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Tokens Used</TableHead>
                <TableHead>API Calls</TableHead>
                <TableHead>Storage Change</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>Mar 15, 2024</TableCell>
                <TableCell>125K</TableCell>
                <TableCell>842</TableCell>
                <TableCell>+120MB</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Mar 14, 2024</TableCell>
                <TableCell>98K</TableCell>
                <TableCell>731</TableCell>
                <TableCell>+85MB</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Mar 13, 2024</TableCell>
                <TableCell>156K</TableCell>
                <TableCell>912</TableCell>
                <TableCell>+250MB</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
} 