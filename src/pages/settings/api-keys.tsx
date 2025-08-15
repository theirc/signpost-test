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

export interface ApiKey {
    id: string
    key?: string
    type?: string
    team_id?: string
    created_at?: string
    description?: string
  }

export function ApiKeysSettings() {
    const navigate = useNavigate()
    const { selectedTeam } = useTeamStore()
    const { canCreate, canUpdate } = usePermissions()

    const { data: apiKeys = [], isLoading, error } = useQuery({
        queryKey: ['api_keys', selectedTeam?.id],
        queryFn: async () => {
            const { data, error } = await supabase.from("api_keys").select("*").eq("team_id", selectedTeam?.id)
            if (error) throw error
            return data?.map(apikey => ({
                ...apikey,
                created_at: apikey.created_at || new Date().toISOString()
            })) || []
        },
        enabled: !!selectedTeam?.id,
    })

    const handleEdit = (id: string) => {
        navigate(`/settings/apikeys/${id}`)
    }

    const columns: ColumnDef<any>[] = [
        { id: "description", accessorKey: "description", header: "Description", enableResizing: true, enableHiding: true, enableSorting: true, cell: (info) => info.getValue() },
        { id: "type", accessorKey: "type", header: "Type", enableResizing: true, enableHiding: true, enableSorting: true, cell: (info) => info.getValue() },
        { id: "key", enableResizing: true, enableHiding: true, accessorKey: "key", header: "Key", enableSorting: true, cell: (info) => info.getValue() },
        { id: "created_at", enableResizing: true, enableHiding: true, accessorKey: "created_at", header: "Created", enableSorting: false, cell: (info) => format(new Date(info.getValue() as string), "MMM dd, yyyy") },
    ]

    if (error) {
        return (
            <div className="flex items-center justify-center h-[400px]">
                <div className="text-center">
                    <p className="text-red-600">Error loading API keys: {error.message}</p>
                </div>
            </div>
        )
    }

    return (
        <div>
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-medium">Api Keys</h3>
                    <p className="text-sm text-muted-foreground">
                        Manage your organization's Api Keys
                    </p>
                </div>
                {canCreate("apikeys") && (
                    <Button onClick={() => navigate("/settings/apikeys/new")} className="rounded-lg">Create Api Key</Button>
                )}
            </div>
            <PaginatedSupabaseTableWrapper
                table="api_keys"
                columns={columns}
                tableComponent={EnhancedDataTable}
                filters={{ team_id: selectedTeam?.id }}
                searchKey="description"
                onRowClick={(row) => {
                    if (canUpdate("users")) handleEdit(row.id)
                }}
                placeholder="No keys found"
            />
        </div>
    )
} 