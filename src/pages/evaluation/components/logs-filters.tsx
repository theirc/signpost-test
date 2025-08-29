import { Filter, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LogFilters } from "../types"

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
  const updateFilter = (key: keyof LogFilters, value: any) => {
    onFilterChange({ ...filters, [key]: value })
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Filter className="h-4 w-4 text-gray-600" />
        <h3 className="font-medium text-gray-900">Filters</h3>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="ml-auto text-gray-500 hover:text-gray-700"
          >
            <X className="h-4 w-4 mr-1" />
            Clear All
          </Button>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Agent</label>
          <Select value={filters.selectedAgent} onValueChange={(value) => updateFilter('selectedAgent', value)}>
            <SelectTrigger>
              <SelectValue placeholder="All Agents" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Agents</SelectItem>
              {agents?.map((agent: any) => (
                <SelectItem key={agent.id} value={agent.id}>
                  {agent.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Started From</label>
          <Input
            type="date"
            value={filters.dateRange.from}
            onChange={(e) => updateFilter('dateRange', { ...filters.dateRange, from: e.target.value })}
            className="w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Started To</label>
          <Input
            type="date"
            value={filters.dateRange.to}
            onChange={(e) => updateFilter('dateRange', { ...filters.dateRange, to: e.target.value })}
            className="w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
          <Input
            placeholder="Search logs..."
            value={filters.searchQuery}
            onChange={(e) => updateFilter('searchQuery', e.target.value)}
            className="w-full"
          />
        </div>
      </div>
    </div>
  )
}
