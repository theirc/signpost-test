import { Button } from "@/components/ui/button"
import { Loader2, Plus } from "lucide-react"
import React, { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { usePermissions } from "@/lib/hooks/usePermissions"
import { useTeamStore } from "@/lib/hooks/useTeam"
import { format } from "date-fns"
import { ColumnDef } from "@tanstack/react-table"
import { EnhancedDataTable } from "@/components/ui/enhanced-data-table"
import { supabase } from "@/lib/agents/db"


export function BotScoresTable() {
    const navigate = useNavigate()
    const { canCreate, canUpdate } = usePermissions()
    const { selectedTeam } = useTeamStore()
    const [scores, setScores] = useState([])
    const [isLoading, setIsLoading] = useState(false)

    const fetchScores = async () => {
        setIsLoading(true)
        const { data, error } = await supabase.from('bot_scores').select(`
            *,
            bots (
              name
            ),
            service_categories (
              name
            )
          `)
            .eq('team_id', selectedTeam.id)
            .order('created_at', { ascending: false })
        if (error) {
            console.error('Error fetching bot scores:', error)
        }

        const formattedScores = data.map(score => ({
            ...score,
            bot_name: score.bots?.name,
            category_name: score.service_categories?.name,
            created_at: score.created_at || new Date().toISOString()
        }))
        setScores(formattedScores)
        setIsLoading(false)
    }

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

    useEffect(() => {
        fetchScores()
    }, [selectedTeam])

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 p-8 pt-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Scores</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            View and manage your bot evaluation scores.
                        </p>

                    </div>
                    {canCreate("scores") && (
                        <Button onClick={() => navigate("/scores/new")}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Score
                        </Button>
                    )}
                </div>
                {isLoading ? (
                    <div className="flex items-center justify-center h-[400px]">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <EnhancedDataTable
                        columns={columns}
                        data={scores}
                        onRowClick={(row) => {
                            canUpdate("scores") ? handleEdit(row.id) : undefined
                        }}
                        placeholder="No scores found"
                        searchKey="bot_name"
                        searchPlaceholder="Search by bot name..."
                        showPagination={true}
                        showColumnToggle={true}
                        pageSize={10}
                    />
                )}
            </div>
        </div >
    )
} 