import { LogsTable } from "@/components/logs-table"
import { deleteBotLog, fetchBotLogs } from "@/lib/data/supabaseFunctions"
import React, { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { useNavigate } from "react-router-dom"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { usePermissions } from "@/lib/hooks/usePermissions"

export function BotLogsTable() {
    const navigate = useNavigate()
    const { canCreate, canUpdate, canDelete } = usePermissions()
    const [logs, setLogs] = useState([])
    const [selectedLogs, setSelectedLogs] = useState<string[]>([])
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [logToDelete, setLogToDelete] = useState<string | null>(null)

    const fetchLogs = async () => {
        const { data, error } = await fetchBotLogs()
        if (error) {
            console.error('Error fetching bot logs:', error)
        }
        const formattedLogs = data.map(log => ({
            ...log,
            created_at: log.created_at || new Date().toISOString()
        }))
        setLogs(formattedLogs)
    }

    const handleDelete = async (id: string) => {
        setLogToDelete(id)
        setIsDeleteDialogOpen(true)
    }

    const confirmDelete = async () => {
        if (!logToDelete) return

        const { error } = await deleteBotLog(logToDelete)
        if (error) {
            console.error('Error deleting log:', error)
        } else {
            await fetchLogs()
        }
        setIsDeleteDialogOpen(false)
        setLogToDelete(null)
    }

    const handleEdit = (id: string) => {
        navigate(`/logs/${id}`)
    }

    const handleToggleSelect = (id: string) => {
        setSelectedLogs(prev =>
            prev.includes(id)
                ? prev.filter(logId => logId !== id)
                : [...prev, id]
        )
    }

    const handleSelectAll = () => {
        setSelectedLogs(prev => prev.length === logs.length ? [] : logs.map(log => log.id))
    }

    useEffect(() => {
        fetchLogs()
    }, [])

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 space-y-4 p-8 pt-6">
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

                <div className="space-y-4">
                    <LogsTable
                        logs={logs}
                        selectedLogs={selectedLogs}
                        onToggleSelect={handleToggleSelect}
                        onSelectAll={handleSelectAll}
                        onDelete={canDelete("logs") ? handleDelete : undefined}
                        onEdit={canUpdate("logs") ? handleEdit : undefined}
                    />
                    <div className="flex justify-between items-center">
                        <div className="text-sm text-muted-foreground">
                            {selectedLogs.length} logs selected
                        </div>
                    </div>
                </div>
            </div>

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action is irreversible. This will permanently delete the log.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div >
    )
} 