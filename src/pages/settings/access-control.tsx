import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from "@/components/ui/table"
import { useState, useMemo } from "react"
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, } from "@/components/ui/pagination"
import "jspdf-autotable"
import { useNavigate } from "react-router-dom"

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

    return (
        <div className="space-y-4">
            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Users</TableHead>
                            <TableHead>Description</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedRoles.map((role) => (
                            <TableRow key={role.id} onClick={() => handleRowClick(role.id)} className="cursor-pointer hover:bg-muted">
                                <TableCell>{role.name}</TableCell>
                                <TableCell>{role.users}</TableCell>
                                <TableCell>{role.description}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
            <Pagination>
                <PaginationContent>
                    {currentPage === 1 ? (
                        <span aria-disabled="true">
                            <PaginationPrevious />
                        </span>
                    ) : (
                        <PaginationPrevious onClick={() => handlePageChange(currentPage - 1)} />
                    )}

                    {Array.from({ length: pageCount }, (_, i) => i + 1).map((page) => (
                        <PaginationItem key={page}>
                            <PaginationLink
                                onClick={() => handlePageChange(page)}
                                isActive={currentPage === page}
                            >
                                {page}
                            </PaginationLink>
                        </PaginationItem>
                    ))}

                    {currentPage === pageCount ? (
                        <span aria-disabled="true">
                            <PaginationNext />
                        </span>
                    ) : (
                        <PaginationNext onClick={() => handlePageChange(currentPage + 1)} />
                    )}
                </PaginationContent>
            </Pagination>
        </div>
    )
}
