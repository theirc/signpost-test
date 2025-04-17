import { useState, useMemo, useEffect } from "react"
import "jspdf-autotable"
import { useNavigate } from "react-router-dom"
import { ColumnDef } from "@tanstack/react-table"
import CustomTable from "@/components/ui/custom-table"
import { fetchRoles, Role } from "@/lib/data/supabaseFunctions"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { usePermissions } from "@/lib/hooks/usePermissions"

const defaultPageSize = 10

export function AccessControlSettings() {
    const navigate = useNavigate()
    const { canCreate, canUpdate } = usePermissions()
    const [roles, setRoles] = useState<Role[]>([])

    const fetchRole = async () => {
        const { data, error } = await fetchRoles()
        if (error) {
            console.error('Error fetching roles:', error)
        }
        const formattedRoles = data?.map(role => ({
            ...role,
            created_at: role.created_at || new Date().toISOString()
        }))
        setRoles(formattedRoles || [])
    }

    const handleEdit = (id: string) => {
        navigate(`/settings/roles/${id}`)
    }

    useEffect(() => {
        fetchRole()
    }, [])

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

    return (
        <div className="space-y-6">
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
            <CustomTable
                tableId="roles-table"
                columns={columns as any}
                data={roles}
                onRowClick={(row) => {
                    canUpdate("roles") ? handleEdit(row.id) : undefined
                }}
                placeholder="No roles found" />
        </div>
    )
}
