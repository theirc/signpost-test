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
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Trash2 } from "lucide-react"
import { useState, useEffect } from "react"
import { supabase } from "@/lib/data/supabaseFunctions"
import { useTeamStore } from "@/lib/hooks/useTeam"
import { useToast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface SourceDisplay {
  id: string
  name: string
  type: string
  lastUpdated: string
  tags: string[]
}

interface SourcesTableProps {
  onRowClick: (row: SourceDisplay) => void
}

export function SourcesTable({ onRowClick }: SourcesTableProps) {
  const [allData, setAllData] = useState<SourceDisplay[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [search, setSearch] = useState("")
  const [sortBy, setSortBy] = useState<"name" | "lastUpdated">("lastUpdated")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")
  const [sourceToDelete, setSourceToDelete] = useState<SourceDisplay | null>(null)
  const [deleting, setDeleting] = useState(false)
  const { toast } = useToast()
  const itemsPerPage = 10

  const fetchSources = async () => {
    try {
      setLoading(true)
      const selectedTeam = useTeamStore.getState().selectedTeam
      if (!selectedTeam) {
        throw new Error('No team selected')
      }

      const { data: sources, error } = await supabase
        .from('sources')
        .select('id, name, type, created_at, last_updated, tags')
        .eq('team_id', selectedTeam.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      const transformedData = sources.map(source => ({
        id: source.id,
        name: source.name,
        type: source.type,
        lastUpdated: source.last_updated || source.created_at,
        tags: typeof source.tags === 'string' 
          ? source.tags.replace('{', '').replace('}', '').split(',').filter(tag => tag.length > 0)
          : source.tags || []
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
  }, [])

  const handleDelete = async () => {
    if (!sourceToDelete) return

    try {
      setDeleting(true)
      const { error } = await supabase
        .from('sources')
        .delete()
        .eq('id', sourceToDelete.id)

      if (error) throw error

      toast({
        title: "Success",
        description: "Source deleted successfully"
      })

      // Refresh the sources list
      await fetchSources()
    } catch (error) {
      console.error('Error deleting source:', error)
      toast({
        title: "Error",
        description: "Failed to delete source",
        variant: "destructive"
      })
    } finally {
      setDeleting(false)
      setSourceToDelete(null)
    }
  }

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
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center">
                Loading...
              </TableCell>
            </TableRow>
          ) : paginatedData.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center">
                No sources found
              </TableCell>
            </TableRow>
          ) : (
            paginatedData.map((row) => (
              <TableRow key={row.id}>
                <TableCell 
                  className="cursor-pointer"
                  onClick={() => onRowClick(row)}
                >
                  {row.name}
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

      <AlertDialog open={!!sourceToDelete} onOpenChange={() => setSourceToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the source "{sourceToDelete?.name}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-500 hover:bg-red-600"
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
} 