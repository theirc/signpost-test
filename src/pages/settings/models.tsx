import { Button } from "@/components/ui/button"
import { ColumnDef } from "@tanstack/react-table"
import { EnhancedDataTable } from "@/components/ui/enhanced-data-table"
import { useNavigate } from "react-router-dom"
import { format } from "date-fns"
import { usePermissions } from "@/lib/hooks/usePermissions"
import { useTeamStore } from "@/lib/hooks/useTeam"
import { supabase } from "@/lib/agents/db"
import PaginatedSupabaseTableWrapper from "@/components/ui/PaginatedSupabaseTableWrapper"
import { useQuery } from "@tanstack/react-query"

export interface Model {
  id: string
  provider?: string
  title?: string
  model?: string
  created_at?: string
}

export function ModelsSettings() {
  const navigate = useNavigate()
  const { selectedTeam } = useTeamStore()
  const { canCreate, canUpdate } = usePermissions()

  const { data: models = [], isLoading, error } = useQuery({
    queryKey: ['models', selectedTeam?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("models").select("*")
      if (error) throw error
      return data?.map(model => ({
        ...model,
        created_at: model.created_at || new Date().toISOString()
      })) || []
    },
    enabled: !!selectedTeam?.id,
  })

  const handleEdit = (id: string) => {
    navigate(`/settings/models/${id}`)
  }

  const columns: ColumnDef<any>[] = [
    { id: "title", accessorKey: "title", header: "Title", enableResizing: true, enableHiding: true, enableSorting: true, cell: (info) => info.getValue() },
    { id: "provider", accessorKey: "provider", header: "Provider", enableResizing: true, enableHiding: true, enableSorting: true, cell: (info) => info.getValue() },
    { id: "model", enableResizing: true, enableHiding: true, accessorKey: "model", header: "Model ID", enableSorting: true, cell: (info) => info.getValue() },
    { id: "created_at", enableResizing: true, enableHiding: true, accessorKey: "created_at", header: "Created", enableSorting: false, cell: (info) => format(new Date(info.getValue() as string), "MMM dd, yyyy") },
  ]

  if (error) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="text-center">
          <p className="text-red-600">Error loading models: {error.message}</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Models</h3>
          <p className="text-sm text-muted-foreground">
            Manage your organization's AI Models
          </p>
        </div>
        <Button onClick={() => navigate("/settings/models/new")} className="rounded-lg">Create Model</Button>
      </div>
      <PaginatedSupabaseTableWrapper
        table="models"
        columns={columns}
        tableComponent={EnhancedDataTable}
        filters={null}
        searchKey="title"
        onRowClick={(row) => {
          if (canUpdate("models")) handleEdit(row.id)
        }}
        placeholder="No models found"
      />
    </div>
  )
}
