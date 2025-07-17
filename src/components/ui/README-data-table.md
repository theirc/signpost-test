# Enhanced Data Table Component

A comprehensive data table component built with TanStack Table and ShadCN UI, featuring advanced functionality including sorting, filtering, pagination, column visibility controls, and row selection.

## Features

- ✅ **Sorting**: Click column headers to sort data
- ✅ **Filtering**: Search functionality with customizable search keys
- ✅ **Pagination**: Built-in pagination with configurable page sizes
- ✅ **Column Visibility**: Toggle columns on/off via dropdown menu
- ✅ **Row Selection**: Checkbox selection for bulk operations (always enabled)
- ✅ **Row Click**: Optional click handlers for row interactions
- ✅ **Responsive**: Works on all screen sizes
- ✅ **Accessible**: Full keyboard navigation and screen reader support

## Usage

```tsx
import { EnhancedDataTable } from "@/components/ui/enhanced-data-table"
import { ColumnDef } from "@tanstack/react-table"

// Define your data type
interface User {
  id: string
  name: string
  email: string
  role: string
}

// Define columns
const columns: ColumnDef<User>[] =  [object Object]    accessorKey: name,    header:Name",
  },
  [object Object]    accessorKey: "email", 
    header: Email",
  },
  [object Object]    accessorKey: role",
    header: Role",
  },
]

// Use the component
function UserList()[object Object]
  const users = [/* your data */]
  
  return (
    <EnhancedDataTable
      columns={columns}
      data={users}
      searchKey="name"
      searchPlaceholder=Search users..."
      showPagination={true}
      showColumnToggle={true}
      pageSize={10}
      onRowClick={(user) => console.log("Clicked:,user)}
    />
  )
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `columns` | `ColumnDef<TData, TValue>[]` | Required | Column definitions |
| `data` | `TData[]` | Required | Data to display |
| `searchKey` | `string` | Optional | Column key to search by |
| `searchPlaceholder` | `string` | "Search..." | Placeholder for search input |
| `showColumnToggle` | `boolean` | `true` | Show column visibility toggle |
| `showPagination` | `boolean` | `true` | Show pagination controls |
| `onRowClick` | `(row: TData) => void` | Optional | Row click handler |
| `pageSize` | `number` | `10` | Number of rows per page |
| `className` | `string` | Optional | Additional CSS classes |
| `placeholder` | `string` | "No results." | Text shown when no data |

**Note**: Row selection checkboxes are always enabled and appear as the leftmost column.

## Advanced Column Configuration

### Sortable Headers
```tsx
[object Object]accessorKey:name",
  header: ({ column }) => (
    <Button
      variant="ghost"
      onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      className="h-auto p0font-semibold
    >
      Name
      <ArrowUpDown className=ml-2h-4 w-4 />
    </Button>
  ),
}
```

### Custom Cell Rendering
```tsx
{
  accessorKey: status",
  header:Status",
  cell: ({ row }) => [object Object]    const status = row.getValue("status") as string
    return (
      <Badge variant={status === "active" ? "default : condary"}>
        {status}
      </Badge>
    )
  },
}
```

### Action Columns
```tsx
{
  id: "actions",
  header: Actions",
  cell: ({ row }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost className="h-8 w-8 p-0>   <MoreHorizontal className="h-4w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem>Edit</DropdownMenuItem>
        <DropdownMenuItem>Delete</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ),
}
```

## Integration with Existing Code

The component is designed to be a drop-in replacement for the existing `CustomTable` component. Simply replace:

```tsx
// Old
import CustomTable from @/components/ui/custom-table
// New  
import { EnhancedDataTable } from "@/components/ui/enhanced-data-table"
```

And update the props accordingly. The new component provides all the same functionality plus additional features.

## Dependencies

- `@tanstack/react-table` - Core table functionality
- `lucide-react` - Icons
- ShadCN UI components (Button, Input, Checkbox, etc.)

## Browser Support

- Modern browsers with ES6+ support
- React 18+
- TypeScript 4.5+ 