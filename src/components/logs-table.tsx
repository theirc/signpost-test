import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from "@/components/ui/table"
import { ArrowUpDown, Search } from "lucide-react"
import { useState, useMemo, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, } from "@/components/ui/pagination"
import jsPDF from "jspdf"
import "jspdf-autotable"

export type Log = {
    id: string
    bot: string
    message: string
    answer: string
    reporter: string
    score: string
    question: string
}

interface LogsTableProps {
    logs: Log[]
    selectedLogs?: string[]
    onToggleSelect?: (id: string) => void
    onSelectAll?: (event: React.ChangeEvent<HTMLInputElement>) => void
    onPreview?: (source: Log) => void
    onDelete?: (id: string) => void
    pageSize?: number
}

const defaultPageSize = 10

export function LogsTable({
    logs,
    selectedLogs = [],
    onToggleSelect,
    onSelectAll,
    onPreview,
    onDelete,
    pageSize = defaultPageSize,
}: LogsTableProps) {
    const [sortConfig, setSortConfig] = useState<{ key: keyof Log; direction: "asc" | "desc" }>({
        key: "id",
        direction: "desc",
    })
    const [searchTerm, setSearchTerm] = useState("")
    const [scoreFilter, setScoreFilter] = useState<string>("")
    const [reporterFilter, setReporterFilter] = useState<string>("")
    const [currentPage, setCurrentPage] = useState(1)

    const uniqueScores = useMemo(() => Array.from(new Set(logs.map((log) => log.score))), [logs])

    const uniqueReporters = useMemo(() => Array.from(new Set(logs.map((log) => log.reporter))), [logs])

    const handleSort = useCallback((key: keyof Log) => {
        setSortConfig((current) => ({ key, direction: current.key === key && current.direction === "asc" ? "desc" : "asc", }))
    }, [setSortConfig])

    const handleSearchTermChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value)
    }, [setSearchTerm])

    const handleScoreFilterChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
        setScoreFilter(e.target.value)
    }, [setScoreFilter])

    const handleReporterFilterChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
        setReporterFilter(e.target.value)
    }, [setReporterFilter])

    const filteredAndSortedLogs = useMemo(() => {
        const searchTermLower = searchTerm.toLowerCase()

        return logs.filter((log) => {
            const matchesSearch =
                searchTerm === "" ||
                log.bot.toLowerCase().includes(searchTermLower) ||
                log.message.toLowerCase().includes(searchTermLower) ||
                log.answer.toLowerCase().includes(searchTermLower) ||
                log.reporter.toLowerCase().includes(searchTermLower) ||
                log.score.toLowerCase().includes(searchTermLower) ||
                log.question.toLowerCase().includes(searchTermLower)

            const matchesScore = scoreFilter === "" || log.score === scoreFilter
            const matchesReporter =
                reporterFilter === "" || log.reporter === reporterFilter

            return matchesSearch && matchesScore && matchesReporter
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
    }, [logs, searchTerm, scoreFilter, sortConfig, reporterFilter])

    const selectedLogsData = useMemo(() =>
        filteredAndSortedLogs.filter((log) => selectedLogs.includes(log.id)),
        [filteredAndSortedLogs, selectedLogs])

    const handleExportPdf = useCallback(() => {
        const doc = new jsPDF();

        const headers = [
            "Bot",
            "Message",
            "Answer",
            "Reporter",
            "Score",
            "Question",
        ]

        const body = selectedLogsData.map((log) => [
            log.bot,
            log.message,
            log.answer,
            log.reporter,
            log.score,
            log.question,
        ]);

        (doc as any).autoTable({
            head: [headers],
            body: body,
        });

        doc.save("ai_bot_logs.pdf")
    }, [selectedLogsData])

    const pageCount = Math.ceil(filteredAndSortedLogs.length / pageSize)

    const paginatedLogs = useMemo(() => {
        const startIndex = (currentPage - 1) * pageSize
        const endIndex = startIndex + pageSize
        return filteredAndSortedLogs.slice(startIndex, endIndex)
    }, [filteredAndSortedLogs, currentPage, pageSize])

    const handlePageChange = (page: number) => {
        setCurrentPage(page)
    }

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
                        value={scoreFilter}
                        onChange={handleScoreFilterChange}
                        className="px-3 py-2 rounded-md border"
                    >
                        <option value="">All Scores</option>
                        {uniqueScores.map((score) => (
                            <option key={score} value={score}>
                                {score}
                            </option>
                        ))}
                    </select>
                    <select
                        value={reporterFilter}
                        onChange={handleReporterFilterChange}
                        className="px-3 py-2 rounded-md border"
                    >
                        <option value="">All Reporters</option>
                        {uniqueReporters.map((reporter) => (
                            <option key={reporter} value={reporter}>
                                {reporter}
                            </option>
                        ))}
                    </select>
                    {!!selectedLogs.length && <Button onClick={handleExportPdf} disabled={selectedLogs.length === 0}>
                        Export to PDF
                    </Button>}
                </div>
            </div>
            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-12">
                                <input
                                    type="checkbox"
                                    checked={selectedLogs.length === filteredAndSortedLogs.length}
                                    onChange={onSelectAll}
                                    className="rounded border-gray-300"
                                />
                            </TableHead>
                            <TableHead
                                className="cursor-pointer hover:bg-muted"
                                onClick={() => handleSort("bot")}
                            >
                                <div className="flex items-center gap-2">
                                    Bot
                                    <ArrowUpDown className="h-4 w-4" />
                                </div>
                            </TableHead>
                            <TableHead>Message</TableHead>
                            <TableHead>Answer</TableHead>
                            <TableHead
                                className="cursor-pointer hover:bg-muted"
                                onClick={() => handleSort("reporter")}
                            >
                                <div className="flex items-center gap-2">
                                    Reporter
                                    <ArrowUpDown className="h-4 w-4" />
                                </div>
                            </TableHead>
                            <TableHead
                                className="cursor-pointer hover:bg-muted"
                                onClick={() => handleSort("score")}
                            >
                                <div className="flex items-center gap-2">
                                    Score
                                    <ArrowUpDown className="h-4 w-4" />
                                </div>
                            </TableHead>
                            <TableHead>Question</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedLogs.map((log) => (
                            <TableRow key={log.id}>
                                <TableCell>
                                    <input
                                        type="checkbox"
                                        checked={selectedLogs.includes(log.id)}
                                        onChange={() => onToggleSelect?.(log.id)}
                                        className="rounded border-gray-300"
                                    />
                                </TableCell>
                                <TableCell>{log.bot}</TableCell>
                                <TableCell>{log.message}</TableCell>
                                <TableCell>{log.answer}</TableCell>
                                <TableCell>{log.reporter}</TableCell>
                                <TableCell>{log.score}</TableCell>
                                <TableCell>{log.question}</TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        {onPreview && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => onPreview(log)}
                                            >
                                                View Content
                                            </Button>
                                        )}
                                        {onDelete && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => onDelete(log.id)}
                                                className="text-red-500 hover:text-red-700 hover:bg-red-100"
                                            >
                                                Delete
                                            </Button>
                                        )}
                                    </div>
                                </TableCell>
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
