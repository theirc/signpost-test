import { Button } from "@/components/ui/button"
import { Loader2, Plus } from "lucide-react"
import React, { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { usePermissions } from "@/lib/hooks/usePermissions"
import { useTeamStore } from "@/lib/hooks/useTeam"
import { format } from "date-fns"
import DateFilter from "@/components/ui/date-filter"
import SearchFilter from "@/components/ui/search-filter"
import SelectFilter from "@/components/ui/select-filter"
import { ColumnDef } from "@tanstack/react-table"
import jsPDF from "jspdf"
import { utils, writeFile } from "xlsx"
import CustomTable from "@/components/ui/custom-table"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { useSupabase } from "@/hooks/use-supabase"


export function BotScoresTable() {
    const navigate = useNavigate()
    const { canCreate, canUpdate } = usePermissions()
    const { selectedTeam } = useTeamStore()
    const [scores, setScores] = useState([])
    const [selectedScores, setSelectedScores] = React.useState<string[]>([])
    const [isLoading, setIsLoading] = useState(false)

    const selectedScoresData = useMemo(() =>
        scores.filter((score) => selectedScores.includes(score.id)),
        [scores, selectedScores])

    const fetchScores = async () => {
        setIsLoading(true)
        const { data, error } = await useSupabase().from('bot_scores').select(`
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
            console.error('Error fetching bot scores:', error)
        }

        const formattedScores = data.map(score => ({
            ...score,
            bot_name: score.bots?.name,
            category_name: score.service_categories?.name,
            created_at: score.created_at || new Date().toISOString()
        }))
        setScores(formattedScores)
        setIsLoading(false)
    }

    const columns: ColumnDef<any>[] = [
        { id: "id", accessorKey: "id", header: "ID", enableResizing: true, enableHiding: true, cell: (info) => info.getValue() },
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

    const handleEdit = (id: string) => {
        navigate(`/scores/${id}`)
    }

    const handleToggleSelect = (id: string) => {
        setSelectedScores(prev =>
            prev.includes(id)
                ? prev.filter(scoreId => scoreId !== id)
                : [...prev, id]
        )
    }

    const handleSelectAll = () => {
        setSelectedScores(prev => prev.length === scores.length ? [] : scores.map(score => score.id))
    }


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

    useEffect(() => {
        fetchScores()
    }, [selectedTeam])

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 space-y-4 p-8 pt-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Scores</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            View and manage your bot evaluation scores.
                        </p>

                    </div>
                    {canCreate("scores") && (
                        <Button onClick={() => navigate("/scores/new")}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Score
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
                                    {!!selectedScores.length && <Popover>
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
                                data={scores}
                                onToggleSelect={handleToggleSelect}
                                selectedRows={selectedScores}
                                onSelectAll={handleSelectAll}
                                onRowClick={(row) => {
                                    canUpdate("scores") ? handleEdit(row.id) : undefined
                                }}
                                tableId="scores-table"
                                filters={filters}
                            />
                            <div className="flex justify-between items-center mt-4">
                                <div className="text-sm text-muted-foreground">
                                    {selectedScores.length} scores selected
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div >
    )
} 