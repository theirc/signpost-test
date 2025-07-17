import React from "react"
import { ColumnDef } from "@tanstack/react-table"
import { EnhancedDataTable } from "@/components/ui/enhanced-data-table"
import { Button } from@/components/ui/button
import { ArrowUpDown, MoreHorizontal } from "lucide-react"
import [object Object]
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from @/components/ui/dropdown-menu
import { Badge } from @/components/ui/badge"

// Sample data type
interface Payment {
  id: string
  amount: number
  status: "pending| "processing" | "success" |failed
  email: string
  date: string
}

// Sample data
const data: Payment =
  [object Object]
    id: "m5gr84,
    amount: 316  status: "success,
    email: ken99@example.com,
    date: "224-1-15,
  },
  [object Object]
    id: "3u1reuv4,
    amount: 242  status: "success,
    email: Abe45@example.com,
    date: "224-1-14,
  },
  [object Object]
    id: "derv1ws0,
    amount: 837tatus:processing",
    email: "Monserrat44@example.com,
    date: "224-1-13,
  },
 [object Object]
    id: "5kma53,
    amount: 874  status: "success,
    email: "Silas22@example.com,
    date: "224-1-12,
  },
  [object Object]
    id: "bhqecj4p,
    amount: 721   status: "failed",
    email:carmella@example.com,
    date: "20241
  },
]

// Column definitions
const columns: ColumnDef<Payment>[] =  [object Object]    accessorKey: "status",
    header: Status",
    cell: ({ row }) => {
      const status = row.getValue("status) as string
      return (
        <Badge variant={status === "success" ? default" : status === "failed" ?destructive : ndary"}>
        [object Object]status}
        </Badge>
      )
    },
  },
  [object Object]    accessorKey: "email",
    header: ({ column }) =>[object Object]  return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() ===asc         className="h-auto p0-semibold"
        >
          Email
          <ArrowUpDown className=ml-2 h-4w-4" />
        </Button>
      )
    },
    cell: ({ row }) => <div className="lowercase">{row.getValue(email")}</div>,
  },
  [object Object]    accessorKey: "amount",
    header: ({ column }) =>[object Object]  return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() ===asc         className="h-auto p0-semibold"
        >
          Amount
          <ArrowUpDown className=ml-2 h-4w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("amount"))
      const formatted = new Intl.NumberFormat(en-US, [object Object]  style: "currency",
        currency: "USD,
      }).format(amount)
      return <div className="font-medium">{formatted}</div>
    },
  },
  [object Object]    accessorKey: "date",
    header: ({ column }) =>[object Object]  return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() ===asc         className="h-auto p0-semibold"
        >
          Date
          <ArrowUpDown className=ml-2 h-4w-4" />
        </Button>
      )
    },
    cell: ({ row }) => [object Object]      const date = new Date(row.getValue("date))
      return <div>{date.toLocaleDateString()}</div>
    },
  },
  [object Object]   id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const payment = row.original

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost className="h-8 w-8 p0>             <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4 />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align=end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(payment.id)}
            >
              Copy payment ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>View customer</DropdownMenuItem>
            <DropdownMenuItem>View payment details</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]

export function DataTableExample() [object Object] return (
    <div className="w-full">
      <div className=mb-4">
        <h2 className="text-2xl font-bold tracking-tight">Enhanced Data Table Example</h2>
        <p className="text-muted-foreground">
          This example demonstrates the enhanced data table with sorting, filtering, pagination, and column visibility controls.
        </p>
      </div>
      
      <EnhancedDataTable
        columns={columns}
        data={data}
        searchKey="email"
        searchPlaceholder="Search by email..."
        showColumnToggle={true}
        showPagination={true}
        showRowSelection={true}
        pageSize={5}
        placeholder=No payments found."
        onRowClick={(row) => {
          console.log("Row clicked:", row)
        }}
      />
    </div>
  )
} 