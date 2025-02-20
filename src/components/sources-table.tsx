import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowUpDown, Plus, Search, Tag, X } from "lucide-react"
import { useState, useMemo } from "react"
import { Input } from "@/components/ui/input"

export type Source = {
  id: string
  name: string
  type: string
  lastUpdated: string
  content: string
  tags: string[]
}

interface SourcesTableProps {
  sources: Source[]
  selectedSources?: string[]
  onToggleSelect?: (id: string) => void
  onSelectAll?: (event: React.ChangeEvent<HTMLInputElement>) => void
  onPreview?: (source: Source) => void
  onDelete?: (id: string) => void
  onAddNew?: () => void
  onConnectLiveData?: () => void
  showCheckboxes?: boolean
  showActions?: boolean
  showAddButton?: boolean
}

export function SourcesTable({
  sources,
  selectedSources = [],
  onToggleSelect,
  onSelectAll,
  onPreview,
  onDelete,
  onAddNew,
  onConnectLiveData,
  showCheckboxes = false,
  showActions = false,
  showAddButton = false
}: SourcesTableProps) {
  const [sortConfig, setSortConfig] = useState<{key: string, direction: 'asc' | 'desc'}>({
    key: 'lastUpdated',
    direction: 'desc'
  })
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("")
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  // Get unique types for filter dropdown
  const uniqueTypes = useMemo(() => {
    return Array.from(new Set(sources.map(source => source.type)))
  }, [sources])

  // Get unique tags for filter
  const uniqueTags = useMemo(() => {
    const tagSet = new Set<string>()
    sources.forEach(source => {
      source.tags?.forEach(tag => tagSet.add(tag))
    })
    return Array.from(tagSet)
  }, [sources])

  // Toggle tag selection
  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
  }

  const handleSort = (key: string) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  // Filter and sort sources
  const filteredAndSortedSources = useMemo(() => {
    return [...sources]
      .filter(source => {
        const matchesSearch = searchTerm === "" || 
          source.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          source.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
          source.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
          source.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
        
        const matchesType = typeFilter === "" || source.type === typeFilter
        
        const matchesTags = selectedTags.length === 0 || 
          selectedTags.every(tag => source.tags?.includes(tag))
        
        return matchesSearch && matchesType && matchesTags
      })
      .sort((a, b) => {
        const aValue = a[sortConfig.key]
        const bValue = b[sortConfig.key]
        
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1
        return 0
      })
  }, [sources, searchTerm, typeFilter, selectedTags, sortConfig])

  return (
    <div className="space-y-4">
      {/* Search and Filter Controls */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search sources..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 rounded-md border"
          >
            <option value="">All Types</option>
            {uniqueTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          {showAddButton && (
            <div className="flex gap-2">
              {onAddNew && (
                <Button 
                  onClick={onAddNew}
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Files
                </Button>
              )}
              {onConnectLiveData && (
                <Button 
                  variant="outline"
                  onClick={onConnectLiveData}
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Connect Live Data
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Tags Filter */}
        {uniqueTags.length > 0 && (
          <div className="flex flex-wrap gap-2 items-center">
            <Tag className="h-4 w-4 text-muted-foreground" />
            {uniqueTags.map(tag => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-sm transition-colors ${
                  selectedTags.includes(tag)
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80'
                }`}
              >
                {tag}
                {selectedTags.includes(tag) && (
                  <X className="h-3 w-3" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              {showCheckboxes && (
                <TableHead className="w-12">
                  <input
                    type="checkbox"
                    checked={selectedSources.length === filteredAndSortedSources.length}
                    onChange={onSelectAll}
                    className="rounded border-gray-300"
                  />
                </TableHead>
              )}
              <TableHead 
                className="cursor-pointer hover:bg-muted"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center gap-2">
                  Name
                  <ArrowUpDown className="h-4 w-4" />
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted"
                onClick={() => handleSort('type')}
              >
                <div className="flex items-center gap-2">
                  Type
                  <ArrowUpDown className="h-4 w-4" />
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted"
                onClick={() => handleSort('lastUpdated')}
              >
                <div className="flex items-center gap-2">
                  Last Updated
                  <ArrowUpDown className="h-4 w-4" />
                </div>
              </TableHead>
              <TableHead>Tags</TableHead>
              {(onPreview || showActions) && <TableHead>Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedSources.map((source) => (
              <TableRow key={source.id}>
                {showCheckboxes && (
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selectedSources.includes(source.id)}
                      onChange={() => onToggleSelect?.(source.id)}
                      className="rounded border-gray-300"
                    />
                  </TableCell>
                )}
                <TableCell>{source.name}</TableCell>
                <TableCell>{source.type}</TableCell>
                <TableCell>{source.lastUpdated}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {(source.tags || []).map(tag => {
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
                {(onPreview || showActions) && (
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {onPreview && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => onPreview(source)}
                        >
                          View Content
                        </Button>
                      )}
                      {onDelete && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => onDelete(source.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-100"
                        >
                          Delete
                        </Button>
                      )}
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
} 