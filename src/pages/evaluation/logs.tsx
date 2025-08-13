import { Button } from "@/components/ui/button"
import { Loader2, Plus, Download, Filter, TrendingUp, TrendingDown } from "lucide-react"
import React from "react"
import { useNavigate } from "react-router-dom"
import { usePermissions } from "@/lib/hooks/usePermissions"
import { useTeamStore } from "@/lib/hooks/useTeam"
import { format } from "date-fns"
import { ColumnDef } from "@tanstack/react-table"
import PaginatedSupabaseTableWrapper from "@/components/ui/PaginatedSupabaseTableWrapper"
import { EnhancedDataTable } from "@/components/ui/enhanced-data-table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

// Define the log data type based on the schema
interface LogData {
  user_id: number
  session_id: string
  agent_id: string
  worker_id: string
  chat_id: string
  model: string
  created_at: string
  user_input: string
  llm_response: string
  search_context: string
    detected_location: string
  detected_image: string
  prompt_tokens: number
  response_tokens: number
  retrieval_tokens: number
  eval_date: string
  safety: number
  relevance_to_query: number
  retrieval_groundedness: number
  retrieval_relevance: number
  bias: number
  empathy: number
  language_tone: string
  avg_latency: number
  cost_per_query: number
  carbon_emissions_per_query: number
}

// Utility for cell color
function getCellColor(value: number) {
  if (value >= 4) return 'bg-green-200 text-green-800';
  if (value >= 3) return 'bg-green-50 text-green-700';
  if (value >= 2) return 'bg-yellow-50 text-yellow-700';
  if (value >= 1) return 'bg-red-100 text-red-700';
  return 'bg-red-200 text-red-800';
}

