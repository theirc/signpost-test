import { useState, useMemo, useEffect } from "react"
import "jspdf-autotable"
import { useNavigate } from "react-router-dom"
import { ColumnDef } from "@tanstack/react-table"
import CustomTable from "@/components/ui/custom-table"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { usePermissions } from "@/lib/hooks/usePermissions"
import { Loader2 } from "lucide-react"
import { supabase } from "@/lib/agents/db"

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
  }

export function AccessControlSettings() {
    const navigate = useNavigate()
    const { canCreate, canUpdate } = usePermissions()
    const [roles, setRoles] = useState<Role[]>([])
    const [isLoading, setIsLoading] = useState(false)

    const fetchRole = async () => {
        setIsLoading(true)
        const { data, error } = await supabase.from("roles").select("*")
        if (error) {
            console.error('Error fetching roles:', error)
        }
        const formattedRoles = data?.map(role => ({
            ...role,
            created_at: role.created_at || new Date().toISOString()
        }))
        setRoles(formattedRoles as unknown as Role[] || [])
        setIsLoading(false)
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
            {isLoading ? (
                <div className="flex items-center justify-center h-[400px]">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : (
                <CustomTable
                    tableId="roles-table"
                    columns={columns as any}
                    data={roles}
                    onRowClick={(row) => {
                        canUpdate("roles") ? handleEdit(row.id) : undefined
                    }}
                    placeholder="No roles found" />
            )}
        </div>
    )
}
