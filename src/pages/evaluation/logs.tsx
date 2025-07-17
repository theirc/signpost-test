import React, { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { usePermissions } from "@/lib/hooks/usePermissions"
import { useTeamStore } from "@/lib/hooks/useTeam"
import { Loader2 } from "lucide-react"
import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { EnhancedDataTable } from "@/components/ui/enhanced-data-table"
import { supabase } from "@/lib/agents/db"

type Log = {
    id: string
    bot: string
    bot_name: string
    category: string
    category_name: string
    detected_language: string
    detected_location: string
    search_term: string
    user_message: string
    answer: string
    created_at: string
}

export function BotLogsTable() {
    const navigate = useNavigate()
    const { canCreate, canUpdate } = usePermissions()
    const { selectedTeam } = useTeamStore()
    const [logs, setLogs] = useState([])
    const [isLoading, setIsLoading] = useState(false)

    const fetchLogs = async () => {
        setIsLoading(true)
        try {
            const { data, error } = await supabase.from('bot_logs')
                .select(`
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
                console.error('Error fetching bot logs:', error)
            }
            const formattedLogs = data.map(log => ({
                ...log,
                bot_name: log.bots?.name,
                category_name: log.service_categories?.name,
                created_at: log.created_at || new Date().toISOString()
            }))
            setLogs(formattedLogs)
        } finally {
            setIsLoading(false)
        }
    }

    const columns: ColumnDef<any>[] = [
        { id: "id", accessorKey: "id", header: "ID", enableResizing: true, enableHiding: true, cell: (info) => info.getValue() },
        { id: "bot", accessorKey: "bot_name", header: "Bot", enableResizing: true, enableHiding: true, enableSorting: true, cell: (info) => info.getValue() },
        { id: "detectedLanguage", enableResizing: true, enableHiding: true, accessorKey: "detected_language", header: "Detected Language", enableSorting: false, cell: (info) => info.getValue() },
        { id: "detectedLocation", enableResizing: true, enableHiding: true, accessorKey: "detected_location", header: "Detected Location", enableSorting: false, cell: (info) => info.getValue() },
        { id: "searchTerm", enableResizing: true, enableHiding: true, accessorKey: "search_term", header: "Search Term", enableSorting: false, cell: (info) => info.getValue() },
        { id: "category", enableResizing: true, enableHiding: true, accessorKey: "category_name", header: "Category", enableSorting: false, cell: (info) => info.getValue() },
        { id: "userMessage", enableResizing: true, enableHiding: true, accessorKey: "user_message", header: "User Message", enableSorting: false, cell: (info) => info.getValue() },
        { id: "answer", enableResizing: true, enableHiding: true, accessorKey: "answer", header: "Answer", enableSorting: false, cell: (info) => info.getValue() },
        { id: "created_at", enableResizing: true, enableHiding: true, accessorKey: "created_at", header: "Date Created", enableSorting: true, cell: (info) => format(new Date(info.getValue() as string), "MMM dd, yyyy") },
    ]

    const handleEdit = (id: string) => {
        navigate(`/logs/${id}`)
    }

    useEffect(() => {
        fetchLogs()
    }, [selectedTeam])

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 p-8 pt-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Logs</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            View and manage your bot interaction logs.
                        </p>
                    </div>
                    {canCreate("logs") && (
                        <Button onClick={() => navigate("/logs/new")}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Log
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
                        data={logs}
                        onRowClick={(row) => {
                            canUpdate("logs") ? handleEdit(row.id) : undefined
                        }}
                        placeholder="No logs found"
                        searchKey="bot_name"
                        searchPlaceholder="Search by bot name..."
                        showPagination={true}
                        showColumnToggle={true}
                        pageSize={10}
                    />
                )}
            </div>
        </div>
    )
} 