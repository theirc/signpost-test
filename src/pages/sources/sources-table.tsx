import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Trash2, Edit2, Save, X, Check, MoreHorizontal } from "lucide-react"
import { useState, useMemo } from "react"
import { useTeamStore } from "@/lib/hooks/useTeam"
import { DeleteSourceDialog } from "./delete-source-dialog"
import { SourceDisplay } from "./types"
import { EnhancedDataTable } from "@/components/ui/enhanced-data-table"
import { ColumnDef } from "@tanstack/react-table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import PaginatedSupabaseTableWrapper from "@/components/ui/PaginatedSupabaseTableWrapper"
import { supabase } from "@/lib/agents/db"
import { useQueryClient } from '@tanstack/react-query'

interface SourcesTableProps {
  onRowClick: (row: SourceDisplay) => void
  refreshTrigger?: number
}

export function SourcesTable({ onRowClick, refreshTrigger }: SourcesTableProps) {
  const [editingSourceId, setEditingSourceId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState("")
  const [saving, setSaving] = useState(false)
  const [sourceToDelete, setSourceToDelete] = useState<SourceDisplay | null>(null)
  const { selectedTeam } = useTeamStore()
  const queryClient = useQueryClient()

  const columns = useMemo<ColumnDef<SourceDisplay>[]>(() => [
    {
      accessorKey: "name",
      header: "Name",
      enableSorting: true,
      cell: ({ row }) => {
        if (editingSourceId === row.original.id) {
          return (
            <div className="flex items-center gap-2">
              <Input
                value={editingName}
                onChange={e => setEditingName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleSaveName(row.original)
                  if (e.key === 'Escape') handleCancelEdit()
                }}
                className="h-8"
                autoFocus
              />
              <Button size="icon" variant="ghost" onClick={() => handleSaveName(row.original)} disabled={saving}>
                <Check className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" onClick={handleCancelEdit}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          )
        }
        return (
          <div className="flex items-center gap-2">
            <span
              className="cursor-pointer underline decoration-dotted"
              onClick={() => onRowClick(row.original)}
            >
              {row.original.name}
            </span>
            <Button size="icon" variant="ghost" onClick={() => startEditing(row.original)}>
              <Edit2 className="h-4 w-4" />
            </Button>
          </div>
        )
      },
    },
    {
      accessorKey: "type",
      header: "Type",
      enableSorting: true,
      cell: info => info.getValue(),
    },
    {
      accessorKey: "last_updated",
      header: "Last Updated",
      enableSorting: true,
      cell: info => {
        const value = info.getValue() as string;
        const date = value ? new Date(value) : null;
        return date && !isNaN(date.getTime())
          ? format(date, "MMM dd, yyyy")
          : "-";
      },
    },
    {
      accessorKey: "tags",
      header: "Tags",
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          {row.original.tags.map((tag: string) => {
            let tagStyle = "bg-muted"
            if (tag === 'File Upload') {
              tagStyle = "bg-blue-100 text-blue-800"
            } else if (tag === 'Live Data') {
              tagStyle = "bg-purple-100 text-purple-800"
            }
            return (
              <span
                key={tag}
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${tagStyle}`}
              >
                {tag}
              </span>
            )
          })}
        </div>
      ),
    },
    {
      accessorKey: "vector",
      header: "Vector",
      enableSorting: false,
      cell: ({ row }) => (
        row.original.vector ? (
          <span className="text-green-600 font-semibold">Yes</span>
        ) : (
          <span className="text-gray-400">No</span>
        )
      ),
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
            <DropdownMenuItem onClick={() => onRowClick(row.original)}>
              View
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSourceToDelete(row.original)}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      enableSorting: false,
    },
  ], [editingSourceId, editingName, saving, onRowClick])

  function startEditing(source: SourceDisplay) {
    setEditingSourceId(source.id)
    setEditingName(source.name)
  }
  function handleCancelEdit() {
    setEditingSourceId(null)
    setEditingName("")
  }
  async function handleSaveName(source: SourceDisplay) {
    if (!editingName.trim()) return
    setSaving(true)
    try {
      await supabase.from('sources').update({ name: editingName.trim() }).eq('id', source.id)
      queryClient.invalidateQueries({
        queryKey: ['supabase-table', 'sources'],
        exact: false
      })
      setEditingSourceId(null)
      setEditingName("")
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <PaginatedSupabaseTableWrapper
        table="sources"
        columns={columns}
        tableComponent={EnhancedDataTable}
        filters={{ team_id: selectedTeam?.id }}
        searchKey="name"
        searchPlaceholder="Search by name..."
      />
      <DeleteSourceDialog
        source={sourceToDelete}
        onClose={() => setSourceToDelete(null)}
        onSourceDeleted={() => {
          queryClient.invalidateQueries({
            queryKey: ['supabase-table', 'sources'],
            exact: false
          })
        }}
      />
    </>
  )
} 