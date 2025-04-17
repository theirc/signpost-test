import { Button } from "@/components/ui/button"
import { useMemo, useCallback } from "react"
import jsPDF from "jspdf"
import "jspdf-autotable"
import { cn } from "@/lib/utils"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { format } from "date-fns"
import { utils, writeFile } from "xlsx"
import { ColumnDef } from "@tanstack/react-table"
import CustomTable from "./ui/custom-table"
import SearchFilter from "./ui/search-filter"
import SelectFilter from "./ui/select-filter"
import DateFilter from "./ui/date-filter"

export type Score = {
    id: string
    created_at?: string
    reporter: string
    score: string
    question: string
    answer: string
    bot: string
    bot_name?: string
    message: string
    category: string
    category_name?: string
    log_id?: string
    bots?: {
        name: string
    }
    service_categories?: {
        name: string
    }
}

interface ScoresTableProps {
    scores: Score[]
    selectedScores?: string[]
    onToggleSelect: (id: string) => void
    onSelectAll: () => void
    onDelete?: (id: string) => void
    onEdit: (id: string) => void
}

export function ScoresTable({
    scores,
    selectedScores = [],
    onToggleSelect,
    onSelectAll,
    onEdit,
    onDelete,
}: ScoresTableProps) {
    const selectedScoresData = useMemo(() =>
        scores.filter((score) => selectedScores.includes(score.id)),
        [scores, selectedScores])

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
            format(new Date(score.created_at), "MMM dd, yyyy")
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
            format(new Date(score.created_at), "MMM dd, yyyy"),
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
        <bot>${score.bot_name}</bot>
        <message>${score.message}</message>
        <answer>${score.answer}</answer>
        <reporter>${score.reporter}</reporter>
        <scor>${score.score}</scor>
        <dateCreated>${format(new Date(score.created_at), "yyyy-MM-dd")}</dateCreated>
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

    const columns: ColumnDef<any>[] = [
        { id: "bot", accessorKey: "bot_name", header: "Bot", enableResizing: true, enableHiding: true, enableSorting: true, cell: (info) => info.getValue() },
        { id: "message", enableResizing: true, enableHiding: true, accessorKey: "message", header: "Message", enableSorting: false, cell: (info) => info.getValue() },
        { id: "answer", enableResizing: true, enableHiding: true, accessorKey: "answer", header: "Answer", enableSorting: false, cell: (info) => info.getValue() },
        { id: "reporter", enableResizing: true, enableHiding: true, accessorKey: "reporter", header: "Reporter", enableSorting: true, cell: (info) => info.getValue() },
        { id: "score", enableResizing: true, enableHiding: true, accessorKey: "score", header: "Score", enableSorting: true, cell: (info) => info.getValue() },
        { id: "question", enableResizing: true, enableHiding: true, accessorKey: "question", header: "Question", enableSorting: false, cell: (info) => info.getValue() },
        { id: "category", enableResizing: true, enableHiding: true, accessorKey: "category_name", header: "Category", enableSorting: true, cell: (info) => info.getValue() },
        { id: "created_at", enableResizing: true, enableHiding: true, accessorKey: "created_at", header: "Date Created", enableSorting: true, cell: (info) => format(new Date(info.getValue() as string), "MMM dd, yyyy") },
    ]

    const filters = [
        {
            id: "search",
            label: "Search",
            component: SearchFilter,
            props: { filterKey: "search", placeholder: "Search scores..." },
        },
        {
            id: "score",
            label: "Score",
            component: SelectFilter,
            props: { filterKey: "score", placeholder: "All Scores" },
        },
        {
            id: "reporter",
            label: "Reporter",
            component: SelectFilter,
            props: { filterKey: "reporter", placeholder: "All Reporters" },
        },
        {
            id: "range",
            label: "Date Created",
            component: DateFilter,
            props: { filterKey: "created_at", placeholder: "Pick a date" },
        },
    ]

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-4">
                <div className="flex items-center gap-4">
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
            <CustomTable
                columns={columns as any}
                data={scores}
                onToggleSelect={onToggleSelect}
                selectedRows={selectedScores}
                onSelectAll={onSelectAll}
                onRowClick={(row) => onEdit(row.id)}
                tableId="scores-table"
                filters={filters}
            />
        </div>
    )
}
