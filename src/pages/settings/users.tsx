import { Button } from "@/components/ui/button"
import { ColumnDef } from "@tanstack/react-table"
import { EnhancedDataTable } from "@/components/ui/enhanced-data-table"
import { useNavigate } from "react-router-dom"
import { format } from "date-fns"
import { usePermissions } from "@/lib/hooks/usePermissions"
import PaginatedSupabaseTableWrapper from "@/components/ui/PaginatedSupabaseTableWrapper"
import { useTeamStore } from "@/lib/hooks/useTeam"

export function UsersSettings() {
    const navigate = useNavigate()
    const { canCreate, canUpdate, canRead } = usePermissions()
    const { selectedTeam } = useTeamStore()
    const columns: ColumnDef<any>[] = [
        { id: "first_name", accessorKey: "first_name", header: "First Name", enableResizing: true, enableHiding: true, enableSorting: true, cell: (info) => info.getValue() },
        { id: "last_name", accessorKey: "last_name", header: "Last Name", enableResizing: true, enableHiding: true, enableSorting: true, cell: (info) => info.getValue() },
        { id: "role_name", enableResizing: true, enableHiding: true, accessorKey: "role_name", header: "Role", enableSorting: true, cell: (info) => info.getValue() },
        { id: "team_names", accessorKey: "team_names", header: "Teams", enableResizing: true, enableHiding: true, enableSorting: false, cell: (info) => info.getValue() },
        { id: "created_at", enableResizing: true, enableHiding: true, accessorKey: "created_at", header: "Created", enableSorting: false, cell: (info) => format(new Date(info.getValue() as string), "MMM dd, yyyy") },
    ]

    const handleEdit = (id: string) => {
        navigate(`/settings/users/${id}`)
    }

    return (
        <div>
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-medium">Users</h3>
                    <p className="text-sm text-muted-foreground">
                        Manage your organization's users
                    </p>
                </div>
                {canCreate("users") && (
                    <Button onClick={() => navigate("/settings/users/new")} className="rounded-lg">Create User</Button>
                )}
            </div>
            <PaginatedSupabaseTableWrapper
                table="users_with_teams"
                columns={columns}
                tableComponent={EnhancedDataTable}
                filters={{ team_ids: selectedTeam?.id ? { cs: `{"${selectedTeam.id}"}` } : undefined }}
                searchKey="first_name"
                onRowClick={(row) => {
                    if (canUpdate("users") || canRead("users")) handleEdit(row.id)
                }}
                placeholder="No users found"
            />
        </div>
    )
} 