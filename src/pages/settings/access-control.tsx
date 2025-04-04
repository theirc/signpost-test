import { useState, useMemo, useEffect } from "react"
import "jspdf-autotable"
import { useNavigate } from "react-router-dom"
import { ColumnDef } from "@tanstack/react-table"
import CustomTable from "@/components/ui/custom-table"
import { fetchRoles, Role } from "@/lib/data/supabaseFunctions"
import { format } from "date-fns"


const defaultPageSize = 10

export function AccessControlSettings() {
    const navigate = useNavigate()
    const [roles, setRoles] = useState<Role[]>([])

    const fetchRole = async () => {
        const rolesResponse = await fetchRoles()
    
        if (rolesResponse.error) {
          console.error('Error fetching roles:', rolesResponse.error)
          return
        }
        setRoles(rolesResponse.data)
      }

    const handleRowClick = (roleId: string) => {
        navigate(`/settings/roles/${roleId}`)
    }

    const columns: ColumnDef<any>[] = [
        { id: "name", accessorKey: "name", header: "Name", enableResizing: true, enableHiding: true, enableSorting: false, cell: (info) => info.getValue() },
        { id: "description", enableResizing: true, enableHiding: true, accessorKey: "description", header: "Description", enableSorting: false, cell: (info) => info.getValue() },
        { id: "created_at", enableResizing: true, enableHiding: true, accessorKey: "created_at", header: "Created At", enableSorting: false, cell: (info) => format(new Date(info.getValue() as string), "MMM dd, yyyy") },
    ]

    useEffect(() => {
        fetchRole()
      }, [])

    return (
        <div className="space-y-4">
            <CustomTable tableId="roles-table" columns={columns as any} data={roles} placeholder="No roles found" onEdit={handleRowClick} />
        </div>
    )
}
