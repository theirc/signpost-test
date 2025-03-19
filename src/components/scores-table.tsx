import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from "@/components/ui/table"
import { ArrowUpDown, MoreHorizontal, Pencil, Search, Trash } from "lucide-react"
import { useState, useMemo, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, } from "@/components/ui/pagination"
import jsPDF from "jspdf"
import "jspdf-autotable"
import { cn } from "@/lib/utils"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { utils, writeFile } from "xlsx"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu"

export type Score = {
    id: string
    bot: string
    message: string
    answer: string
    reporter: string
    score: string
    question: string
    category: string
    date_created: string
}

interface ScoresTableProps {
    scores: Score[]
    selectedScores?: string[]
    onToggleSelect?: (id: string) => void
    onSelectAll?: (event: React.ChangeEvent<HTMLInputElement>) => void
    onPreview?: (source: Score) => void
    onDelete?: (id: string) => void
    pageSize?: number
}

const defaultPageSize = 10

export function ScoresTable({
    scores,
    selectedScores = [],
    onToggleSelect,
    onSelectAll,
    onPreview,
    onDelete,
    pageSize = defaultPageSize,
}: ScoresTableProps) {
    const [sortConfig, setSortConfig] = useState<{ key: keyof Score; direction: "asc" | "desc" }>({
        key: "date_created",
        direction: "desc",
    })
    const [searchTerm, setSearchTerm] = useState("")
    const [scoreFilter, setScoreFilter] = useState<string>("")
    const [reporterFilter, setReporterFilter] = useState<string>("")
    const [dateRange, setDateRange] = useState<
        { from: Date | null; to: Date | null } | undefined
    >(undefined)
    const [currentPage, setCurrentPage] = useState(1)

    const uniqueScores = useMemo(() => Array.from(new Set(scores.map((score) => score.score))), [scores])

    const uniqueReporters = useMemo(() => Array.from(new Set(scores.map((score) => score.reporter))), [scores])

    const handleSort = useCallback((key: keyof Score) => {
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

    const filteredAndSortedScores = useMemo(() => {
        const searchTermLower = searchTerm.toLowerCase()

        return scores.filter((score) => {
            const matchesSearch =
                searchTerm === "" ||
                score.bot.toLowerCase().includes(searchTermLower) ||
                score.message.toLowerCase().includes(searchTermLower) ||
                score.answer.toLowerCase().includes(searchTermLower) ||
                score.reporter.toLowerCase().includes(searchTermLower) ||
                score.score.toLowerCase().includes(searchTermLower) ||
                score.question.toLowerCase().includes(searchTermLower)

            const matchesScore = scoreFilter === "" || score.score === scoreFilter
            const matchesReporter = reporterFilter === "" || score.reporter === reporterFilter
            let matchesDateRange = true

            if (dateRange?.from && dateRange?.to) {
                const scoreDate = new Date(score.date_created)
                const fromDate = new Date(dateRange.from)
                const toDate = new Date(dateRange.to)
                fromDate.setHours(0, 0, 0, 0)
                toDate.setHours(23, 59, 59, 999)
                matchesDateRange = scoreDate >= fromDate && scoreDate <= toDate
            } else if (dateRange?.from) {
                const scoreDate = new Date(score.date_created)
                const fromDate = new Date(dateRange.from)
                fromDate.setHours(0, 0, 0, 0)
                matchesDateRange = scoreDate >= fromDate
            } else if (dateRange?.to) {
                const scoreDate = new Date(score.date_created)
                const toDate = new Date(dateRange.to)
                toDate.setHours(23, 59, 59, 999)
                matchesDateRange = scoreDate <= toDate
            }

            return matchesSearch && matchesScore && matchesReporter && matchesDateRange
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
    }, [scores, searchTerm, scoreFilter, sortConfig, reporterFilter, dateRange])

    const selectedScoresData = useMemo(() =>
        filteredAndSortedScores.filter((score) => selectedScores.includes(score.id)),
        [filteredAndSortedScores, selectedScores])

    const handleExportPdf = useCallback(() => {
        const doc = new jsPDF()

        const headers = [
            "Bot",
            "Message",
            "Answer",
            "Reporter",
            "Score",
            "Date Created",
        ]

        const body = selectedScoresData.map((score) => [
            score.bot,
            score.message,
            score.answer,
            score.reporter,
            score.score,
            format(new Date(score.date_created), "MMM dd, yyyy")
        ]);

        (doc as any).autoTable({
            head: [headers],
            body: body,
        })

        doc.save("ai_bot_scores.pdf")
    }, [selectedScoresData])

    const handleExportExcel = useCallback(() => {
        const headers = ["Bot", "Message", "Answer", "Reporter", "Score", "Date Created"]
        const data = selectedScoresData.map((score) => [
            score.bot,
            score.message,
            score.answer,
            score.reporter,
            score.score,
            format(new Date(score.date_created), "MMM dd, yyyy"),
        ])

        const worksheet = utils.aoa_to_sheet([headers, ...data])
        const workbook = utils.book_new()
        utils.book_append_sheet(workbook, worksheet, "Scores")
        writeFile(workbook, "ai_bot_scores.xlsx")
    }, [selectedScoresData])

    const handleExportJson = useCallback(() => {
        const json = JSON.stringify(selectedScoresData, null, 2)
        const blob = new Blob([json], { type: "application/json" })
        const link = document.createElement("a")
        link.href = URL.createObjectURL(blob)
        link.download = "ai_bot_scores.json"
        link.click()
    }, [selectedScoresData])

    const handleExportXml = useCallback(() => {
        const xml = `<scores>\n${selectedScoresData
            .map(
                (score) => `
    <score>
        <bot>${score.bot}</bot>
        <message>${score.message}</message>
        <answer>${score.answer}</answer>
        <reporter>${score.reporter}</reporter>
        <scor>${score.score}</scor>
        <dateCreated>${format(new Date(score.date_created), "yyyy-MM-dd")}</dateCreated>
    </score>`
            )
            .join("\n")}
</scores>`

        const blob = new Blob([xml], { type: "application/xml" })
        const link = document.createElement("a")
        link.href = URL.createObjectURL(blob)
        link.download = "ai_bot_scores.xml"
        link.click()
    }, [selectedScoresData])

    const pageCount = Math.ceil(filteredAndSortedScores.length / pageSize)

    const paginatedScores = useMemo(() => {
        const startIndex = (currentPage - 1) * pageSize
        const endIndex = startIndex + pageSize
        return filteredAndSortedScores.slice(startIndex, endIndex)
    }, [filteredAndSortedScores, currentPage, pageSize])

    const handlePageChange = (page: number) => {
        setCurrentPage(page)
    }

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

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-4">
                <div className="flex items-center gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search scores..."
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
                    {!!selectedScores.length && <Popover>
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
            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-12">
                                <input
                                    type="checkbox"
                                    checked={selectedScores.length === filteredAndSortedScores.length}
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
                            <TableHead
                                className="cursor-pointer hover:bg-muted"
                                onClick={() => handleSort("date_created")}
                            >
                                <div className="flex items-center gap-2">
                                    Date Created
                                    <ArrowUpDown className="h-4 w-4" />
                                </div>
                            </TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedScores.map((score) => (
                            <TableRow key={score.id}>
                                <TableCell>
                                    <input
                                        type="checkbox"
                                        checked={selectedScores.includes(score.id)}
                                        onChange={() => onToggleSelect?.(score.id)}
                                        className="rounded border-gray-300"
                                    />
                                </TableCell>
                                <TableCell>{score.bot}</TableCell>
                                <TableCell>{score.message}</TableCell>
                                <TableCell>{score.answer}</TableCell>
                                <TableCell>{score.reporter}</TableCell>
                                <TableCell>{score.score}</TableCell>
                                <TableCell>{format(new Date(score.date_created), "MMM dd, yyyy")}</TableCell>
                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="sm">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem>
                                                <Pencil className="h-4 w-4 mr-2" />
                                                Edit
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="text-red-500 focus:text-red-500">
                                                <Trash className="h-4 w-4 mr-2" />
                                                Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
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
