import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Trash2, Edit2, Save, X, Check, MoreHorizontal } from "lucide-react"
import { useState, useEffect, useMemo } from "react"
import { useTeamStore } from "@/lib/hooks/useTeam"
import { DeleteSourceDialog } from "./delete-source-dialog"
import { SourceDisplay } from "./types"
import { supabase } from "@/lib/agents/db"
import { EnhancedDataTable } from "@/components/ui/enhanced-data-table"
import { ColumnDef } from "@tanstack/react-table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface SourcesTableProps {
  onRowClick: (row: SourceDisplay) => void
  refreshTrigger?: number
}

export function SourcesTable({ onRowClick, refreshTrigger }: SourcesTableProps) {
  const [allData, setAllData] = useState<SourceDisplay[]>([])
  const [loading, setLoading] = useState(true)
  const [editingSourceId, setEditingSourceId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState("")
  const [saving, setSaving] = useState(false)
  const [sourceToDelete, setSourceToDelete] = useState<SourceDisplay | null>(null)
  const { selectedTeam } = useTeamStore()

  const fetchSources = async () => {
    try {
      setLoading(true)
      if (!selectedTeam) {
        throw new Error('No team selected')
      }

      const { data: sources, error } = await supabase
        .from('sources')
        .select('id, name, type, created_at, last_updated, tags, vector')
        .eq('team_id', selectedTeam.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      const transformedData = sources.map(source => ({
        id: source.id,
        content: undefined,
        name: source.name,
        type: source.type,
        lastUpdated: source.last_updated || source.created_at,
        tags: typeof source.tags === 'string' 
          ? (source.tags as string).replace('{', '').replace('}', '').split(',').filter(tag => tag.length > 0)
          : source.tags || [],
        vector: source.vector !== null && source.vector !== undefined
      }))

      setAllData(transformedData)
    } catch (error) {
      console.error('Error fetching sources:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSources()
  }, [selectedTeam])

  useEffect(() => {
    if (refreshTrigger) {
      fetchSources()
    }
  }, [refreshTrigger])

  const handleSaveName = async () => {
    if (!editingSourceId || !editingName.trim()) return

    try {
      setSaving(true)
      const { error } = await supabase
        .from('sources')
        .update({ name: editingName.trim() })
        .eq('id', editingSourceId)

      if (error) throw error

      setAllData(prev => prev.map(source => 
        source.id === editingSourceId 
          ? { ...source, name: editingName.trim() }
          : source
      ))

      setEditingSourceId(null)
      setEditingName("")
    } catch (error) {
      console.error('Error updating source name:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleCancelEdit = () => {
    setEditingSourceId(null)
    setEditingName("")
  }

  const startEditing = (source: SourceDisplay) => {
    setEditingSourceId(source.id)
    setEditingName(source.name)
  }

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
                  if (e.key === 'Enter') handleSaveName()
                  if (e.key === 'Escape') handleCancelEdit()
                }}
                className="h-8"
                autoFocus
              />
              <Button size="icon" variant="ghost" onClick={handleSaveName} disabled={saving}>
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
      accessorKey: "lastUpdated",
      header: "Last Updated",
      enableSorting: true,
      cell: info => format(new Date(info.getValue() as string), "MMM dd, yyyy"),
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

  return (
    <>
      <EnhancedDataTable
        columns={columns}
        data={allData}
        searchKey="name"
        searchPlaceholder="Search by name..."
        showPagination={true}
        showColumnToggle={true}
        pageSize={10}
        placeholder={loading ? "Loading..." : "No sources found"}
      />
      <DeleteSourceDialog
        source={sourceToDelete}
        onClose={() => setSourceToDelete(null)}
        onSourceDeleted={fetchSources}
      />
    </>
  )
} 