export function BotLogsTable() {
    const navigate = useNavigate()
    const { canCreate, canUpdate } = usePermissions()
    const { selectedTeam } = useTeamStore()

    // Mock data for logs
    const mockData: LogData[] = [
        {
            user_id: 1,
            session_id: "sess_abc123def456",
            agent_id: "agent_001_helpdesk",
            worker_id: "worker_ai_001",
            chat_id: "chat_20241201_001",
            model: "gpt-4-turbo",
            created_at: "2024-12-01T10:30:00Z",
            user_input: "How do I reset my password?",
            llm_response: "To reset your password, please visit the password reset page and follow the instructions sent to your email.",
            search_context: "password reset documentation",
            detected_location: "United States",
            detected_image: "None",
            prompt_tokens: 45,
            response_tokens: 28,
            retrieval_tokens: 12,
            eval_date: "2024-12-01T10:35:00Z",
            safety: 4.8,
            relevance_to_query: 4.9,
            retrieval_groundedness: 4.7,
            retrieval_relevance: 4.6,
            bias: 1.2,
            empathy: 4.3,
            language_tone: "Professional",
            avg_latency: 1250,
            cost_per_query: 0.0023,
            carbon_emissions_per_query: 0.45
        },
        {
            user_id: 2,
            session_id: "sess_def789ghi012",
            agent_id: "agent_002_support",
            worker_id: "worker_ai_002",
            chat_id: "chat_20241201_002",
            model: "gpt-4-turbo",
            created_at: "2024-12-01T11:15:00Z",
            user_input: "What are the business hours for customer support?",
            llm_response: "Our customer support team is available Monday through Friday, 9 AM to 6 PM EST. For urgent matters outside these hours, please use our emergency contact form.",
            search_context: "business hours support schedule",
            detected_location: "Canada",
            detected_image: "None",
            prompt_tokens: 52,
            response_tokens: 35,
            retrieval_tokens: 8,
            eval_date: "2024-12-01T11:20:00Z",
            safety: 4.9,
            relevance_to_query: 4.8,
            retrieval_groundedness: 4.5,
            retrieval_relevance: 4.7,
            bias: 1.1,
            empathy: 4.1,
            language_tone: "Helpful",
            avg_latency: 980,
            cost_per_query: 0.0018,
            carbon_emissions_per_query: 0.32
        },
        {
            user_id: 3,
            session_id: "sess_jkl345mno678",
            agent_id: "agent_003_sales",
            worker_id: "worker_ai_003",
            chat_id: "chat_20241201_003",
            model: "claude-3-sonnet",
            created_at: "2024-12-01T12:00:00Z",
            user_input: "Can you tell me about your pricing plans?",
            llm_response: "We offer three main pricing tiers: Basic ($29/month), Professional ($79/month), and Enterprise (custom pricing). Each plan includes different features and usage limits.",
            search_context: "pricing plans subscription tiers",
            detected_location: "United Kingdom",
            detected_image: "None",
            prompt_tokens: 38,
            response_tokens: 42,
            retrieval_tokens: 15,
            eval_date: "2024-12-01T12:05:00Z",
            safety: 4.7,
            relevance_to_query: 4.9,
            retrieval_groundedness: 4.8,
            retrieval_relevance: 4.9,
            bias: 1.3,
            empathy: 3.9,
            language_tone: "Informative",
            avg_latency: 1450,
            cost_per_query: 0.0031,
            carbon_emissions_per_query: 0.58
        },
        {
            user_id: 4,
            session_id: "sess_pqr901stu234",
            agent_id: "agent_001_helpdesk",
            worker_id: "worker_ai_001",
            chat_id: "chat_20241201_004",
            model: "gpt-4-turbo",
            created_at: "2024-12-01T13:45:00Z",
            user_input: "I'm having trouble logging into my account",
            llm_response: "I'm sorry to hear you're having login issues. Let's troubleshoot this step by step. First, please try clearing your browser cache and cookies.",
            search_context: "login troubleshooting account access",
            detected_location: "Germany",
            detected_image: "None",
            prompt_tokens: 41,
            response_tokens: 31,
            retrieval_tokens: 10,
            eval_date: "2024-12-01T13:50:00Z",
            safety: 4.6,
            relevance_to_query: 4.7,
            retrieval_groundedness: 4.4,
            retrieval_relevance: 4.5,
            bias: 1.0,
            empathy: 4.5,
            language_tone: "Supportive",
            avg_latency: 1120,
            cost_per_query: 0.0021,
            carbon_emissions_per_query: 0.41
        },
        {
            user_id: 5,
            session_id: "sess_vwx567yza890",
            agent_id: "agent_002_support",
            worker_id: "worker_ai_002",
            chat_id: "chat_20241201_005",
            model: "claude-3-sonnet",
            created_at: "2024-12-01T14:30:00Z",
            user_input: "How do I export my data?",
            llm_response: "You can export your data by going to Settings > Data Export. Choose the format (CSV, JSON, or Excel) and date range, then click 'Export'.",
            search_context: "data export settings documentation",
            detected_location: "Australia",
            detected_image: "None",
            prompt_tokens: 35,
            response_tokens: 38,
            retrieval_tokens: 11,
            eval_date: "2024-12-01T14:35:00Z",
            safety: 4.8,
            relevance_to_query: 4.8,
            retrieval_groundedness: 4.6,
            retrieval_relevance: 4.7,
            bias: 1.1,
            empathy: 4.0,
            language_tone: "Directive",
            avg_latency: 890,
            cost_per_query: 0.0019,
            carbon_emissions_per_query: 0.35
        },
        {
            user_id: 6,
            session_id: "sess_bcd123efg456",
            agent_id: "agent_003_sales",
            worker_id: "worker_ai_003",
            chat_id: "chat_20241201_006",
            model: "gpt-4-turbo",
            created_at: "2024-12-01T15:15:00Z",
            user_input: "What's the difference between your basic and professional plans?",
            llm_response: "The Basic plan includes core features with limited usage, while the Professional plan offers advanced features, higher usage limits, priority support, and API access.",
            search_context: "plan comparison features differences",
            detected_location: "France",
            detected_image: "None",
            prompt_tokens: 48,
            response_tokens: 45,
            retrieval_tokens: 13,
            eval_date: "2024-12-01T15:20:00Z",
            safety: 4.9,
            relevance_to_query: 4.9,
            retrieval_groundedness: 4.7,
            retrieval_relevance: 4.8,
            bias: 1.2,
            empathy: 4.2,
            language_tone: "Comparative",
            avg_latency: 1350,
            cost_per_query: 0.0028,
            carbon_emissions_per_query: 0.52
        },
        {
            user_id: 7,
            session_id: "sess_hij789klm012",
            agent_id: "agent_001_helpdesk",
            worker_id: "worker_ai_001",
            chat_id: "chat_20241201_007",
            model: "claude-3-sonnet",
            created_at: "2024-12-01T16:00:00Z",
            user_input: "My account was charged twice this month",
            llm_response: "I apologize for the billing issue. Let me help you resolve this. Please provide your account number and I'll investigate the duplicate charges immediately.",
            search_context: "billing duplicate charges refund",
            detected_location: "Japan",
            detected_image: "None",
            prompt_tokens: 44,
            response_tokens: 33,
            retrieval_tokens: 9,
            eval_date: "2024-12-01T16:05:00Z",
            safety: 4.7,
            relevance_to_query: 4.8,
            retrieval_groundedness: 4.5,
            retrieval_relevance: 4.6,
            bias: 1.0,
            empathy: 4.6,
            language_tone: "Apologetic",
            avg_latency: 1020,
            cost_per_query: 0.0020,
            carbon_emissions_per_query: 0.38
        },
        {
            user_id: 8,
            session_id: "sess_nop345qrs678",
            agent_id: "agent_002_support",
            worker_id: "worker_ai_002",
            chat_id: "chat_20241201_008",
            model: "gpt-4-turbo",
            created_at: "2024-12-01T16:45:00Z",
            user_input: "How do I integrate your API with my application?",
            llm_response: "To integrate our API, you'll need to obtain an API key from your dashboard, then use our REST API endpoints. We provide SDKs for Python, JavaScript, and other languages.",
            search_context: "API integration documentation SDK",
            detected_location: "Brazil",
            detected_image: "None",
            prompt_tokens: 50,
            response_tokens: 40,
            retrieval_tokens: 14,
            eval_date: "2024-12-01T16:50:00Z",
            safety: 4.8,
            relevance_to_query: 4.9,
            retrieval_groundedness: 4.8,
            retrieval_relevance: 4.9,
            bias: 1.1,
            empathy: 3.8,
            language_tone: "Technical",
            avg_latency: 1580,
            cost_per_query: 0.0032,
            carbon_emissions_per_query: 0.61
        }
    ]

    const columns: ColumnDef<LogData>[] = [
        { 
            id: "user_id", 
            accessorKey: "user_id", 
            header: "User ID", 
            enableResizing: true, 
            enableHiding: true, 
            cell: (info) => (
                <span className="text-xs">
                    {info.getValue() as number}
                </span>
            )
        },
        { 
            id: "session_id", 
            accessorKey: "session_id", 
            header: "Session ID", 
            enableResizing: true, 
            enableHiding: true, 
            cell: (info) => (
                <span className="font-mono text-xs">
                    {String(info.getValue()).substring(0, 8)}...
                </span>
            )
        },
        { 
            id: "agent_id", 
            accessorKey: "agent_id", 
            header: "Agent ID", 
            enableResizing: true, 
            enableHiding: true, 
            cell: (info) => (
                <span className="font-mono text-xs">
                    {String(info.getValue()).substring(0, 8)}...
                </span>
            )
        },
        { 
            id: "worker_id", 
            accessorKey: "worker_id", 
            header: "Worker ID", 
            enableResizing: true, 
            enableHiding: true, 
            cell: (info) => (
                <span className="font-mono text-xs">
                    {String(info.getValue()).substring(0, 8)}...
                </span>
            )
        },
        { 
            id: "chat_id", 
            accessorKey: "chat_id", 
            header: "Chat ID", 
            enableResizing: true, 
            enableHiding: true, 
            cell: (info) => (
                <span className="font-mono text-xs">
                    {String(info.getValue()).substring(0, 8)}...
                </span>
            )
        },
        { 
            id: "model", 
            accessorKey: "model", 
            header: "Model", 
            enableResizing: true, 
            enableHiding: true, 
            enableSorting: true, 
            cell: (info) => (
                <span className="text-xs">
                    {info.getValue() as string}
                </span>
            )
        },
        { 
            id: "created_at", 
            accessorKey: "created_at", 
            header: "Created At", 
            enableResizing: true, 
            enableHiding: true, 
            enableSorting: true, 
            cell: (info) => (
                <span className="text-xs">
                    {format(new Date(info.getValue() as string), "MMM dd, yyyy HH:mm")}
                </span>
            )
        },
        { 
            id: "user_input", 
            accessorKey: "user_input", 
            header: "User Input", 
            enableResizing: true, 
            enableHiding: true, 
            cell: (info) => (
                <div className="max-w-[200px] truncate text-xs" title={info.getValue() as string}>
                    {String(info.getValue()).substring(0, 50)}...
                </div>
            )
        },
        { 
            id: "llm_response", 
            accessorKey: "llm_response", 
            header: "LLM Response", 
            enableResizing: true, 
            enableHiding: true, 
            cell: (info) => (
                <div className="max-w-[200px] truncate text-xs" title={info.getValue() as string}>
                    {String(info.getValue()).substring(0, 50)}...
                </div>
            )
        },
        { 
            id: "search_context", 
            accessorKey: "search_context", 
            header: "Search Context", 
            enableResizing: true, 
            enableHiding: true, 
            cell: (info) => (
                <div className="max-w-[150px] truncate text-xs" title={info.getValue() as string}>
                    {String(info.getValue()).substring(0, 30)}...
                </div>
            )
        },
        { 
            id: "detected_location", 
            accessorKey: "detected_location", 
            header: "Detected Location", 
            enableResizing: true, 
            enableHiding: true, 
            enableSorting: true, 
            cell: (info) => (
                <span className="text-xs">
                    {info.getValue() as string}
                </span>
            )
        },
        { 
            id: "detected_image", 
            accessorKey: "detected_image", 
            header: "Detected Image", 
            enableResizing: true, 
            enableHiding: true, 
            cell: (info) => (
                <span className="text-xs">
                    {info.getValue() as string}
                </span>
            )
        },
        { 
            id: "prompt_tokens", 
            accessorKey: "prompt_tokens", 
            header: "Prompt Tokens", 
            enableResizing: true, 
            enableHiding: true, 
            enableSorting: true, 
            cell: (info) => (
                <span className="text-xs">
                    {info.getValue() as number}
                </span>
            )
        },
        { 
            id: "response_tokens", 
            accessorKey: "response_tokens", 
            header: "Response Tokens", 
            enableResizing: true, 
            enableHiding: true, 
            enableSorting: true, 
            cell: (info) => (
                <span className="text-xs">
                    {info.getValue() as number}
                </span>
            )
        },
        { 
            id: "retrieval_tokens", 
            accessorKey: "retrieval_tokens", 
            header: "Retrieval Tokens", 
            enableResizing: true, 
            enableHiding: true, 
            enableSorting: true, 
            cell: (info) => (
                <span className="text-xs">
                    {info.getValue() as number}
                </span>
            )
        },
        { 
            id: "eval_date", 
            accessorKey: "eval_date", 
            header: "Eval Date", 
            enableResizing: true, 
            enableHiding: true, 
            enableSorting: true, 
            cell: (info) => (
                <span className="text-xs">
                    {format(new Date(info.getValue() as string), "MMM dd, yyyy")}
                </span>
            )
        },
        { 
            id: "safety", 
            accessorKey: "safety", 
            header: "Safety", 
            enableResizing: true, 
            enableHiding: true, 
            enableSorting: true, 
            cell: (info) => {
                const value = info.getValue() as number;
                return (
                    <span className={`text-xs px-2 py-1 rounded ${getCellColor(value)}`}>{value.toFixed(2)}</span>
                );
            }
        },
        { 
            id: "relevance_to_query", 
            accessorKey: "relevance_to_query", 
            header: "Relevance", 
            enableResizing: true, 
            enableHiding: true, 
            enableSorting: true, 
            cell: (info) => {
                const value = info.getValue() as number;
                return (
                    <span className={`text-xs px-2 py-1 rounded ${getCellColor(value)}`}>{value.toFixed(2)}</span>
                );
            }
        },
        { 
            id: "retrieval_groundedness", 
            accessorKey: "retrieval_groundedness", 
            header: "Groundedness", 
            enableResizing: true, 
            enableHiding: true, 
            enableSorting: true, 
            cell: (info) => {
                const value = info.getValue() as number;
                return (
                    <span className={`text-xs px-2 py-1 rounded ${getCellColor(value)}`}>{value.toFixed(2)}</span>
                );
            }
        },
        { 
            id: "retrieval_relevance", 
            accessorKey: "retrieval_relevance", 
            header: "Retrieval Relevance", 
            enableResizing: true, 
            enableHiding: true, 
            enableSorting: true, 
            cell: (info) => {
                const value = info.getValue() as number;
                return (
                    <span className={`text-xs px-2 py-1 rounded ${getCellColor(value)}`}>{value.toFixed(2)}</span>
                );
            }
        },
        { 
            id: "bias", 
            accessorKey: "bias", 
            header: "Bias", 
            enableResizing: true, 
            enableHiding: true, 
            enableSorting: true, 
            cell: (info) => {
                const value = info.getValue() as number;
                return (
                    <span className={`text-xs px-2 py-1 rounded ${getCellColor(value)}`}>{value.toFixed(2)}</span>
                );
            }
        },
        { 
            id: "empathy", 
            accessorKey: "empathy", 
            header: "Empathy", 
            enableResizing: true, 
            enableHiding: true, 
            enableSorting: true, 
            cell: (info) => {
                const value = info.getValue() as number;
                return (
                    <span className={`text-xs px-2 py-1 rounded ${getCellColor(value)}`}>{value.toFixed(2)}</span>
                );
            }
        },
        { 
            id: "language_tone", 
            accessorKey: "language_tone", 
            header: "Language Tone", 
            enableResizing: true, 
            enableHiding: true, 
            cell: (info) => (
                <span className="text-xs">
                    {info.getValue() as string}
                </span>
            )
        },
        { 
            id: "avg_latency", 
            accessorKey: "avg_latency", 
            header: "Avg Latency (ms)", 
            enableResizing: true, 
            enableHiding: true, 
            enableSorting: true, 
            cell: (info) => (
                <span className="text-xs">
                    {`${(info.getValue() as number).toFixed(0)}ms`}
                </span>
            )
        },
        { 
            id: "cost_per_query", 
            accessorKey: "cost_per_query", 
            header: "Cost/Query ($)", 
            enableResizing: true, 
            enableHiding: true, 
            enableSorting: true, 
            cell: (info) => (
                <span className="text-xs">
                    {`$${(info.getValue() as number).toFixed(4)}`}
                </span>
            )
        },
        { 
            id: "carbon_emissions_per_query", 
            accessorKey: "carbon_emissions_per_query", 
            header: "Carbon/Query (g)", 
            enableResizing: true, 
            enableHiding: true, 
            enableSorting: true, 
            cell: (info) => (
                <span className="text-xs">
                    {`${(info.getValue() as number).toFixed(2)}g`}
                </span>
            )
        },
    ]

    const handleEdit = (id: string) => {
        navigate(`/logs/${id}`)
    }

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 p-8 pt-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Logs</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            View and manage your bot interaction logs.
                        </p>
                    </div>
                    <div className="flex gap-2">
                    {canCreate("logs") && (
                            <Button onClick={() => navigate("/logs/new")}>
                                <Plus className="h-4 w-4 mr-2" /> 
                                Add Log
                            </Button>
                        )}
                        <Button variant="outline">
                            <Download className="h-4 w-4 mr-2" />
                            Export
                        </Button>
                        <Button variant="outline">
                            <Filter className="h-4 w-4 mr-2" />
                            Filters
                        </Button>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Logs</CardTitle>
                            <div className="flex items-center gap-1 bg-green-100 text-green-800 px-2 py-1 rounded-md">
                                <TrendingUp className="h-3 w-3" />
                                <span className="text-xs font-medium">+15%</span>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{mockData.length}</div>
                            <p className="text-xs text-muted-foreground">
                                Trending up this month
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Avg Safety Score</CardTitle>
                            <div className="flex items-center gap-1 bg-green-100 text-green-800 px-2 py-1 rounded-md">
                                <TrendingUp className="h-3 w-3" />
                                <span className="text-xs font-medium">+0.2</span>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {(mockData.reduce((sum, item) => sum + item.safety, 0) / mockData.length).toFixed(1)}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Improved safety metrics
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Avg Latency</CardTitle>
                            <div className="flex items-center gap-1 bg-green-100 text-green-800 px-2 py-1 rounded-md">
                                <TrendingDown className="h-3 w-3" />
                                <span className="text-xs font-medium">-20ms</span>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {Math.round(mockData.reduce((sum, item) => sum + item.avg_latency, 0) / mockData.length)}ms
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Faster response times
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
                            <div className="flex items-center gap-1 bg-yellow-100 text-yellow-800 px-2 py-1 rounded-md">
                                <TrendingUp className="h-3 w-3" />
                                <span className="text-xs font-medium">+5%</span>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                ${(mockData.reduce((sum, item) => sum + item.cost_per_query, 0) * 1000).toFixed(0)}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Moderate cost increase
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <EnhancedDataTable
                    columns={columns}
                    data={mockData}
                    searchKey="user_input"
                    searchPlaceholder="Search logs..."
                    onRowClick={(row) => {
                        if (canUpdate("logs")) handleEdit(row.user_id.toString())
                    }}
                    placeholder="No logs found"
                />
            </div>
        </div>
    )
} 