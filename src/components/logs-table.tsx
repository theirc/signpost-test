import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowUpDown, Plus, Search, Tag, X } from "lucide-react"
import { useState, useMemo } from "react"
import { Input } from "@/components/ui/input"

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
}

export function LogsTable({
    logs,
    selectedLogs = [],
    onToggleSelect,
    onSelectAll,
    onPreview,
    onDelete,
}: LogsTableProps) {
    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' }>({
        key: 'id',
        direction: 'desc'
    })
    const [searchTerm, setSearchTerm] = useState("")
    const [scoreFilter, setScoreFilter] = useState<string>("")

    const uniqueScores = useMemo(() => {
        return Array.from(new Set(logs.map(source => source.score)))
    }, [logs])

    const handleSort = (key: string) => {
        setSortConfig(current => ({
            key,
            direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
        }))
    }

    const filteredAndSortedLogs = useMemo(() => {
        return [...logs]
            .filter(source => {
                const matchesSearch = searchTerm === "" ||
                    source.bot.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    source.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    source.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    source.reporter.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    source.score.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    source.question.toLowerCase().includes(searchTerm.toLowerCase())

                const matchesScore = scoreFilter === "" || source.score === scoreFilter


                return matchesSearch && matchesScore
            })
            .sort((a, b) => {
                const aValue = a[sortConfig.key]
                const bValue = b[sortConfig.key]

                if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1
                if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1
                return 0
            })
    }, [logs, searchTerm, scoreFilter, sortConfig])

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-4">
                <div className="flex items-center gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search logs..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-8"
                        />
                    </div>
                    <select
                        value={scoreFilter}
                        onChange={(e) => setScoreFilter(e.target.value)}
                        className="px-3 py-2 rounded-md border"
                    >
                        <option value="">All Scores</option>
                        {uniqueScores.map(score => (
                            <option key={score} value={score}>{score}</option>
                        ))}
                    </select>
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
                                onClick={() => handleSort('bot')}
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
                                onClick={() => handleSort('reporter')}
                            >
                                <div className="flex items-center gap-2">
                                    Reporter
                                    <ArrowUpDown className="h-4 w-4" />
                                </div>
                            </TableHead>
                            <TableHead
                                className="cursor-pointer hover:bg-muted"
                                onClick={() => handleSort('score')}
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
                        {filteredAndSortedLogs.map((source) => (
                            <TableRow key={source.id}>
                                <TableCell>
                                    <input
                                        type="checkbox"
                                        checked={selectedLogs.includes(source.id)}
                                        onChange={() => onToggleSelect?.(source.id)}
                                        className="rounded border-gray-300"
                                    />
                                </TableCell>
                                <TableCell>{source.bot}</TableCell>
                                <TableCell>{source.message}</TableCell>
                                <TableCell>{source.answer}</TableCell>
                                <TableCell>{source.reporter}</TableCell>
                                <TableCell>{source.score}</TableCell>
                                <TableCell>{source.question}</TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        {onPreview && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => onPreview(source)}
                                            >
                                                View Content
                                            </Button>
                                        )}
                                        {onDelete && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => onDelete(source.id)}
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
        </div>
    )
} 