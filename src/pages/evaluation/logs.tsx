import React, { useCallback, useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { usePermissions } from "@/lib/hooks/usePermissions"
import { useTeamStore } from "@/lib/hooks/useTeam"
import { Loader2 } from "lucide-react"
import { ColumnDef } from "@tanstack/react-table"
import DateFilter from "@/components/ui/date-filter"
import SearchFilter from "@/components/ui/search-filter"
import SelectFilter from "@/components/ui/select-filter"
import { format, parseISO } from "date-fns"
import CustomTable from "@/components/ui/custom-table"
import jsPDF from "jspdf"
import { utils, writeFile } from "xlsx"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { useSupabase } from "@/hooks/use-supabase"

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
    const [selectedLogs, setSelectedLogs] = useState<string[]>([])
    const [isLoading, setIsLoading] = useState(false)

    const selectedLogsData = useMemo(() =>
        logs.filter((log) => selectedLogs.includes(log.id)),
        [logs, selectedLogs])

    const fetchLogs = async () => {
        setIsLoading(true)
        try {
            const { data, error } = await useSupabase().from('bot_logs')
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

    const filters = [
        {
            id: "search",
            label: "Search",
            component: SearchFilter,
            props: { filterKey: "search", placeholder: "Search logs..." },
        },
        {
            id: "bot",
            label: "Bot",
            component: SelectFilter,
            props: { filterKey: "bot_name", placeholder: "All bots" },
        },
        {
            id: "detectedLanguage",
            label: "Language",
            component: SelectFilter,
            props: { filterKey: "detectedLanguage", placeholder: "All languages" },
        },
        {
            id: "range",
            label: "Date Created",
            component: DateFilter,
            props: { filterKey: "created_at", placeholder: "Pick a date" },
        },
    ]

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

    const handleExportPdf = useCallback(() => {
        const doc = new jsPDF()

        const headers = [
            "Bot",
            "Category",
            "Detected Language",
            "Detected Location",
            "Search Term",
            "User Message",
            "Answer",
            "Date Created",
        ]

        const body = selectedLogsData.map((log) => [
            log.bot_name,
            log.category_name,
            log.detected_language,
            log.detected_location,
            log.search_term,
            log.user_message,
            log.answer,
            format(new Date(log.created_at), "MMM dd, yyyy")
        ]);

        (doc as any).autoTable({
            head: [headers],
            body: body,
        })

        doc.save("ai_bot_logs.pdf")
    }, [selectedLogsData])

    const handleExportExcel = useCallback(() => {
        const headers = [
            "Bot",
            "Category",
            "Detected Language",
            "Detected Location",
            "Search Term",
            "User Message",
            "Answer",
            "Date Created"
        ]
        const data = selectedLogsData.map((log) => [
            log.bot_name,
            log.category_name,
            log.detected_language,
            log.detected_location,
            log.search_term,
            log.user_message,
            log.answer,
            format(new Date(log.created_at), "MMM dd, yyyy")
        ])

        const worksheet = utils.aoa_to_sheet([headers, ...data])
        const workbook = utils.book_new()
        utils.book_append_sheet(workbook, worksheet, "Logs")
        writeFile(workbook, "ai_bot_logs.xlsx")
    }, [selectedLogsData])

    const handleExportJson = useCallback(() => {
        const json = JSON.stringify(selectedLogsData, null, 2)
        const blob = new Blob([json], { type: "application/json" })
        const link = document.createElement("a")
        link.href = URL.createObjectURL(blob)
        link.download = "ai_bot_logs.json"
        link.click()
    }, [selectedLogsData])

    const handleExportXml = useCallback(() => {
        const xml = `<logs>\n${selectedLogsData
            .map(
                (log) => `
    <log>
        <bot>${log.bot_name}</bot>
        <category>${log.category_name}</category>
        <detectedLanguage>${log.detected_language}</detectedLanguage>
        <detectedLocation>${log.detected_location}</detectedLocation>
        <searchTerm>${log.search_term}</searchTerm>
        <userMessage>${log.user_message}</userMessage>
        <answer>${log.answer}</answer>
        <dateCreated>${format(new Date(log.created_at), "MMM dd, yyyy")}</dateCreated>
    </log>`
            )
            .join("\n")}
</logs>`

        const blob = new Blob([xml], { type: "application/xml" })
        const link = document.createElement("a")
        link.href = URL.createObjectURL(blob)
        link.download = "ai_bot_logs.xml"
        link.click()
    }, [selectedLogsData])

    useEffect(() => {
        fetchLogs()
    }, [selectedTeam])

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
                    {isLoading ? (
                        <div className="flex items-center justify-center h-[400px]">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <div>
                            <div className="flex flex-col gap-4">
                                <div className="flex items-center gap-4">
                                    {!!selectedLogs.length && <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                id="export"
                                                variant={"default"}
                                                className={cn("justify-start text-left font-normal")}
                                            >
                                                Export
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start" side="bottom">
                                            <div className="flex flex-col space-y-2">
                                                <Button variant="ghost" className="justify-start" onClick={handleExportPdf}>
                                                    Export as PDF
                                                </Button>
                                                <Button variant="ghost" className="justify-start" onClick={handleExportExcel}>
                                                    Export as Excel
                                                </Button>
                                                <Button variant="ghost" className="justify-start" onClick={handleExportJson}>
                                                    Export as JSON
                                                </Button>
                                                <Button variant="ghost" className="justify-start" onClick={handleExportXml}>
                                                    Export as XML
                                                </Button>
                                            </div>
                                        </PopoverContent>
                                    </Popover>}
                                </div>
                            </div>
                            <CustomTable
                                columns={columns as any}
                                data={logs}
                                onToggleSelect={handleToggleSelect}
                                selectedRows={selectedLogs}
                                onSelectAll={handleSelectAll}
                                onRowClick={(row) => {
                                    canUpdate("logs") ? handleEdit(row.id) : undefined
                                }}
                                tableId="logs-table"
                                filters={filters}
                            />
                            <div className="flex justify-between items-center mt-4">
                                <div className="text-sm text-muted-foreground">
                                    {selectedLogs.length} logs selected
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
} 