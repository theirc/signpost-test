import { Log, LogsTable } from "@/components/logs-table"
import React, { useState } from "react"

const sampleLogs: Log[] = [
    {
        id: '1',
        bot: 'Weaviate',
        message: 'What is malaria?',
        answer: 'Malaria is a disease caused by the parasite Plasmodium falciparum. It is transmitted by mosquitoes and can be fatal if left untreated.',
        reporter: 'Helen',
        score: 'Pass',
        question: 'What is malaria?'
    },
    {
        id: '2',
        bot: 'Signpost Help Helper',
        message: "I'm a single mother with three kids, one of them need medical support. where can i go to get support?",
        answer: "To receive support as a single mother with three kids, including one needing medical assistance, you can apply for social benefits in Georgia. The criteria for receiving assistance include having a large family with three or more children under the age of 18. Additionally, being a single mother or father raising minor children on your own qualifies you for support. To access this assistance, you would need to fill out an application form to apply for the necessary help.",
        reporter: 'Liam Nicoll',
        score: 'Fail',
        question: "I'm a single mother with three kids, one of them need medical support. where can i go to get support?"
    }
]


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