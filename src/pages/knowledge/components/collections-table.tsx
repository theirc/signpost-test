import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Pencil, Trash, Database, Download } from "lucide-react"
import { useMemo } from "react"
import { CollectionWithSourceCount } from "../types"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { calculateVectorPercentage } from "../utils"
import { EnhancedDataTable } from "@/components/ui/enhanced-data-table"
import { ColumnDef } from "@tanstack/react-table"
import PaginatedSupabaseTableWrapper from "@/components/ui/PaginatedSupabaseTableWrapper"
import { useTeamStore } from "@/lib/hooks/useTeam"

interface CollectionsTableProps {
  onEdit: (collection: CollectionWithSourceCount) => void
  onDelete: (collection: CollectionWithSourceCount) => void
  onGenerateVector: (collection: CollectionWithSourceCount) => void
  onDownload: (collection: CollectionWithSourceCount) => void
  loading?: boolean
}

export function CollectionsTable({
  onEdit,
  onDelete,
  onGenerateVector,
  onDownload,
  loading = false
}: CollectionsTableProps) {
  const { selectedTeam } = useTeamStore()
  const columns = useMemo<ColumnDef<CollectionWithSourceCount>[]>(() => [
    {
      accessorKey: "name",
      header: "Name",
      cell: info => info.getValue(),
      enableSorting: true,
    },
    {
      accessorKey: "created_at",
      header: "Created",
      cell: info => format(new Date(info.getValue() as string), "MMM dd, yyyy"),
      enableSorting: true,
    },
    {
      accessorKey: "sourceCount",
      header: "Sources",
      cell: info => info.getValue(),
      enableSorting: true,
    },
    {
      id: "vectorStatus",
      header: "Vector Status",
      enableSorting: true,
      accessorFn: row => row.sourceCount > 0 ? row.vectorizedCount / row.sourceCount : 0,
      cell: ({ row }) => {
        const vectorizedCount = typeof row.original.vectorizedCount === 'number' && !isNaN(row.original.vectorizedCount) ? row.original.vectorizedCount : 0
        const sourceCount = typeof row.original.sourceCount === 'number' && !isNaN(row.original.sourceCount) ? row.original.sourceCount : 0
        const vectorPercentage = calculateVectorPercentage(vectorizedCount, sourceCount)
        return (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span>
                {vectorizedCount} / {sourceCount} sources
              </span>
              <span>{vectorPercentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
              <div 
                className="bg-blue-600 h-2.5 rounded-full" 
                style={{ width: `${vectorPercentage}%` }}
              ></div>
            </div>
          </div>
        )
      },
      sortingFn: (a, b) => {
        const aPercent = a.original.sourceCount > 0 ? (a.original.vectorizedCount / a.original.sourceCount) : 0
        const bPercent = b.original.sourceCount > 0 ? (b.original.vectorizedCount / b.original.sourceCount) : 0
        return aPercent - bPercent
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(row.original)}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onDownload(row.original)}
              disabled={row.original.sourceCount === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Download Sources
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete(row.original)}>
              <Trash className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onGenerateVector(row.original)}
              disabled={row.original.sourceCount === 0}
            >
              <Database className="h-4 w-4 mr-2" />
              Generate Vectors
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      enableSorting: false,
    },
  ], [onEdit, onDelete, onGenerateVector, onDownload])

  return (
    <PaginatedSupabaseTableWrapper
      table="collections_with_counts"
      columns={columns}
      tableComponent={EnhancedDataTable}
      filters={{ team_id: selectedTeam?.id }}
      searchKey="name"
      placeholder={loading ? "Loading..." : "No collections found"}
      searchPlaceholder="Search collections..."
    />
  )
}
