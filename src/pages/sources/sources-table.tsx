import { format } from "date-fns"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Trash2, Edit2, Save, X, Check } from "lucide-react"
import { useState, useEffect } from "react"
import { useTeamStore } from "@/lib/hooks/useTeam"
import { DeleteSourceDialog } from "./delete-source-dialog"
import { SourceDisplay } from "./types"
import { supabase } from "@/lib/agents/db"

interface SourcesTableProps {
  onRowClick: (row: SourceDisplay) => void
  refreshTrigger?: number
}

export function SourcesTable({ onRowClick, refreshTrigger }: SourcesTableProps) {
  const [allData, setAllData] = useState<SourceDisplay[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [search, setSearch] = useState("")
  const [sortBy, setSortBy] = useState<"name" | "lastUpdated">("lastUpdated")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")
  const [sourceToDelete, setSourceToDelete] = useState<SourceDisplay | null>(null)
  const { selectedTeam } = useTeamStore()
  const itemsPerPage = 10

  // Editing states
  const [editingSourceId, setEditingSourceId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState("")
  const [saving, setSaving] = useState(false)

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

  // Refresh when refreshTrigger changes
  useEffect(() => {
    if (refreshTrigger) {
      fetchSources()
    }
  }, [refreshTrigger])

  // Filtering
  const filteredData = allData.filter(row =>
    row.name.toLowerCase().includes(search.toLowerCase())
  )

  // Sorting
  const sortedData = [...filteredData].sort((a, b) => {
    if (sortBy === "name") {
      if (a.name.toLowerCase() < b.name.toLowerCase()) return sortDir === "asc" ? -1 : 1
      if (a.name.toLowerCase() > b.name.toLowerCase()) return sortDir === "asc" ? 1 : -1
      return 0
    } else {
      // lastUpdated
      const aDate = new Date(a.lastUpdated).getTime()
      const bDate = new Date(b.lastUpdated).getTime()
      return sortDir === "asc" ? aDate - bDate : bDate - aDate
    }
  })

  // Pagination
  const totalCount = sortedData.length
  const totalPages = Math.ceil(totalCount / itemsPerPage)
  const paginatedData = sortedData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const handleSaveName = async () => {
    if (!editingSourceId || !editingName.trim()) return

    try {
      setSaving(true)
      const { error } = await supabase
        .from('sources')
        .update({ name: editingName.trim() })
        .eq('id', editingSourceId)

      if (error) throw error

      // Update local state
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

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSaveName()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      handleCancelEdit()
    }
  }

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex items-center mb-2">
        <input
          type="text"
          placeholder="Search by name..."
          value={search}
          onChange={e => {
            setSearch(e.target.value)
            setCurrentPage(1) // Reset to first page when searching
          }}
          className="border rounded px-3 py-2 w-64 text-sm"
        />
      </div>
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead
              className="cursor-pointer select-none"
              onClick={() => {
                if (sortBy === "name") {
                  setSortDir(sortDir === "asc" ? "desc" : "asc")
                } else {
                  setSortBy("name"); setSortDir("asc")
                }
              }}
            >
              Name
              {sortBy === "name" && (
                sortDir === "asc" ? <ChevronUp className="inline ml-1 h-3 w-3" /> : <ChevronDown className="inline ml-1 h-3 w-3" />
              )}
            </TableHead>
            <TableHead>Type</TableHead>
            <TableHead
              className="cursor-pointer select-none"
              onClick={() => {
                if (sortBy === "lastUpdated") {
                  setSortDir(sortDir === "asc" ? "desc" : "asc")
                } else {
                  setSortBy("lastUpdated"); setSortDir("desc")
                }
              }}
            >
              Last Updated
              {sortBy === "lastUpdated" && (
                sortDir === "asc" ? <ChevronUp className="inline ml-1 h-3 w-3" /> : <ChevronDown className="inline ml-1 h-3 w-3" />
              )}
            </TableHead>
            <TableHead>Tags</TableHead>
            <TableHead>Vector</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center">
                Loading...
              </TableCell>
            </TableRow>
          ) : paginatedData.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center">
                No sources found
              </TableCell>
            </TableRow>
          ) : (
            paginatedData.map((row) => (
              <TableRow key={row.id} className="group">
                <TableCell 
                  className="cursor-pointer"
                  onClick={() => onRowClick(row)}
                >
                  {editingSourceId === row.id ? (
                    <div className="flex items-center gap-2">
                      <Input
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="flex-1"
                        disabled={saving}
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={handleNameKeyDown}
                        autoFocus
                      />
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleSaveName()
                        }}
                        disabled={saving}
                        className="h-6 w-6 p-0"
                      >
                        {saving ? "..." : <Save className="h-3 w-3" />}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleCancelEdit()
                        }}
                        disabled={saving}
                        className="h-6 w-6 p-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="flex-1">{row.name}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation()
                          startEditing(row)
                        }}
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </TableCell>
                <TableCell 
                  className="cursor-pointer"
                  onClick={() => onRowClick(row)}
                >
                  {row.type}
                </TableCell>
                <TableCell 
                  className="cursor-pointer"
                  onClick={() => onRowClick(row)}
                >
                  {format(new Date(row.lastUpdated), "MMM dd, yyyy")}
                </TableCell>
                <TableCell 
                  className="cursor-pointer"
                  onClick={() => onRowClick(row)}
                >
                  <div className="flex flex-wrap gap-1">
                    {row.tags.map(tag => {
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
                </TableCell>
                <TableCell 
                  className="cursor-pointer"
                  onClick={() => onRowClick(row)}
                >
                  {row.vector ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <X className="h-4 w-4 text-red-500" />
                  )}
                </TableCell>
                <TableCell>
                  <span
                    className="cursor-pointer text-red-500 hover:text-red-600"
                    onClick={(e) => {
                      e.stopPropagation()
                      setSourceToDelete(row)
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </span>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <div className="flex items-center justify-between px-2">
        <div className="text-sm text-muted-foreground">
          Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} results
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1 || loading}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-sm font-medium">
            Page {currentPage} of {totalPages}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages || loading}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <DeleteSourceDialog
        source={sourceToDelete}
        onClose={() => setSourceToDelete(null)}
        onSourceDeleted={fetchSources}
      />
    </div>
  )
} 