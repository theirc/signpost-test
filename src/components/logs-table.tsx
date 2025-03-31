import { Button } from "@/components/ui/button"
import { useMemo, useCallback } from "react"
import jsPDF from "jspdf"
import "jspdf-autotable"
import { cn } from "@/lib/utils"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { format } from "date-fns"
import { utils, writeFile } from "xlsx"
import CustomTable from "./ui/custom-table"
import { ColumnDef } from "@tanstack/react-table"
import SearchFilter from "./ui/search-filter"
import SelectFilter from "./ui/select-filter"
import DateFilter from "./ui/date-filter"


export type Log = {
    id: string
    bot: string
    detectedLanguage: string
    detectedLocation: string
    searchTerm: string
    category: string
    userMessage: string
    answer: string
    date_created: string
}

interface LogsTableProps {
    logs: Log[]
    selectedLogs?: string[]
    onToggleSelect?: (id: string) => void
    onSelectAll?: (event: React.ChangeEvent<HTMLInputElement>) => void
    onEdit?: (id: string) => void
    onDelete?: (id: string) => void
}

export function LogsTable({
    logs,
    selectedLogs = [],
    onToggleSelect,
    onSelectAll,
    onDelete,
    onEdit
}: LogsTableProps) {
    const selectedLogsData = useMemo(() =>
        logs.filter((log) => selectedLogs.includes(log.id)),
        [logs, selectedLogs])

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
            log.bot,
            log.category,
            log.detectedLanguage,
            log.detectedLocation,
            log.searchTerm,
            log.userMessage,
            log.answer,
            format(new Date(log.date_created), "MMM dd, yyyy")
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
            log.bot,
            log.category,
            log.detectedLanguage,
            log.detectedLocation,
            log.searchTerm,
            log.userMessage,
            log.answer,
            format(new Date(log.date_created), "MMM dd, yyyy"),
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
        <bot>${log.bot}</bot>
        <category>${log.category}</category>
        <detectedLanguage>${log.detectedLanguage}</detectedLanguage>
        <detectedLocation>${log.detectedLocation}</detectedLocation>
        <searchTerm>${log.searchTerm}</searchTerm>
        <userMessage>${log.userMessage}</userMessage>
        <answer>${log.answer}</answer>
        <dateCreated>${format(new Date(log.date_created), "yyyy-MM-dd")}</dateCreated>
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

    const columns: ColumnDef<any>[] = [
        { id: "bot", accessorKey: "bot", header: "Bot", enableResizing: true, enableHiding: true, enableSorting: true, cell: (info) => info.getValue() },
        { id: "detectedLanguage", enableResizing: true, enableHiding: true, accessorKey: "detectedLanguage", header: "Detected Language", enableSorting: false, cell: (info) => info.getValue() },
        { id: "detectedLocation", enableResizing: true, enableHiding: true, accessorKey: "detectedLocation", header: "Detected Location", enableSorting: false, cell: (info) => info.getValue() },
        { id: "searchTerm", enableResizing: true, enableHiding: true, accessorKey: "searchTerm", header: "Search Term", enableSorting: false, cell: (info) => info.getValue() },
        { id: "category", enableResizing: true, enableHiding: true, accessorKey: "category", header: "Category", enableSorting: false, cell: (info) => info.getValue() },
        { id: "userMessage", enableResizing: true, enableHiding: true, accessorKey: "userMessage", header: "User Message", enableSorting: false, cell: (info) => info.getValue() },
        { id: "answer", enableResizing: true, enableHiding: true, accessorKey: "answer", header: "Answer", enableSorting: false, cell: (info) => info.getValue() },
        { id: "date_created", enableResizing: true, enableHiding: true, accessorKey: "date_created", header: "Date Created", enableSorting: true, cell: (info) => format(new Date(info.getValue() as string), "MMM dd, yyyy") },
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
            props: { filterKey: "bot", placeholder: "All bots" },
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
            props: { filterKey: "date_created", placeholder: "Pick a date" },
        },
    ]

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-4">
                <div className="flex items-center gap-4">
                    {!!selectedLogs.length && <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                id="export"
                                variant={"default"}
                                className={cn("w-[150px] justify-start text-left font-normal")}
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
                onToggleSelect={onToggleSelect}
                selectedRows={selectedLogs}
                onSelectAll={onSelectAll}
                onDelete={onDelete}
                onEdit={onEdit}
                tableId="logs-table"
                filters={filters}
            />
        </div>
    )
}
