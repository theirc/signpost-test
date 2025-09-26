import { Filter, X, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LogFilters } from "@/pages/evaluation/types"
import { useState } from "react"

interface LogsFiltersProps {
  filters: LogFilters
  onFilterChange: (filters: LogFilters) => void
  agents: any[]
  hasActiveFilters: boolean
  onClearFilters: () => void
}

export function LogsFilters({ 
  filters, 
  onFilterChange, 
  agents, 
  hasActiveFilters, 
  onClearFilters 
}: LogsFiltersProps) {
  const [localFilters, setLocalFilters] = useState<LogFilters>(filters)

  const updateLocalFilter = (key: keyof LogFilters, value: any) => {
    setLocalFilters({ ...localFilters, [key]: value })
  }

  const handleApplyFilters = () => {
    onFilterChange(localFilters)
  }

  const handleClearFilters = () => {
    const defaultFilters = {
      selectedAgent: 'all',
      searchQuery: '',
      dateRange: { from: '', to: '' }
    }
    setLocalFilters(defaultFilters)
    onClearFilters()
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Filter className="h-4 w-4 text-gray-600" />
        <h3 className="font-medium text-gray-900">Filters</h3>
        <div className="ml-auto flex gap-2">
          <Button
            variant="default"
            size="sm"
            onClick={handleApplyFilters}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Check className="h-4 w-4 mr-1" />
            Apply Filters
          </Button>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-4 w-4 mr-1" />
              Clear All
            </Button>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Agent</label>
          <Select value={localFilters.selectedAgent} onValueChange={(value) => updateLocalFilter('selectedAgent', value)}>
            <SelectTrigger>
              <SelectValue placeholder="All Agents" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Agents</SelectItem>
              {agents?.map((agent: any) => (
                <SelectItem key={agent.id} value={agent.id}>
                  {agent.title} ({agent.id})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Started From</label>
          <Input
            type="date"
            value={localFilters.dateRange.from}
            onChange={(e) => updateLocalFilter('dateRange', { ...localFilters.dateRange, from: e.target.value })}
            className="w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Started To</label>
          <Input
            type="date"
            value={localFilters.dateRange.to}
            onChange={(e) => updateLocalFilter('dateRange', { ...localFilters.dateRange, to: e.target.value })}
            className="w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
          <Input
            placeholder="Search logs..."
            value={localFilters.searchQuery}
            onChange={(e) => updateLocalFilter('searchQuery', e.target.value)}
            className="w-full"
          />
        </div>
      </div>
    </div>
  )
}
