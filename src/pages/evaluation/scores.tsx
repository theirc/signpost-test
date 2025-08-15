import { Button } from "@/components/ui/button"
import { Loader2, Plus } from "lucide-react"
import React from "react"
import { useNavigate } from "react-router-dom"
import { usePermissions } from "@/lib/hooks/usePermissions"
import { useTeamStore } from "@/lib/hooks/useTeam"
import { format } from "date-fns"
import { ColumnDef } from "@tanstack/react-table"
import PaginatedSupabaseTableWrapper from "@/components/ui/PaginatedSupabaseTableWrapper"
import { EnhancedDataTable } from "@/components/ui/enhanced-data-table"
import { HighlightText } from "@/components/ui/shadcn-io/highlight-text"

export function BotScoresTable() {
    const navigate = useNavigate()
    const { canCreate, canUpdate } = usePermissions()
    const { selectedTeam } = useTeamStore()

    const columns: ColumnDef<any>[] = [
        { id: "id", accessorKey: "id", header: "ID", enableResizing: true, enableHiding: true, cell: (info) => info.getValue() },
        { id: "bot", accessorKey: "bot_name", header: "Bot", enableResizing: true, enableHiding: true, enableSorting: true, cell: (info) => info.getValue() },
        { id: "message", enableResizing: true, enableHiding: true, accessorKey: "message", header: "Message", enableSorting: false, cell: (info) => info.getValue() },
        { id: "answer", enableResizing: true, enableHiding: true, accessorKey: "answer", header: "Answer", enableSorting: false, cell: (info) => info.getValue() },
        { id: "reporter", enableResizing: true, enableHiding: true, accessorKey: "reporter", header: "Reporter", enableSorting: true, cell: (info) => info.getValue() },
        { id: "score", enableResizing: true, enableHiding: true, accessorKey: "score", header: "Score", enableSorting: true, cell: (info) => info.getValue() },
        { id: "question", enableResizing: true, enableHiding: true, accessorKey: "question", header: "Question", enableSorting: false, cell: (info) => info.getValue() },
        { id: "category", enableResizing: true, enableHiding: true, accessorKey: "category_name", header: "Category", enableSorting: true, cell: (info) => info.getValue() },
        { id: "created_at", enableResizing: true, enableHiding: true, accessorKey: "created_at", header: "Date Created", enableSorting: true, cell: (info) => format(new Date(info.getValue() as string), "MMM dd, yyyy") },
    ]

    const handleEdit = (id: string) => {
        navigate(`/scores/${id}`)
    }

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 p-8 pt-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-3"><HighlightText text="Scores" className="text-4xl font-bold" /></h1>
                        <p className="text-lg text-gray-600 font-medium leading-relaxed">
                            View and manage your bot evaluation scores.
                        </p>
                    </div>
                    {canCreate("scores") && (
                        <Button className="rounded-lg" onClick={() => navigate("/scores/new")}> <Plus className="h-4 w-4 mr-2" /> Add Score </Button>
                    )}
                </div>
                <PaginatedSupabaseTableWrapper
                    table="bot_scores"
                    columns={columns}
                    tableComponent={EnhancedDataTable}
                    filters={{ team_id: selectedTeam?.id }}
                    searchKey="bot_name"
                    onRowClick={(row) => {
                        if (canUpdate("scores")) handleEdit(row.id)
                    }}
                    placeholder="No scores found"
                />
            </div>
        </div>
    )
} 