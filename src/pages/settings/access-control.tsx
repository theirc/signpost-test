import { useState, useMemo } from "react"
import "jspdf-autotable"
import { useNavigate } from "react-router-dom"
import { ColumnDef } from "@tanstack/react-table"
import CustomTable from "@/components/ui/custom-table"

const testData = [
    {
        id: "1",
        name: "Public",
        users: 10,
        description: "Controls what API data is available without authentication",
    },
    {
        id: "2",
        name: "Administrator",
        users: 5,
        description: "Initial administrative role with unrestricted App/API access",
    },
    {
        id: "3",
        name: "Developers",
        users: 4,
        description: "",
    },
    {
        id: "4",
        name: "External Mapping",
        users: 1,
        description: "",
    },
    {
        id: "5",
        name: "Service Mapping Officer",
        users: 164,
        description: "",
    },
    {
        id: "6",
        name: "Site Admin",
        users: 41,
        description: "",
    }
]


const defaultPageSize = 10

export function AccessControlSettings() {
    const [currentPage, setCurrentPage] = useState(1)
    const pageCount = Math.ceil(testData.length / defaultPageSize)
    const navigate = useNavigate()

    const handleRowClick = (roleId: string) => {
        navigate(`/settings/roles/${roleId}`)
    }

    const paginatedRoles = useMemo(() => {
        const startIndex = (currentPage - 1) * defaultPageSize
        const endIndex = startIndex + defaultPageSize
        return testData.slice(startIndex, endIndex)
    }, [currentPage])

    const handlePageChange = (page: number) => {
        setCurrentPage(page)
    }

    const columns: ColumnDef<any>[] = [
        { id: "name", accessorKey: "name", header: "Name", enableResizing: true, enableHiding: true, enableSorting: false, cell: (info) => info.getValue() },
        { id: "users", enableResizing: true, enableHiding: true, accessorKey: "users", header: "Users", enableSorting: false, cell: (info) => info.getValue() },
        { id: "description", enableResizing: true, enableHiding: true, accessorKey: "description", header: "Description", enableSorting: false, cell: (info) => info.getValue() },
    ]

    return (
        <div className="space-y-4">
            <CustomTable tableId="roles-table" columns={columns as any} data={paginatedRoles} placeholder="No roles found" onEdit={handleRowClick} />
        </div>
    )
}
