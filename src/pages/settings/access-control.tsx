import { useMemo } from "react"
import "jspdf-autotable"
import { useNavigate } from "react-router-dom"
import { ColumnDef } from "@tanstack/react-table"
import { EnhancedDataTable } from "@/components/ui/enhanced-data-table"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { usePermissions } from "@/lib/hooks/usePermissions"
import { supabase } from "@/lib/agents/db"
import { useTeamStore } from "@/lib/hooks/useTeam"
import { useQuery } from "@tanstack/react-query"

const defaultPageSize = 10

interface Role {
    id: string
    name: string
    description?: string
    permissions?: {
      resource: string
      create: boolean
      read: boolean
      update: boolean
      delete: boolean
    }[]
    created_at: string
    updated_at: string
    teams_id: string[]
  }

export function AccessControlSettings() {
    const navigate = useNavigate()
    const { canCreate, canUpdate } = usePermissions()
    const { selectedTeam } = useTeamStore()

    const { data: roles = [], isLoading, error } = useQuery({
        queryKey: ['roles', selectedTeam?.id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("roles")
                .select("*")
                .contains("teams_id", [selectedTeam?.id])
            if (error) throw error
            return data?.map(role => ({
                ...role,
                created_at: role.created_at || new Date().toISOString(),
                teams: role.teams_id
            })) || []
        },
        enabled: !!selectedTeam?.id,
    })

    const handleEdit = (id: string) => {
        navigate(`/settings/roles/${id}`)
    }

    const columns = useMemo<ColumnDef<Role>[]>(() => [
        {
            id: "name",
            accessorKey: "name",
            header: "Name",
            enableHiding: true,
            enableSorting: true,
            enableResizing: true,
            cell: (info) => info.getValue()
        },
        {
            id: "description",
            accessorKey: "description",
            header: "Description",
            enableHiding: true,
            enableSorting: false,
            enableResizing: true,
            cell: (info) => info.getValue()
        },
        {
            id: "created_at",
            accessorKey: "created_at",
            header: "Created At",
            enableHiding: true,
            enableSorting: true,
            enableResizing: true,
            cell: ({ row }) => format(new Date(row.original.created_at), "PPP"),
        },
    ], [])

    if (error) {
        return (
            <div className="flex items-center justify-center h-[400px]">
                <div className="text-center">
                    <p className="text-red-600">Error loading roles: {error.message}</p>
                </div>
            </div>
        )
    }

    return (
        <div>
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-medium">Roles</h3>
                    <p className="text-sm text-muted-foreground">
                        Manage your organization's roles and permissions
                    </p>
                </div>
                {canCreate("roles") && (
                    <Button onClick={() => navigate("/settings/roles/new")}>Create Role</Button>
                )}
            </div>
            <EnhancedDataTable
                columns={columns as any}
                data={roles}
                onRowClick={(row) => {
                    canUpdate("roles") ? handleEdit(row.id) : undefined
                }}
                placeholder="No roles found" />
        </div>
    )
}
