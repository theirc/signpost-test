import sampleLogs from "@/components/data/sample-logs"
import { LogsTable } from "@/components/logs-table"
import React, { useState } from "react"


export function BotLogsTable() {
    const [logs, setLogs] = useState(sampleLogs)
    const [selectedLogs, setSelectedLogs] = React.useState<string[]>([])

    const handleDelete = (id: string) => {
        const newLogs = logs.filter(source => source.id !== id)
        setLogs(newLogs)
        setSelectedLogs(selectedLogs.filter(sourceId => sourceId !== id))
    }

    const handleToggleSelect = (id: string) => {
        setSelectedLogs(prev =>
            prev.includes(id)
                ? prev.filter(logId => logId !== id)
                : [...prev, id]
        )
    }

    const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedLogs(event.target.checked ? logs.map(log => log.id) : [])
    }

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 space-y-4 p-8 pt-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Bot Logs</h2>
                    </div>
                </div>

                <div className="space-y-4">
                    <LogsTable
                        logs={logs}
                        selectedLogs={selectedLogs}
                        onToggleSelect={handleToggleSelect}
                        onSelectAll={handleSelectAll}
                        onDelete={handleDelete}
                    />
                    <div className="flex justify-between items-center">
                        <div className="text-sm text-muted-foreground">
                            {selectedLogs.length} logs selected
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
} 