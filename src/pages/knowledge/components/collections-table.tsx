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
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown, 
  ChevronUp, 
  MoreHorizontal, 
  Pencil, 
  Trash, 
  Database,
  Download
} from "lucide-react"
import { useState, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { CollectionWithSourceCount } from "../types"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { calculateVectorPercentage } from "../utils"

interface CollectionsTableProps {
  collections: CollectionWithSourceCount[]
  onEdit: (collection: CollectionWithSourceCount) => void
  onDelete: (collection: CollectionWithSourceCount) => void
  onGenerateVector: (collection: CollectionWithSourceCount) => void
  onDownload: (collection: CollectionWithSourceCount) => void
  loading?: boolean
}

export function CollectionsTable({
  collections,
  onEdit,
  onDelete,
  onGenerateVector,
  onDownload,
  loading = false
}: CollectionsTableProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [search, setSearch] = useState("")
  const [sortBy, setSortBy] = useState<"name" | "created_at" | "vectorStatus">("created_at")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")
  const itemsPerPage = 10

  // Filter collections based on search query
  const filteredCollections = useMemo(() => {
    if (!search) {
      return collections
    }
    const lowerCaseQuery = search.toLowerCase()
    return collections.filter(collection =>
      collection.name.toLowerCase().includes(lowerCaseQuery)
    )
  }, [collections, search])

  // Sorting
  const sortedCollections = useMemo(() => {
    return [...filteredCollections].sort((a, b) => {
      if (sortBy === "name") {
        if (a.name.toLowerCase() < b.name.toLowerCase()) return sortDir === "asc" ? -1 : 1
        if (a.name.toLowerCase() > b.name.toLowerCase()) return sortDir === "asc" ? 1 : -1
        return 0
      } else if (sortBy === "vectorStatus") {
        const aPercent = a.sourceCount > 0 ? (a.vectorizedCount / a.sourceCount) : 0
        const bPercent = b.sourceCount > 0 ? (b.vectorizedCount / b.sourceCount) : 0
        return sortDir === "asc" ? aPercent - bPercent : bPercent - aPercent
      } else {
        // created_at
        const aDate = new Date(a.created_at).getTime()
        const bDate = new Date(b.created_at).getTime()
        return sortDir === "asc" ? aDate - bDate : bDate - aDate
      }
    })
  }, [filteredCollections, sortBy, sortDir])

  // Pagination
  const totalCount = sortedCollections.length
  const totalPages = Math.ceil(totalCount / itemsPerPage)
  const paginatedCollections = sortedCollections.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  // Toggle sort direction or change sort column
  const toggleSort = (column: "name" | "created_at" | "vectorStatus") => {
    if (sortBy === column) {
      setSortDir(sortDir === "asc" ? "desc" : "asc")
    } else {
      setSortBy(column)
      setSortDir(column === "created_at" ? "desc" : "asc")
    }
  }

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex items-center mb-2">
        <Input
          type="text"
          placeholder="Search collections..."
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
            <TableHead
              className="cursor-pointer select-none"
              onClick={() => toggleSort("name")}
            >
              Name
              {sortBy === "name" && (
                sortDir === "asc" ? <ChevronUp className="inline ml-1 h-3 w-3" /> : <ChevronDown className="inline ml-1 h-3 w-3" />
              )}
            </TableHead>
            <TableHead
              className="cursor-pointer select-none"
              onClick={() => toggleSort("created_at")}
            >
              Created
              {sortBy === "created_at" && (
                sortDir === "asc" ? <ChevronUp className="inline ml-1 h-3 w-3" /> : <ChevronDown className="inline ml-1 h-3 w-3" />
              )}
            </TableHead>
            <TableHead>Sources</TableHead>
            <TableHead
              className="cursor-pointer select-none"
              onClick={() => toggleSort("vectorStatus")}
            >
              Vector Status
              {sortBy === "vectorStatus" && (
                sortDir === "asc" ? <ChevronUp className="inline ml-1 h-3 w-3" /> : <ChevronDown className="inline ml-1 h-3 w-3" />
              )}
            </TableHead>
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
          ) : paginatedCollections.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center">
                No collections found
              </TableCell>
            </TableRow>
          ) : (
            paginatedCollections.map((collection) => {
              const vectorPercentage = calculateVectorPercentage(
                collection.vectorizedCount, 
                collection.sourceCount
              )
              
              return (
                <TableRow key={collection.id}>
                  <TableCell>{collection.name}</TableCell>
                  <TableCell>
                    {format(new Date(collection.created_at), "MMM dd, yyyy")}
                  </TableCell>
                  <TableCell>{collection.sourceCount}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span>
                          {collection.vectorizedCount} / {collection.sourceCount} sources
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
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(collection)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => onDownload(collection)}
                          disabled={collection.sourceCount === 0}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download Sources
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onDelete(collection)}>
                          <Trash className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => onGenerateVector(collection)}
                          disabled={collection.sourceCount === 0}
                        >
                          <Database className="h-4 w-4 mr-2" />
                          Generate Vectors
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )
            })
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
