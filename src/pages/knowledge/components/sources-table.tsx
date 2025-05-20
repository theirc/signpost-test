import { format } from "date-fns"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { CheckedState } from "@radix-ui/react-checkbox"
import { SourceDisplay } from "../types"
import { useState, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

interface SourcesTableProps {
  sources: SourceDisplay[]
  selectedSources: string[]
  onSourceSelect: (id: string) => void
  onSelectAll: () => void
  loading?: boolean
}

export function SourcesTable({
  sources,
  selectedSources,
  onSourceSelect,
  onSelectAll,
  loading = false
}: SourcesTableProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [search, setSearch] = useState("")
  const itemsPerPage = 10

  // Filter sources based on search query
  const filteredSources = useMemo(() => {
    if (!search) {
      return sources
    }
    const lowerCaseQuery = search.toLowerCase()
    return sources.filter(source =>
      source.name.toLowerCase().includes(lowerCaseQuery) ||
      (source.content && source.content.toLowerCase().includes(lowerCaseQuery))
    )
  }, [sources, search])

  // Pagination
  const totalCount = filteredSources.length
  const totalPages = Math.ceil(totalCount / itemsPerPage)
  const paginatedSources = filteredSources.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  // Check if all filtered sources on the current page are selected
  const isAllSelected = paginatedSources.length > 0 && 
    paginatedSources.every(source => selectedSources.includes(source.id))
  
  // Check if some filtered sources on the current page are selected
  const isSomeSelected = paginatedSources.length > 0 && 
    paginatedSources.some(source => selectedSources.includes(source.id)) && 
    !isAllSelected

  // Determine the checked state for the header checkbox
  const headerCheckedState: CheckedState = isAllSelected 
    ? true 
    : isSomeSelected 
      ? "indeterminate" 
      : false

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex items-center mb-2">
        <Input
          type="text"
          placeholder="Search by name or content..."
          value={search}
          onChange={e => {
            setSearch(e.target.value)
            setCurrentPage(1) // Reset to first page when searching
          }}
          className="w-full max-w-sm"
        />
      </div>
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">
              <Checkbox
                checked={headerCheckedState}
                onCheckedChange={onSelectAll}
                aria-label="Select all"
              />
            </TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Last Updated</TableHead>
            <TableHead>Tags</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center">
                Loading...
              </TableCell>
            </TableRow>
          ) : paginatedSources.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center">
                No sources found
              </TableCell>
            </TableRow>
          ) : (
            paginatedSources.map((source) => (
              <TableRow key={source.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedSources.includes(source.id)}
                    onCheckedChange={() => onSourceSelect(source.id)}
                    aria-label={`Select ${source.name}`}
                  />
                </TableCell>
                <TableCell>{source.name}</TableCell>
                <TableCell>{source.type}</TableCell>
                <TableCell>
                  {format(new Date(source.lastUpdated), "MMM dd, yyyy")}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {source.tags.map(tag => {
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
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Pagination */}
      {totalPages > 1 && (
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
      )}
    </div>
  )
}
