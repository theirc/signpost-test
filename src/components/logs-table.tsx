import { Button } from "@/components/ui/button"
import { Search } from "lucide-react"
import { useState, useMemo, useCallback } from "react"
import { Input } from "@/components/ui/input"
import jsPDF from "jspdf"
import "jspdf-autotable"
import { cn } from "@/lib/utils"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { utils, writeFile } from "xlsx"
import CustomTable from "./ui/custom-table"
import { ColumnDef } from "@tanstack/react-table"


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
    onPreview?: (source: Log) => void
    onDelete?: (id: string) => void
}

export function LogsTable({
    logs,
    selectedLogs = [],
    onToggleSelect,
    onSelectAll,
    onDelete
}: LogsTableProps) {
    const [searchTerm, setSearchTerm] = useState("")
    const [botFilter, setBotFilter] = useState<string>("")
    const [languageFilter, setLanguageFilter] = useState<string>("")
    const [dateRange, setDateRange] = useState<{ from: Date | null; to: Date | null } | undefined>(undefined)
    const sortConfig: { key: keyof Log; direction: "asc" | "desc" } = {
        key: "date_created",
        direction: "desc",
    }

    const uniqueBots = useMemo(() => Array.from(new Set(logs.map((log) => log.bot))), [logs])
    const uniqueLanguages = useMemo(() => Array.from(new Set(logs.map((log) => log.detectedLanguage))), [logs])

    const handleSearchTermChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value)
    }, [setSearchTerm])

    const handleBotFilterChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
        setBotFilter(e.target.value)
    }, [setBotFilter])

    const handleLanguageFilterChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
        setLanguageFilter(e.target.value)
    }, [setLanguageFilter])

    const filteredAndSortedLogs = useMemo(() => {
        const searchTermLower = searchTerm.toLowerCase()

        return logs.filter((log) => {
            const matchesSearch =
                searchTerm === "" ||
                log.bot.toLowerCase().includes(searchTermLower) ||
                log.category.toLowerCase().includes(searchTermLower) ||
                log.detectedLanguage.toLowerCase().includes(searchTermLower) ||
                log.detectedLocation.toLowerCase().includes(searchTermLower) ||
                log.searchTerm.toLowerCase().includes(searchTermLower) ||
                log.userMessage.toLowerCase().includes(searchTermLower) ||
                log.answer.toLowerCase().includes(searchTermLower)

            const matchesBot = botFilter === "" || log.bot === botFilter
            const matchesLanguage = languageFilter === "" || log.detectedLanguage === languageFilter
            let matchesDateRange = true

            if (dateRange?.from && dateRange?.to) {
                const logDate = new Date(log.date_created)
                const fromDate = new Date(dateRange.from)
                const toDate = new Date(dateRange.to)
                fromDate.setHours(0, 0, 0, 0)
                toDate.setHours(23, 59, 59, 999)
                matchesDateRange = logDate >= fromDate && logDate <= toDate
            } else if (dateRange?.from) {
                const logDate = new Date(log.date_created)
                const fromDate = new Date(dateRange.from)
                fromDate.setHours(0, 0, 0, 0)
                matchesDateRange = logDate >= fromDate
            } else if (dateRange?.to) {
                const logDate = new Date(log.date_created)
                const toDate = new Date(dateRange.to)
                toDate.setHours(23, 59, 59, 999)
                matchesDateRange = logDate <= toDate
            }

            return matchesSearch && matchesDateRange && matchesBot && matchesLanguage
        }).sort((a, b) => {
            const aValue = a[sortConfig.key]
            const bValue = b[sortConfig.key]

            if (aValue < bValue) {
                return sortConfig.direction === "asc" ? -1 : 1
            }
            if (aValue > bValue) {
                return sortConfig.direction === "asc" ? 1 : -1
            }
            return 0
        })
    }, [logs, searchTerm, sortConfig, dateRange, botFilter, languageFilter])

    const selectedLogsData = useMemo(() =>
        filteredAndSortedLogs.filter((log) => selectedLogs.includes(log.id)),
        [filteredAndSortedLogs, selectedLogs])

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

    const formatDateRange = () => {
        if (!dateRange) {
            return "Pick a date"
        }

        if (dateRange.from && dateRange.to) {
            return `${format(dateRange.from, "MMM dd, yyyy")} - ${format(
                dateRange.to,
                "MMM dd, yyyy"
            )}`
        }

        if (dateRange.from) {
            return format(dateRange.from, "MMM dd, yyyy")
        }

        return "Pick a date"
    }

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

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-4">
                <div className="flex items-center gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search logs..."
                            value={searchTerm}
                            onChange={handleSearchTermChange}
                            className="pl-8"
                        />
                    </div>
                    <select
                        value={botFilter}
                        onChange={handleBotFilterChange}
                        className="px-3 py-2 rounded-md border"
                    >
                        <option value="">All bots</option>
                        {uniqueBots.map((bot) => (
                            <option key={bot} value={bot}>
                                {bot}
                            </option>
                        ))}
                    </select>
                    <select
                        value={languageFilter}
                        onChange={handleLanguageFilterChange}
                        className="px-3 py-2 rounded-md border"
                    >
                        <option value="">All languages</option>
                        {uniqueLanguages.map((language) => (
                            <option key={language} value={language}>
                                {language}
                            </option>
                        ))}
                    </select>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                id="date"
                                variant={"outline"}
                                className={cn(
                                    "w-[300px] justify-start text-left font-normal",
                                    !dateRange?.from && "text-muted-foreground"
                                )}
                            >
                                {formatDateRange()}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent
                            className="w-auto p-0"
                            align="start"
                            side="bottom"
                        >
                            <Calendar
                                mode="range"
                                defaultMonth={dateRange?.from}
                                selected={dateRange}
                                onSelect={(range) => {
                                    setDateRange({
                                        from: range?.from || null,
                                        to: range?.to || null,
                                    })
                                }}
                                numberOfMonths={2}
                            />
                        </PopoverContent>
                    </Popover>

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
                columns={columns}
                data={filteredAndSortedLogs}
                onToggleSelect={onToggleSelect}
                selectedRows={selectedLogs}
                onSelectAll={onSelectAll}
            />
        </div>
    )
}
