import { Button } from "@/components/ui/button"
import { Plus, Download, Filter, TrendingUp, TrendingDown } from "lucide-react"
import React from "react"
import { useNavigate } from "react-router-dom"
import { usePermissions } from "@/lib/hooks/usePermissions"
import { useTeamStore } from "@/lib/hooks/useTeam"
import { format } from "date-fns"
import { ColumnDef } from "@tanstack/react-table"
import PaginatedSupabaseTableWrapper from "@/components/ui/PaginatedSupabaseTableWrapper"
import { EnhancedDataTable } from "@/components/ui/enhanced-data-table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/agents/db"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

function getCellColor(value: number) {
	if (value >= 4) return "bg-green-200 text-green-800"
	if (value >= 3) return "bg-green-50 text-green-700"
	if (value >= 2) return "bg-yellow-50 text-yellow-700"
	if (value >= 1) return "bg-red-100 text-red-700"
	return "bg-red-200 text-red-800"
}

export function BotScoresTable() {
    const navigate = useNavigate()
    const { canCreate, canUpdate } = usePermissions()
    const { selectedTeam } = useTeamStore()

    const { data: totalScores = 0 } = useQuery({
        queryKey: ["bot_scores_count", selectedTeam?.id],
        queryFn: async () => {
            const { count } = await supabase.from("bot_scores").select("*", { count: "exact", head: true }).eq("team_id", selectedTeam?.id || null)
            return count || 0
        },
        enabled: !!selectedTeam,
        staleTime: 1000 * 60 * 5,
    })

    const { data: avgScore = 0 } = useQuery({
        queryKey: ["bot_scores_avg", selectedTeam?.id],
        queryFn: async () => {
            const { data } = await supabase.from("bot_scores").select("score").eq("team_id", selectedTeam?.id || null).limit(1000)
            if (!data || data.length === 0) return 0
            const sum = data.reduce((acc: number, row: any) => acc + (Number(row.score) || 0), 0)
            return sum / data.length
        },
        enabled: !!selectedTeam,
        staleTime: 1000 * 60 * 5,
    })

	const [isDetailOpen, setIsDetailOpen] = React.useState(false)
	const [selectedRow, setSelectedRow] = React.useState<any | null>(null)

	// Fallback demo data (10 rows) when there are no scores yet
	const sampleData = React.useMemo(() => {
		const models = ["gpt-4-turbo", "gpt-4", "claude-3-sonnet", "gemini-pro"]
		const prompts = [
			"How do I reset my password?",
			"What are your pricing tiers?",
			"How can I export my data?",
			"Explain API rate limits",
			"Where is my order?",
			"How to change my email?",
			"Do you support SSO?",
			"Refund policy details",
			"Integrate with Slack",
			"Troubleshoot login issues",
		]
		return Array.from({ length: 10 }).map((_, i) => {
			const created = new Date(Date.now() - i * 86400000)
			const rand = (min: number, max: number) => Math.random() * (max - min) + min
			return {
				user_id: 100 + i,
				session_id: `sess_demo_${(i + 1).toString().padStart(3, '0')}`,
				agent_id: `agent_demo_${(i % 3) + 1}`,
				worker_id: `worker_demo_${(i % 4) + 1}`,
				chat_id: `chat_demo_${(i + 1).toString().padStart(3, '0')}`,
				model: models[i % models.length],
				created_at: created.toISOString(),
				user_input: prompts[i % prompts.length],
				llm_response: "Demo response for sample data.",
				search_context: "demo",
				prompt_tokens: Math.floor(rand(30, 80)),
				response_tokens: Math.floor(rand(20, 70)),
				retrieval_tokens: Math.floor(rand(5, 20)),
				eval_date: created.toISOString(),
				safety: rand(0.5, 4.9),
				relevance_to_query: rand(1.5, 4.9),
				retrieval_groundedness: rand(0.2, 4.8),
				retrieval_relevance: rand(1.0, 4.9),
				bias: rand(0.5, 1.8),
				empathy: rand(2.0, 4.8),
				language_tone: "Neutral",
				avg_latency: Math.floor(rand(600, 1800)),
				cost_per_query: Number(rand(0.0015, 0.004).toFixed(4)),
				carbon_emissions_per_query: Number(rand(0.2, 0.8).toFixed(2)),
			}
		})
	}, [])

    const columns: ColumnDef<any>[] = [
        { id: "user_id", header: "User ID", accessorKey: "user_id", enableResizing: true, enableHiding: true, cell: (info) => <span className="text-xs">{String(info.getValue() ?? '-') }</span> },
        { id: "session_id", header: "Session ID", accessorKey: "session_id", enableResizing: true, enableHiding: true, cell: (info) => <span className="font-mono text-xs">{String(info.getValue() || '').substring(0,8)}...</span> },
        { id: "agent_id", header: "Agent ID", accessorFn: (row) => row.agent_id ?? row.bot_name ?? '-', enableResizing: true, enableHiding: true, cell: (info) => <span className="font-mono text-xs">{String(info.getValue() || '').substring(0,8)}...</span> },
        { id: "worker_id", header: "Worker ID", accessorKey: "worker_id", enableResizing: true, enableHiding: true, cell: (info) => <span className="font-mono text-xs">{String(info.getValue() || '').substring(0,8)}...</span> },
        { id: "chat_id", header: "Chat ID", accessorKey: "chat_id", enableResizing: true, enableHiding: true, cell: (info) => <span className="font-mono text-xs">{String(info.getValue() || '').substring(0,8)}...</span> },
        { id: "model", header: "Model", accessorKey: "model", enableResizing: true, enableHiding: true, enableSorting: true, cell: (info) => <span className="text-xs">{String(info.getValue() || '-') }</span> },
        { id: "created_at", header: "Created At", accessorKey: "created_at", enableResizing: true, enableHiding: true, enableSorting: true, cell: (info) => <span className="text-xs">{format(new Date(info.getValue() as string), "MMM dd, yyyy HH:mm")}</span> },
        { id: "user_input", header: "User Input", accessorFn: (row) => row.user_input ?? row.question ?? row.message ?? '', enableResizing: true, enableHiding: true, cell: (info) => <div className="max-w-[200px] truncate text-xs" title={info.getValue() as string}>{String(info.getValue() || '').substring(0,50)}...</div> },
        { id: "llm_response", header: "LLM Response", accessorFn: (row) => row.llm_response ?? row.answer ?? '', enableResizing: true, enableHiding: true, cell: (info) => <div className="max-w-[200px] truncate text-xs" title={info.getValue() as string}>{String(info.getValue() || '').substring(0,50)}...</div> },
        { id: "search_context", header: "Search Context", accessorFn: (row) => row.search_context ?? row.category_name ?? '', enableResizing: true, enableHiding: true, cell: (info) => <div className="max-w-[150px] truncate text-xs" title={info.getValue() as string}>{String(info.getValue() || '').substring(0,30)}...</div> },
        { id: "prompt_tokens", header: "Prompt Tokens", accessorKey: "prompt_tokens", enableResizing: true, enableHiding: true, enableSorting: true, cell: (info) => <span className="text-xs">{String(info.getValue() ?? '-') }</span> },
        { id: "response_tokens", header: "Response Tokens", accessorKey: "response_tokens", enableResizing: true, enableHiding: true, enableSorting: true, cell: (info) => <span className="text-xs">{String(info.getValue() ?? '-') }</span> },
        { id: "retrieval_tokens", header: "Retrieval Tokens", accessorKey: "retrieval_tokens", enableResizing: true, enableHiding: true, enableSorting: true, cell: (info) => <span className="text-xs">{String(info.getValue() ?? '-') }</span> },
        { id: "eval_date", header: "Eval Date", accessorKey: "eval_date", enableResizing: true, enableHiding: true, enableSorting: true, cell: (info) => <span className="text-xs">{info.getValue() ? format(new Date(info.getValue() as string), "MMM dd, yyyy") : '-'}</span> },
        { id: "safety", header: "Safety", accessorFn: (row) => row.safety ?? row.score ?? null, enableResizing: true, enableHiding: true, enableSorting: true, cell: (info) => { const v = Number(info.getValue()); return isNaN(v) ? <span className="text-xs">-</span> : <span className={`text-xs px-2 py-1 rounded ${getCellColor(v)}`}>{v.toFixed(2)}</span> } },
        { id: "relevance_to_query", header: "Relevance", accessorKey: "relevance_to_query", enableResizing: true, enableHiding: true, enableSorting: true, cell: (info) => { const v = Number(info.getValue()); return isNaN(v) ? <span className="text-xs">-</span> : <span className={`text-xs px-2 py-1 rounded ${getCellColor(v)}`}>{v.toFixed(2)}</span> } },
        { id: "retrieval_groundedness", header: "Groundedness", accessorKey: "retrieval_groundedness", enableResizing: true, enableHiding: true, enableSorting: true, cell: (info) => { const v = Number(info.getValue()); return isNaN(v) ? <span className="text-xs">-</span> : <span className={`text-xs px-2 py-1 rounded ${getCellColor(v)}`}>{v.toFixed(2)}</span> } },
        { id: "retrieval_relevance", header: "Retrieval Relevance", accessorKey: "retrieval_relevance", enableResizing: true, enableHiding: true, enableSorting: true, cell: (info) => { const v = Number(info.getValue()); return isNaN(v) ? <span className="text-xs">-</span> : <span className={`text-xs px-2 py-1 rounded ${getCellColor(v)}`}>{v.toFixed(2)}</span> } },
        { id: "bias", header: "Bias", accessorKey: "bias", enableResizing: true, enableHiding: true, enableSorting: true, cell: (info) => { const v = Number(info.getValue()); return isNaN(v) ? <span className="text-xs">-</span> : <span className={`text-xs px-2 py-1 rounded ${getCellColor(v)}`}>{v.toFixed(2)}</span> } },
        { id: "empathy", header: "Empathy", accessorKey: "empathy", enableResizing: true, enableHiding: true, enableSorting: true, cell: (info) => { const v = Number(info.getValue()); return isNaN(v) ? <span className="text-xs">-</span> : <span className={`text-xs px-2 py-1 rounded ${getCellColor(v)}`}>{v.toFixed(2)}</span> } },
        { id: "language_tone", header: "Language Tone", accessorKey: "language_tone", enableResizing: true, enableHiding: true, cell: (info) => <span className="text-xs">{String(info.getValue() || '-') }</span> },
        { id: "avg_latency", header: "Avg Latency (ms)", accessorKey: "avg_latency", enableResizing: true, enableHiding: true, enableSorting: true, cell: (info) => <span className="text-xs">{info.getValue() ? `${Number(info.getValue()).toFixed(0)}ms` : '-'}</span> },
        { id: "cost_per_query", header: "Cost/Query ($)", accessorKey: "cost_per_query", enableResizing: true, enableHiding: true, enableSorting: true, cell: (info) => <span className="text-xs">{info.getValue() ? `$${Number(info.getValue()).toFixed(4)}` : '-'}</span> },
        { id: "carbon_emissions_per_query", header: "Carbon/Query (g)", accessorKey: "carbon_emissions_per_query", enableResizing: true, enableHiding: true, enableSorting: true, cell: (info) => <span className="text-xs">{info.getValue() ? `${Number(info.getValue()).toFixed(2)}g` : '-'}</span> },
    ]

    const handleEdit = (id: string) => {
        navigate(`/scores/${id}`)
    }

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 p-8 pt-6">
                <div className="relative mb-6 overflow-hidden rounded-2xl border bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6">
                    <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-indigo-200/40 blur-3xl"></div>
                    <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-purple-200/40 blur-3xl"></div>
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Scores</h1>
                            <p className="text-sm text-muted-foreground mt-1">View and manage your bot evaluation scores.</p>
                            <div className="mt-3 flex flex-wrap gap-2">
                                <Badge variant="secondary" className="rounded-full">{totalScores} scores</Badge>
                                <Badge variant="secondary" className="rounded-full">Avg score {avgScore ? avgScore.toFixed(1) : "0.0"}</Badge>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {canCreate("scores") && (
                                <Button onClick={() => navigate("/scores/new")}> <Plus className="h-4 w-4 mr-2" /> Add Score </Button>
                            )}
                            <Button variant="outline" className="rounded-full"><Download className="h-4 w-4 mr-2" />Export</Button>
                            <Button variant="outline" className="rounded-full"><Filter className="h-4 w-4 mr-2" />Filters</Button>
                        </div>
                    </div>
                </div>
				{totalScores === 0 ? (
					<EnhancedDataTable
						columns={columns}
						data={sampleData}
						searchKey="user_input"
						searchPlaceholder="Search..."
						onRowClick={(row) => {
							setSelectedRow(row)
							setIsDetailOpen(true)
						}}
						placeholder="No scores found"
					/>
				) : (
					<PaginatedSupabaseTableWrapper
						table="bot_scores"
						columns={columns}
						tableComponent={EnhancedDataTable}
						filters={{ team_id: selectedTeam?.id }}
						searchKey="user_input"
						onRowClick={(row) => {
							setSelectedRow(row)
							setIsDetailOpen(true)
						}}
						placeholder="No scores found"
					/>
				)}

				<Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
					<DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
						<DialogHeader>
							<DialogTitle>Score Details</DialogTitle>
							<DialogDescription>Detailed information from the selected row</DialogDescription>
						</DialogHeader>
						{selectedRow && (
							<div className="space-y-6 py-4">
								<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
									<div className="space-y-2">
										<Label className="text-sm font-medium">User ID</Label>
										<div className="text-sm">{selectedRow.user_id ?? '-'}</div>
									</div>
									<div className="space-y-2">
										<Label className="text-sm font-medium">Session ID</Label>
										<div className="text-sm font-mono">{selectedRow.session_id ?? '-'}</div>
									</div>
									<div className="space-y-2">
										<Label className="text-sm font-medium">Agent ID</Label>
										<div className="text-sm font-mono">{selectedRow.agent_id ?? '-'}</div>
									</div>
									<div className="space-y-2">
										<Label className="text-sm font-medium">Worker ID</Label>
										<div className="text-sm font-mono">{selectedRow.worker_id ?? '-'}</div>
									</div>
									<div className="space-y-2">
										<Label className="text-sm font-medium">Chat ID</Label>
										<div className="text-sm font-mono">{selectedRow.chat_id ?? '-'}</div>
									</div>
									<div className="space-y-2">
										<Label className="text-sm font-medium">Model</Label>
										<div className="text-sm">{selectedRow.model ?? '-'}</div>
									</div>
									<div className="space-y-2">
										<Label className="text-sm font-medium">Created At</Label>
										<div className="text-sm">{selectedRow.created_at ? format(new Date(selectedRow.created_at), "MMM dd, yyyy HH:mm:ss") : '-'}</div>
									</div>
									<div className="space-y-2">
										<Label className="text-sm font-medium">Evaluation Date</Label>
										<div className="text-sm">{selectedRow.eval_date ? format(new Date(selectedRow.eval_date), "MMM dd, yyyy HH:mm:ss") : '-'}</div>
									</div>
									<div className="space-y-2">
										<Label className="text-sm font-medium">Language Tone</Label>
										<div className="text-sm">{selectedRow.language_tone ?? '-'}</div>
									</div>
								</div>

								<div className="space-y-4">
									<div className="space-y-2">
										<Label className="text-sm font-medium">User Input</Label>
										<div className="p-3 bg-gray-50 rounded-md text-sm">{selectedRow.user_input ?? '-'}</div>
									</div>
									<div className="space-y-2">
										<Label className="text-sm font-medium">LLM Response</Label>
										<div className="p-3 bg-gray-50 rounded-md text-sm">{selectedRow.llm_response ?? '-'}</div>
									</div>
									<div className="space-y-2">
										<Label className="text-sm font-medium">Search Context</Label>
										<div className="p-3 bg-gray-50 rounded-md text-sm">{selectedRow.search_context ?? '-'}</div>
									</div>
								</div>

								<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
									<div className="space-y-2">
										<Label className="text-sm font-medium">Prompt Tokens</Label>
										<div className="text-sm">{selectedRow.prompt_tokens ?? '-'}</div>
									</div>
									<div className="space-y-2">
										<Label className="text-sm font-medium">Response Tokens</Label>
										<div className="text-sm">{selectedRow.response_tokens ?? '-'}</div>
									</div>
									<div className="space-y-2">
										<Label className="text-sm font-medium">Retrieval Tokens</Label>
										<div className="text-sm">{selectedRow.retrieval_tokens ?? '-'}</div>
									</div>
								</div>

								<div className="space-y-4">
									<Label className="text-sm font-medium">Evaluation Metrics</Label>
									<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
										{[{
											label: 'Safety', key: 'safety', color: 'bg-green-500'
										}, { label: 'Relevance', key: 'relevance_to_query', color: 'bg-blue-500' }, { label: 'Groundedness', key: 'retrieval_groundedness', color: 'bg-purple-500' }, { label: 'Retrieval Relevance', key: 'retrieval_relevance', color: 'bg-orange-500' }, { label: 'Bias', key: 'bias', color: 'bg-red-500' }, { label: 'Empathy', key: 'empathy', color: 'bg-pink-500' }].map(m => (
											<div key={m.key} className="space-y-2">
												<Label className="text-sm font-medium">{m.label}</Label>
												<div className="flex items-center space-x-2">
													<div className="w-20 bg-gray-200 rounded-full h-2">
														<div className={`${m.color} h-2 rounded-full`} style={{ width: `${(Number(selectedRow[m.key]) || 0) * 20}%` }}></div>
													</div>
													<span className="text-sm">{(Number(selectedRow[m.key]) || 0).toFixed(2)}</span>
												</div>
											</div>
										))}
									</div>
								</div>

								<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
									<div className="space-y-2">
										<Label className="text-sm font-medium">Average Latency</Label>
										<div className="text-sm">{selectedRow.avg_latency ? `${Number(selectedRow.avg_latency).toFixed(0)}ms` : '-'}</div>
									</div>
									<div className="space-y-2">
										<Label className="text-sm font-medium">Cost per Query</Label>
										<div className="text-sm">{selectedRow.cost_per_query != null ? `$${Number(selectedRow.cost_per_query).toFixed(4)}` : '-'}</div>
									</div>
									<div className="space-y-2">
										<Label className="text-sm font-medium">Carbon Emissions</Label>
										<div className="text-sm">{selectedRow.carbon_emissions_per_query != null ? `${Number(selectedRow.carbon_emissions_per_query).toFixed(2)}g` : '-'}</div>
									</div>
								</div>
							</div>
						)}
					</DialogContent>
				</Dialog>
            </div>
        </div>
    )
} 