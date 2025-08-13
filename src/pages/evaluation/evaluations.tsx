import { Button } from "@/components/ui/button"
import { Loader2, Plus, Download, Filter, Settings, Play, FileText, BarChart3, Users, TrendingUp, TrendingDown, Shield, Target, BookOpen, Scale, Heart, Zap, DollarSign, Leaf, GitBranch } from "lucide-react"
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
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/agents/db"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { MultiSelect } from "@/components/ui/multi-select"

// Utility for cell color
function getCellColor(value: number) {
  if (value >= 4) return 'bg-green-200 text-green-800';
  if (value >= 3) return 'bg-green-50 text-green-700';
  if (value >= 2) return 'bg-yellow-50 text-yellow-700';
  if (value >= 1) return 'bg-red-100 text-red-700';
  return 'bg-red-200 text-red-800';
}

// Utility for A/B test comparison color
function getComparisonColor(baselineValue: number, variantValue: number, isLowerBetter: boolean = false) {
  const difference = variantValue - baselineValue;
  const isVariantBetter = isLowerBetter ? difference < 0 : difference > 0;
  
  if (isVariantBetter) {
    return 'bg-green-100 text-green-800 border-green-200';
  } else if (difference === 0) {
    return 'bg-gray-100 text-gray-800 border-gray-200';
  } else {
    return 'bg-red-100 text-red-800 border-red-200';
  }
}

// Define the evaluation data type based on the schema
interface EvaluationData {
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

interface ABTestConfig {
  id: string
  name: string
  description: string
  baseline: {
    type: 'agent' | 'model'
    id: string
    name: string
    model?: string
  }
  variant: {
    type: 'agent' | 'model'
    id: string
    name: string
    model?: string
  }
  testCases: string[]
  metrics: {
    safety: boolean
    relevance: boolean
    groundedness: boolean
    bias: boolean
    empathy: boolean
    latency: boolean
    cost: boolean
    carbon: boolean
    human_preference: boolean
  }
  batchSize: number
  autoRun: boolean
  status: 'draft' | 'running' | 'completed' | 'failed'
  created_at: string
  completed_at?: string
}

interface ABTestResult {
  test_id: string
  test_case: string
  baseline_response: {
    response: string
    metrics: {
      safety: number
      relevance: number
      groundedness: number
      bias: number
      empathy: number
      latency: number
      cost: number
      carbon: number
    }
    tokens: {
      input: number
      output: number
    }
  }
  variant_response: {
    response: string
    metrics: {
      safety: number
      relevance: number
      groundedness: number
      bias: number
      empathy: number
      latency: number
      cost: number
      carbon: number
    }
    tokens: {
      input: number
      output: number
    }
  }
  human_preference?: 'baseline' | 'variant' | 'tie'
  winner?: 'baseline' | 'variant' | 'tie'
  created_at: string
}

interface EvaluationSchedule {
  id: string
  name: string
  description: string
  selectedAgents: string[]
  runtime: 'daily' | 'weekly' | 'manual'
  lastRun?: string
  nextRun?: string
  status: 'active' | 'paused' | 'completed'
  created_at: string
}

export function EvaluationsTable() {
    const navigate = useNavigate()
    const { canCreate, canUpdate } = usePermissions()
    const { selectedTeam } = useTeamStore()
    
    // State for dialog visibility
    const [isDialogOpen, setIsDialogOpen] = React.useState(false)
    const [evalTab, setEvalTab] = React.useState<'batch' | 'abtest'>('batch')
    
    // State for row detail popover
    const [selectedEvaluation, setSelectedEvaluation] = React.useState<EvaluationData | null>(null)
    const [isDetailOpen, setIsDetailOpen] = React.useState(false)
    const [detailSchedule, setDetailSchedule] = React.useState<EvaluationSchedule | null>(null)
    const [detailConfig, setDetailConfig] = React.useState({
        name: "",
        description: "",
        model: "gpt-4-turbo",
        selectedAgents: [] as string[],
        runtime: 'manual' as 'daily' | 'weekly' | 'manual',
        batchSize: 10,
        autoRun: false,
        metrics: {
            safety: true,
            relevance: true,
            groundedness: true,
            bias: true,
            empathy: true,
            latency: true,
            cost: true,
            carbon: true,
        },
    })

    // Dashboard state for detail dialog
    const [dashboardMetric, setDashboardMetric] = React.useState<'safety' | 'relevance_to_query' | 'avg_latency' | 'cost_per_query'>('safety')
    const [dashboardQuery, setDashboardQuery] = React.useState("")
    const [dashboardAnswer, setDashboardAnswer] = React.useState("")

    React.useEffect(() => {
        if (!selectedEvaluation) return
        setDetailConfig(prev => ({
            ...prev,
            model: selectedEvaluation.model || prev.model,
            name: prev.name || "",
            description: prev.description || "",
        }))
    }, [selectedEvaluation])
    
    // State for evaluation experiment configuration
    const [experimentConfig, setExperimentConfig] = React.useState({
        name: "",
        description: "",
        model: "gpt-4-turbo",
        agent: "",
        testCases: "",
        selectedAgents: [] as string[],
        runtime: 'manual' as 'daily' | 'weekly' | 'manual',
        metrics: {
            safety: true,
            relevance: true,
            groundedness: true,
            bias: true,
            empathy: true,
            latency: true,
            cost: true,
            carbon: true
        },
        batchSize: 10,
        autoRun: false
    })
    const [experimentCategory, setExperimentCategory] = React.useState<'performance' | 'observability' | 'responsible'>('performance')
    const [evaluationMethods, setEvaluationMethods] = React.useState({ automated: true, human: false, benchmarking: false })

    const applyMetricPreset = React.useCallback((category: 'performance' | 'observability' | 'responsible') => {
        setExperimentCategory(category)
        if (category === 'performance') {
            setExperimentConfig(prev => ({
                ...prev,
                metrics: { safety: true, relevance: true, groundedness: true, bias: false, empathy: false, latency: true, cost: true, carbon: true },
            }))
        } else if (category === 'observability') {
            setExperimentConfig(prev => ({
                ...prev,
                metrics: { safety: false, relevance: false, groundedness: false, bias: false, empathy: false, latency: true, cost: true, carbon: true },
            }))
        } else {
            setExperimentConfig(prev => ({
                ...prev,
                metrics: { safety: true, relevance: false, groundedness: false, bias: true, empathy: true, latency: false, cost: false, carbon: false },
            }))
        }
    }, [])

    // --- A/B Test State ---
    const [abTestConfig, setABTestConfig] = React.useState<ABTestConfig>({
        id: "",
        name: "",
        description: "",
        baseline: {
            type: 'model',
            id: 'openai/gpt-4-turbo',
            name: 'GPT-4 Turbo (Baseline)',
            model: 'openai/gpt-4-turbo'
        },
        variant: {
            type: 'agent',
            id: '',
            name: '',
            model: ''
        },
        testCases: [],
        metrics: {
            safety: true,
            relevance: true,
            groundedness: true,
            bias: true,
            empathy: true,
            latency: true,
            cost: true,
            carbon: true,
            human_preference: false
        },
        batchSize: 10,
        autoRun: false,
        status: 'draft',
        created_at: new Date().toISOString()
    })
    const [isABTestResultsOpen, setIsABTestResultsOpen] = React.useState(false)
    const [selectedABTest, setSelectedABTest] = React.useState<ABTestConfig | null>(null)
    
    // Fetch agents from database filtered by current team
    const { data: availableAgents = [], isLoading: agentsLoading } = useQuery({
        queryKey: ['agents', selectedTeam?.id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("agents")
                .select("id, title, description, type, created_at")
                .eq("team_id", selectedTeam?.id || null)
                .order("created_at", { ascending: false })

            if (error) {
                console.error('Error fetching agents:', error)
                return []
            }
            return data || []
        },
        enabled: !!selectedTeam,
        staleTime: 1000 * 60 * 5, // 5 minutes
        gcTime: 1000 * 60 * 10, // 10 minutes
    })
    const [availableModels] = React.useState([
        { id: 'openai/gpt-4-turbo', name: 'GPT-4 Turbo' },
        { id: 'openai/gpt-4o', name: 'GPT-4o' },
        { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini' },
        { id: 'anthropic/claude-3-5-sonnet-latest', name: 'Claude 3.5 Sonnet' },
        { id: 'anthropic/claude-3-5-haiku-latest', name: 'Claude 3.5 Haiku' },
        { id: 'google/gemini-2.5-pro', name: 'Gemini 2.5 Pro' },
        { id: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash' }
    ])

    // --- A/B Test Functions ---
    const handleCreateABTest = () => {
        const newABTest: ABTestConfig = {
            ...abTestConfig,
            id: `abtest_${Date.now()}`,
            created_at: new Date().toISOString()
        }
        
        // Generate A/B test results
        const results = generateABTestResults(newABTest)
        
        // Convert A/B test results to evaluation records
        const evaluationRecords: EvaluationData[] = results.map((result, index) => {
            const timestamp = new Date().toISOString()
            return {
                user_id: 1000 + index, // Unique user ID for A/B test
                session_id: `abtest_${newABTest.id}_${index}`,
                agent_id: result.winner === 'variant' ? newABTest.variant.id : newABTest.baseline.id,
                worker_id: `abtest_worker_${index}`,
                chat_id: `abtest_chat_${newABTest.id}_${index}`,
                model: result.winner === 'variant' ? newABTest.variant.model || 'unknown' : newABTest.baseline.model || 'unknown',
                created_at: timestamp,
                user_input: result.test_case,
                llm_response: result.winner === 'variant' ? result.variant_response.response : result.baseline_response.response,
                search_context: `A/B Test: ${newABTest.name} - ${result.winner === 'variant' ? 'Variant' : 'Baseline'} Response`,
                detected_location: 'A/B Test Environment',
                detected_image: 'none',
                prompt_tokens: result.winner === 'variant' ? result.variant_response.tokens.input : result.baseline_response.tokens.input,
                response_tokens: result.winner === 'variant' ? result.variant_response.tokens.output : result.baseline_response.tokens.output,
                retrieval_tokens: 0,
                eval_date: timestamp,
                safety: result.winner === 'variant' ? result.variant_response.metrics.safety : result.baseline_response.metrics.safety,
                relevance_to_query: result.winner === 'variant' ? result.variant_response.metrics.relevance : result.baseline_response.metrics.relevance,
                retrieval_groundedness: result.winner === 'variant' ? result.variant_response.metrics.groundedness : result.baseline_response.metrics.groundedness,
                retrieval_relevance: result.winner === 'variant' ? result.variant_response.metrics.relevance : result.baseline_response.metrics.relevance,
                bias: result.winner === 'variant' ? result.variant_response.metrics.bias : result.baseline_response.metrics.bias,
                empathy: result.winner === 'variant' ? result.variant_response.metrics.empathy : result.baseline_response.metrics.empathy,
                language_tone: 'neutral',
                avg_latency: result.winner === 'variant' ? result.variant_response.metrics.latency : result.baseline_response.metrics.latency,
                cost_per_query: result.winner === 'variant' ? result.variant_response.metrics.cost : result.baseline_response.metrics.cost,
                carbon_emissions_per_query: result.winner === 'variant' ? result.variant_response.metrics.carbon : result.baseline_response.metrics.carbon
            }
        })
        
        // Save A/B test configuration
        const savedTests = JSON.parse(localStorage.getItem('abTests') || '[]')
        savedTests.push(newABTest)
        localStorage.setItem('abTests', JSON.stringify(savedTests))
        
        // Save evaluation records
        const savedEvaluations = JSON.parse(localStorage.getItem('evaluations') || '[]')
        savedEvaluations.push(...evaluationRecords)
        localStorage.setItem('evaluations', JSON.stringify(savedEvaluations))
        
        // close dialog by switching back to batch tab
        setEvalTab('batch')
        
        // Show results immediately
        setSelectedABTest(newABTest)
        setIsABTestResultsOpen(true)
        
        // Reset config
        setABTestConfig({
            id: "",
            name: "",
            description: "",
            baseline: {
                type: 'model',
                id: 'openai/gpt-4-turbo',
                name: 'GPT-4 Turbo (Baseline)',
                model: 'openai/gpt-4-turbo'
            },
            variant: {
                type: 'agent',
                id: '',
                name: '',
                model: ''
            },
            testCases: [],
            metrics: {
                safety: true,
                relevance: true,
                groundedness: true,
                bias: true,
                empathy: true,
                latency: true,
                cost: true,
                carbon: true,
                human_preference: false
            },
            batchSize: 10,
            autoRun: false,
            status: 'draft',
            created_at: new Date().toISOString()
        })
    }
    // Generate mock A/B test results
    const generateABTestResults = (testConfig: ABTestConfig): ABTestResult[] => {
        return testConfig.testCases.map((testCase, index) => ({
            test_id: testConfig.id,
            test_case: testCase,
            baseline_response: {
                response: `Baseline response for: ${testCase}`,
                metrics: {
                    safety: 4.2 + Math.random() * 0.6,
                    relevance: 4.1 + Math.random() * 0.8,
                    groundedness: 3.8 + Math.random() * 0.9,
                    bias: 1.2 + Math.random() * 0.8,
                    empathy: 4.0 + Math.random() * 0.7,
                    latency: 1200 + Math.random() * 400,
                    cost: 0.002 + Math.random() * 0.001,
                    carbon: 0.4 + Math.random() * 0.2
                },
                tokens: {
                    input: 150 + Math.floor(Math.random() * 100),
                    output: 200 + Math.floor(Math.random() * 150)
                }
            },
            variant_response: {
                response: `Variant response for: ${testCase}`,
                metrics: {
                    safety: 4.3 + Math.random() * 0.6,
                    relevance: 4.2 + Math.random() * 0.8,
                    groundedness: 3.9 + Math.random() * 0.9,
                    bias: 1.1 + Math.random() * 0.8,
                    empathy: 4.1 + Math.random() * 0.7,
                    latency: 1100 + Math.random() * 400,
                    cost: 0.0025 + Math.random() * 0.001,
                    carbon: 0.45 + Math.random() * 0.2
                },
                tokens: {
                    input: 160 + Math.floor(Math.random() * 100),
                    output: 220 + Math.floor(Math.random() * 150)
                }
            },
            human_preference: Math.random() > 0.5 ? 'variant' : 'baseline',
            winner: Math.random() > 0.5 ? 'variant' : 'baseline',
            created_at: new Date().toISOString()
        }));
    };

    // Stub for running A/B test
    const runABTest = async (testConfig: ABTestConfig) => {
        // TODO: Implement actual A/B test logic
    }

    const queryClient = useQueryClient()

    // Custom hook for evaluations data with React Query
    const { data: evaluationsData = [], refetch } = useQuery({
        queryKey: ['evaluations'],
        queryFn: () => {
            const savedData = localStorage.getItem('evaluationsData')
            if (savedData) {
                try {
                    return JSON.parse(savedData) as EvaluationData[]
                } catch (error) {
                    console.error("Error loading evaluations data:", error)
                    return []
                }
            }
            return []
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
        gcTime: 1000 * 60 * 10, // 10 minutes (replaced cacheTime)
    })

    // Function to update evaluations data
    const updateEvaluationsData = React.useCallback((newData: EvaluationData[]) => {
        localStorage.setItem('evaluationsData', JSON.stringify(newData))
        queryClient.setQueryData(['evaluations'], newData)
    }, [queryClient])

    const columns: ColumnDef<EvaluationData>[] = [
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

    const handleRowClick = (row: EvaluationData) => {
        setSelectedEvaluation(row)
        setIsDetailOpen(true)
    }

    const relatedEvaluations = React.useMemo(() => {
        if (!selectedEvaluation) return [] as EvaluationData[]
        return evaluationsData.filter(e => 
            e.agent_id === selectedEvaluation.agent_id && e.model === selectedEvaluation.model
        )
    }, [selectedEvaluation, evaluationsData])

    const historyStats = React.useMemo(() => {
        const count = relatedEvaluations.length
        if (count === 0) {
            return { count, avgSafety: 0, avgLatency: 0, totalCost: 0 }
        }
        const sumSafety = relatedEvaluations.reduce((s, r) => s + (r.safety || 0), 0)
        const sumLatency = relatedEvaluations.reduce((s, r) => s + (r.avg_latency || 0), 0)
        const sumCost = relatedEvaluations.reduce((s, r) => s + (r.cost_per_query || 0), 0)
        return {
            count,
            avgSafety: sumSafety / count,
            avgLatency: sumLatency / count,
            totalCost: sumCost,
        }
    }, [relatedEvaluations])

    const historyColumns: ColumnDef<EvaluationData>[] = [
        { id: "created_at", accessorKey: "created_at", header: "Created At", enableResizing: true, enableSorting: true, cell: (info) => <span className="text-xs">{format(new Date(info.getValue() as string), "MMM dd, yyyy HH:mm")}</span> },
        { id: "user_input", accessorKey: "user_input", header: "User Input", enableResizing: true, cell: (info) => <div className="max-w-[220px] truncate text-xs" title={info.getValue() as string}>{String(info.getValue() || "").substring(0, 80)}...</div> },
        { id: "safety", accessorKey: "safety", header: "Safety", enableResizing: true, enableSorting: true, cell: (info) => { const v = info.getValue() as number; return <span className={`text-xs px-2 py-1 rounded ${getCellColor(v)}`}>{v.toFixed(2)}</span> } },
        { id: "relevance_to_query", accessorKey: "relevance_to_query", header: "Relevance", enableResizing: true, enableSorting: true, cell: (info) => { const v = info.getValue() as number; return <span className={`text-xs px-2 py-1 rounded ${getCellColor(v)}`}>{v.toFixed(2)}</span> } },
        { id: "avg_latency", accessorKey: "avg_latency", header: "Latency (ms)", enableResizing: true, enableSorting: true, cell: (info) => <span className="text-xs">{`${(info.getValue() as number).toFixed(0)}ms`}</span> },
        { id: "cost_per_query", accessorKey: "cost_per_query", header: "Cost ($)", enableResizing: true, enableSorting: true, cell: (info) => <span className="text-xs">{`$${(info.getValue() as number).toFixed(4)}`}</span> },
    ]

    const handleCreateExperiment = () => {
        // Create a new evaluation record
        const newEvaluation: EvaluationData = {
            user_id: evaluationsData.length + 1,
            session_id: `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            agent_id: `agent_${Math.random().toString(36).substr(2, 6)}`,
            worker_id: `worker_${Math.random().toString(36).substr(2, 6)}`,
            chat_id: `chat_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            model: experimentConfig.model,
            created_at: new Date().toISOString(),
            user_input: "Sample user input for evaluation",
            llm_response: "Sample LLM response for evaluation",
            search_context: "Sample search context",
            detected_location: "Unknown",
            detected_image: "None",
            prompt_tokens: Math.floor(Math.random() * 100) + 20,
            response_tokens: Math.floor(Math.random() * 50) + 10,
            retrieval_tokens: Math.floor(Math.random() * 20) + 5,
            eval_date: new Date().toISOString(),
            safety: Math.random() * 5,
            relevance_to_query: Math.random() * 5,
            retrieval_groundedness: Math.random() * 5,
            retrieval_relevance: Math.random() * 5,
            bias: Math.random() * 2,
            empathy: Math.random() * 5,
            language_tone: "Neutral",
            avg_latency: Math.floor(Math.random() * 2000) + 500,
            cost_per_query: Math.random() * 0.01,
            carbon_emissions_per_query: Math.random() * 1
        }

        // Add the new evaluation to the state
        const updatedData = [newEvaluation, ...evaluationsData]
        updateEvaluationsData(updatedData)
        
        // Create evaluation schedule if agents are selected and runtime is not manual
        if (experimentConfig.selectedAgents.length > 0 && experimentConfig.runtime !== 'manual') {
            const schedule: EvaluationSchedule = {
                id: `schedule_${Date.now()}`,
                name: experimentConfig.name || `Evaluation Schedule ${Date.now()}`,
                description: experimentConfig.description || "Automated evaluation schedule",
                selectedAgents: experimentConfig.selectedAgents,
                runtime: experimentConfig.runtime,
                status: 'active',
                created_at: new Date().toISOString()
            }
            
            // Save schedule to localStorage
            const savedSchedules = JSON.parse(localStorage.getItem('evaluationSchedules') || '[]')
            savedSchedules.push(schedule)
            localStorage.setItem('evaluationSchedules', JSON.stringify(savedSchedules))
            
            console.log("Created evaluation schedule:", schedule)
        }
        
        // Reset the experiment config
        setExperimentConfig({
            name: "",
            description: "",
            model: "gpt-4-turbo",
            agent: "",
            testCases: "",
            selectedAgents: [],
            runtime: 'manual',
            metrics: {
                safety: true,
                relevance: true,
                groundedness: true,
                bias: true,
                empathy: true,
                latency: true,
                cost: true,
                carbon: true
            },
            batchSize: 10,
            autoRun: false
        })

        console.log("Created new evaluation:", newEvaluation)
        
        // Close the dialog
        setIsDialogOpen(false)
    }

    const handleRunExperiment = () => {
        // Here you would typically start the evaluation experiment
        console.log("Running experiment with config:", experimentConfig)
        // Start the evaluation process
    }

    const handleQuickEvaluation = () => {
        // Quick evaluation with default settings
        console.log("Starting quick evaluation")
        navigate("/evaluations/quick")
    }

    // Function to run scheduled evaluations
    const runScheduledEvaluations = () => {
        const savedSchedules = JSON.parse(localStorage.getItem('evaluationSchedules') || '[]')
        const activeSchedules = savedSchedules.filter((schedule: EvaluationSchedule) => schedule.status === 'active')
        
        activeSchedules.forEach((schedule: EvaluationSchedule) => {
            console.log(`Running scheduled evaluation for: ${schedule.name}`)
            console.log(`Selected agents: ${schedule.selectedAgents.join(', ')}`)
            console.log(`Runtime: ${schedule.runtime}`)
            
            // Here you would implement the actual evaluation logic
            // For now, we'll just log the schedule details
        })
    }

    // Function to get next run time based on runtime schedule
    const getNextRunTime = (runtime: 'daily' | 'weekly' | 'manual', lastRun?: string) => {
        if (runtime === 'manual') return null
        
        const now = new Date()
        const lastRunDate = lastRun ? new Date(lastRun) : now
        
        if (runtime === 'daily') {
            const nextRun = new Date(lastRunDate)
            nextRun.setDate(nextRun.getDate() + 1)
            return nextRun.toISOString()
        } else if (runtime === 'weekly') {
            const nextRun = new Date(lastRunDate)
            nextRun.setDate(nextRun.getDate() + 7)
            return nextRun.toISOString()
        }
        
        return null
    }

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 p-8 pt-6">
                <div className="relative mb-6 overflow-hidden rounded-2xl border bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6">
                    <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-indigo-200/40 blur-3xl"></div>
                    <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-purple-200/40 blur-3xl"></div>
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Evaluations</h1>
                            <p className="text-sm text-muted-foreground mt-1">Create evaluations and experiments to test performance.</p>
                            <div className="mt-3 flex flex-wrap gap-2">
                                <Badge variant="secondary" className="rounded-full">
                                    {evaluationsData.length} evaluations
                                </Badge>
                                <Badge variant="secondary" className="rounded-full">
                                    Avg safety {evaluationsData.length > 0 ? (evaluationsData.reduce((sum, item) => sum + item.safety, 0) / evaluationsData.length).toFixed(1) : "0.0"}
                                </Badge>
                                <Badge variant="secondary" className="rounded-full">
                                    Avg latency {evaluationsData.length > 0 ? Math.round(evaluationsData.reduce((sum, item) => sum + item.avg_latency, 0) / evaluationsData.length) + "ms" : "0ms"}
                                </Badge>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                        {canCreate("evaluations") && (
                            <>
                                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button>
                                            <Plus className="h-4 w-4 mr-2" /> 
                                            Add Evaluation
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-[500px] max-h-[90vh] overflow-y-auto">
                                        <DialogHeader>
                                            <DialogTitle>Add Evaluation</DialogTitle>
                                            <DialogDescription>
                                                Configure and run evaluation experiments for your AI models.
                                            </DialogDescription>
                                        </DialogHeader>
                                        
                                        <div className="space-y-5 py-2">
                                            {/* Import Options */}
                                            <div className="flex space-x-1">
                                                {/* Single Evaluation removed */}
                                                <Button
                                                    variant={evalTab === 'batch' ? 'primary' : 'outline'}
                                                    size="sm"
                                                    className="flex-1 h-9"
                                                    onClick={() => setEvalTab('batch')}
                                                >
                                                    <BarChart3 className="h-4 w-4 mr-2" />
                                                    Batch Evaluation
                                                </Button>
                                                <Button
                                                    variant={evalTab === 'abtest' ? 'primary' : 'outline'}
                                                    size="sm"
                                                    className="flex-1 h-9"
                                                    onClick={() => setEvalTab('abtest')}
                                                >
                                                    <GitBranch className="h-4 w-4 mr-2" />
                                                    A/B Test
                                                </Button>
                                            </div>

                                            {/* Experiment Type (Presets) */}
                                            <div className="space-y-2">
                                                <Label className="text-sm font-medium">Experiment Type</Label>
                                                <p className="text-sm text-muted-foreground">Choose a focus and we’ll preset recommended metrics. You can still customize below.</p>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                                    <button type="button" onClick={() => applyMetricPreset('performance')} className={`rounded-md border p-3 text-left transition ${experimentCategory === 'performance' ? 'border-primary bg-primary/5' : 'hover:bg-muted'}`}>
                                                        <div className="flex items-center gap-2">
                                                            <Target className="h-4 w-4" />
                                                            <span className="font-medium text-sm">Performance & Functional</span>
                                                        </div>
                                                        <p className="text-xs text-muted-foreground mt-1">Task success, accuracy, latency, cost.</p>
                                                    </button>
                                                    <button type="button" onClick={() => applyMetricPreset('observability')} className={`rounded-md border p-3 text-left transition ${experimentCategory === 'observability' ? 'border-primary bg-primary/5' : 'hover:bg-muted'}`}>
                                                        <div className="flex items-center gap-2">
                                                            <Settings className="h-4 w-4" />
                                                            <span className="font-medium text-sm">Observability & System</span>
                                                        </div>
                                                        <p className="text-xs text-muted-foreground mt-1">Latency, throughput proxies, cost, carbon.</p>
                                                    </button>
                                                    <button type="button" onClick={() => applyMetricPreset('responsible')} className={`rounded-md border p-3 text-left transition ${experimentCategory === 'responsible' ? 'border-primary bg-primary/5' : 'hover:bg-muted'}`}>
                                                        <div className="flex items-center gap-2">
                                                            <Shield className="h-4 w-4" />
                                                            <span className="font-medium text-sm">Responsible & Human-centric</span>
                                                        </div>
                                                        <p className="text-xs text-muted-foreground mt-1">Safety, bias mitigation, empathy.</p>
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Experiment Configuration */}
                                            <div className="space-y-3">
                                                <div className="space-y-2">
                                                    <Label htmlFor="experiment-name">Experiment Name</Label>
                                                    <Input
                                                        id="experiment-name"
                                                        placeholder="Enter experiment name"
                                                        value={experimentConfig.name}
                                                        onChange={(e) => setExperimentConfig(prev => ({ ...prev, name: e.target.value }))}
                                                    />
                                                </div>
                                                
                                                <div className="space-y-2">
                                                    <Label htmlFor="experiment-description">Description</Label>
                                                    <Textarea
                                                        id="experiment-description"
                                                        placeholder="Describe your evaluation experiment"
                                                        value={experimentConfig.description}
                                                        onChange={(e) => setExperimentConfig(prev => ({ ...prev, description: e.target.value }))}
                                                        rows={3}
                                                    />
                                                </div>
                                                
                                                {/* Agent Selection */}
                                                <div className="space-y-2">
                                                    <Label>Select Agents</Label>
                                                    <p className="text-sm text-muted-foreground">
                                                        Choose which agents this evaluation should run on
                                                    </p>
                                                    <MultiSelect
                                                        options={availableAgents.map(agent => ({
                                                            label: agent.title,
                                                            value: agent.id.toString(),
                                                            icon: Users
                                                        }))}
                                                        onValueChange={(values) => {
                                                            setExperimentConfig(prev => ({
                                                                ...prev,
                                                                selectedAgents: values
                                                            }))
                                                        }}
                                                        defaultValue={experimentConfig.selectedAgents}
                                                        placeholder="Select agents..."
                                                        maxCount={3}
                                                        className="w-full"
                                                    />
                                                </div>

                                                {/* Runtime Schedule */}
                                                <div className="space-y-2">
                                                    <Label>Runtime Schedule</Label>
                                                    <p className="text-sm text-muted-foreground">
                                                        Choose when this evaluation should run
                                                    </p>
                                                    <div className="grid grid-cols-3 gap-2">
                                                        <div className="flex items-center space-x-2">
                                                            <input
                                                                type="radio"
                                                                id="runtime-manual"
                                                                name="runtime"
                                                                value="manual"
                                                                checked={experimentConfig.runtime === 'manual'}
                                                                onChange={(e) => setExperimentConfig(prev => ({ ...prev, runtime: e.target.value as 'manual' }))}
                                                                className="rounded border-gray-300"
                                                            />
                                                            <Label htmlFor="runtime-manual" className="text-sm">Manual</Label>
                                                        </div>
                                                        <div className="flex items-center space-x-2">
                                                            <input
                                                                type="radio"
                                                                id="runtime-daily"
                                                                name="runtime"
                                                                value="daily"
                                                                checked={experimentConfig.runtime === 'daily'}
                                                                onChange={(e) => setExperimentConfig(prev => ({ ...prev, runtime: e.target.value as 'daily' }))}
                                                                className="rounded border-gray-300"
                                                            />
                                                            <Label htmlFor="runtime-daily" className="text-sm">Daily</Label>
                                                        </div>
                                                        <div className="flex items-center space-x-2">
                                                            <input
                                                                type="radio"
                                                                id="runtime-weekly"
                                                                name="runtime"
                                                                value="weekly"
                                                                checked={experimentConfig.runtime === 'weekly'}
                                                                onChange={(e) => setExperimentConfig(prev => ({ ...prev, runtime: e.target.value as 'weekly' }))}
                                                                className="rounded border-gray-300"
                                                            />
                                                            <Label htmlFor="runtime-weekly" className="text-sm">Weekly</Label>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label htmlFor="model-select">Model</Label>
                                                        <Select
                                                            value={experimentConfig.model}
                                                            onValueChange={(value) => setExperimentConfig(prev => ({ ...prev, model: value }))}
                                                        >
                                                            <SelectTrigger>
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                                                                <SelectItem value="gpt-4">GPT-4</SelectItem>
                                                                <SelectItem value="claude-3-sonnet">Claude-3 Sonnet</SelectItem>
                                                                <SelectItem value="claude-3-opus">Claude-3 Opus</SelectItem>
                                                                <SelectItem value="gemini-pro">Gemini Pro</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    
                                                    <div className="space-y-2">
                                                        <Label htmlFor="batch-size">Batch Size</Label>
                                                        <Input
                                                            id="batch-size"
                                                            type="number"
                                                            min="1"
                                                            max="100"
                                                            value={experimentConfig.batchSize}
                                                            onChange={(e) => setExperimentConfig(prev => ({ ...prev, batchSize: parseInt(e.target.value) || 10 }))}
                                                        />
                                                    </div>
                                                </div>
                                                
                                                <div className="flex items-center space-x-2">
                                                    <Switch
                                                        id="auto-run"
                                                        checked={experimentConfig.autoRun}
                                                        onCheckedChange={(checked) => setExperimentConfig(prev => ({ ...prev, autoRun: checked }))}
                                                    />
                                                    <Label htmlFor="auto-run" className="text-sm">Auto-run experiment</Label>
                                                </div>
                                            </div>

                                            {/* Mode-specific content */}
                                            {evalTab === 'abtest' ? (
                                                <div className="space-y-5">
                                                    {/* Baseline & Variant selections (condensed) */}
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="space-y-2">
                                                            <Label className="text-sm font-medium">Baseline Type</Label>
                                                            <Select
                                                                value={abTestConfig.baseline.type}
                                                                onValueChange={(value: 'agent' | 'model') => setABTestConfig(prev => ({ ...prev, baseline: { ...prev.baseline, type: value } }))}
                                                            >
                                                                <SelectTrigger>
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="model">Model</SelectItem>
                                                                    <SelectItem value="agent">Agent</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label className="text-sm font-medium">Variant Type</Label>
                                                            <Select
                                                                value={abTestConfig.variant.type}
                                                                onValueChange={(value: 'agent' | 'model') => setABTestConfig(prev => ({ ...prev, variant: { ...prev.variant, type: value } }))}
                                                            >
                                                                <SelectTrigger>
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="agent">Agent</SelectItem>
                                                                    <SelectItem value="model">Model</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="space-y-2">
                                                            <Label>Baseline Selection</Label>
                                                            {abTestConfig.baseline.type === 'model' ? (
                                                                <Select
                                                                    value={abTestConfig.baseline.model}
                                                                    onValueChange={(value) => {
                                                                        const model = availableModels.find(m => m.id === value)
                                                                        setABTestConfig(prev => ({
                                                                            ...prev,
                                                                            baseline: { ...prev.baseline, id: value, name: model?.name || value, model: value },
                                                                        }))
                                                                    }}
                                                                >
                                                                    <SelectTrigger>
                                                                        <SelectValue />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        {availableModels.map(model => (
                                                                            <SelectItem key={model.id} value={model.id}>{model.name}</SelectItem>
                                                                        ))}
                                                                    </SelectContent>
                                                                </Select>
                                                            ) : (
                                                                <Select
                                                                    value={abTestConfig.baseline.id}
                                                                    onValueChange={(value) => {
                                                                        const agent = availableAgents.find(a => a.id.toString() === value)
                                                                        setABTestConfig(prev => ({ ...prev, baseline: { ...prev.baseline, id: value, name: agent?.title || value } }))
                                                                    }}
                                                                >
                                                                    <SelectTrigger>
                                                                        <SelectValue placeholder="Select agent" />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        {availableAgents.map(agent => (
                                                                            <SelectItem key={agent.id} value={agent.id.toString()}>{agent.title}</SelectItem>
                                                                        ))}
                                                                    </SelectContent>
                                                                </Select>
                                                            )}
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label>Variant Selection</Label>
                                                            {abTestConfig.variant.type === 'model' ? (
                                                                <Select
                                                                    value={abTestConfig.variant.model}
                                                                    onValueChange={(value) => {
                                                                        const model = availableModels.find(m => m.id === value)
                                                                        setABTestConfig(prev => ({
                                                                            ...prev,
                                                                            variant: { ...prev.variant, id: value, name: model?.name || value, model: value },
                                                                        }))
                                                                    }}
                                                                >
                                                                    <SelectTrigger>
                                                                        <SelectValue />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        {availableModels.map(model => (
                                                                            <SelectItem key={model.id} value={model.id}>{model.name}</SelectItem>
                                                                        ))}
                                                                    </SelectContent>
                                                                </Select>
                                                            ) : (
                                                                <Select
                                                                    value={abTestConfig.variant.id}
                                                                    onValueChange={(value) => {
                                                                        const agent = availableAgents.find(a => a.id.toString() === value)
                                                                        setABTestConfig(prev => ({ ...prev, variant: { ...prev.variant, id: value, name: agent?.title || value } }))
                                                                    }}
                                                                >
                                                                    <SelectTrigger>
                                                                        <SelectValue placeholder="Select agent" />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        {availableAgents.map(agent => (
                                                                            <SelectItem key={agent.id} value={agent.id.toString()}>{agent.title}</SelectItem>
                                                                        ))}
                                                                    </SelectContent>
                                                                </Select>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-sm font-medium">Test Cases</Label>
                                                        <Textarea
                                                            placeholder="Enter test cases, one per line"
                                                            value={abTestConfig.testCases.join('\n')}
                                                            onChange={(e) => setABTestConfig(prev => ({ ...prev, testCases: e.target.value.split('\n').filter(line => line.trim()) }))}
                                                            rows={4}
                                                        />
                                                    </div>
                                                </div>
                                            ) : null}

                                            {/* Methods and Tools */}
                                            <div className="space-y-2">
                                                <Label className="text-sm font-medium">Methods</Label>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                                    <div className="flex items-center space-x-2">
                                                        <Switch id="method-automated" checked={evaluationMethods.automated} onCheckedChange={(checked) => setEvaluationMethods(prev => ({ ...prev, automated: checked }))} />
                                                        <Label htmlFor="method-automated" className="text-sm">Automated (LLM-as-judge)</Label>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <Switch id="method-human" checked={evaluationMethods.human} onCheckedChange={(checked) => setEvaluationMethods(prev => ({ ...prev, human: checked }))} />
                                                        <Label htmlFor="method-human" className="text-sm">Human-in-the-loop</Label>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <Switch id="method-benchmarking" checked={evaluationMethods.benchmarking} onCheckedChange={(checked) => setEvaluationMethods(prev => ({ ...prev, benchmarking: checked }))} />
                                                        <Label htmlFor="method-benchmarking" className="text-sm">Benchmarking/Comparison</Label>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Evaluation Metrics */}
                                            <div className="space-y-3">
                                                <Label>Evaluation Metrics</Label>
                                                <p className="text-sm text-muted-foreground">
                                                    Select which metrics to evaluate during the experiment
                                                </p>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div className="flex items-center space-x-2">
                                                        <Switch
                                                            id="safety"
                                                            checked={experimentConfig.metrics.safety}
                                                            onCheckedChange={(checked) => setExperimentConfig(prev => ({ 
                                                                ...prev, 
                                                                metrics: { ...prev.metrics, safety: checked }
                                                            }))}
                                                        />
                                                        <Label htmlFor="safety" className="text-sm">Safety</Label>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <Switch
                                                            id="relevance"
                                                            checked={experimentConfig.metrics.relevance}
                                                            onCheckedChange={(checked) => setExperimentConfig(prev => ({ 
                                                                ...prev, 
                                                                metrics: { ...prev.metrics, relevance: checked }
                                                            }))}
                                                        />
                                                        <Label htmlFor="relevance" className="text-sm">Relevance</Label>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <Switch
                                                            id="groundedness"
                                                            checked={experimentConfig.metrics.groundedness}
                                                            onCheckedChange={(checked) => setExperimentConfig(prev => ({ 
                                                                ...prev, 
                                                                metrics: { ...prev.metrics, groundedness: checked }
                                                            }))}
                                                        />
                                                        <Label htmlFor="groundedness" className="text-sm">Groundedness</Label>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <Switch
                                                            id="bias"
                                                            checked={experimentConfig.metrics.bias}
                                                            onCheckedChange={(checked) => setExperimentConfig(prev => ({ 
                                                                ...prev, 
                                                                metrics: { ...prev.metrics, bias: checked }
                                                            }))}
                                                        />
                                                        <Label htmlFor="bias" className="text-sm">Bias</Label>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <Switch
                                                            id="empathy"
                                                            checked={experimentConfig.metrics.empathy}
                                                            onCheckedChange={(checked) => setExperimentConfig(prev => ({ 
                                                                ...prev, 
                                                                metrics: { ...prev.metrics, empathy: checked }
                                                            }))}
                                                        />
                                                        <Label htmlFor="empathy" className="text-sm">Empathy</Label>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <Switch
                                                            id="latency"
                                                            checked={experimentConfig.metrics.latency}
                                                            onCheckedChange={(checked) => setExperimentConfig(prev => ({ 
                                                                ...prev, 
                                                                metrics: { ...prev.metrics, latency: checked }
                                                            }))}
                                                        />
                                                        <Label htmlFor="latency" className="text-sm">Latency</Label>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <Switch
                                                            id="cost"
                                                            checked={experimentConfig.metrics.cost}
                                                            onCheckedChange={(checked) => setExperimentConfig(prev => ({ 
                                                                ...prev, 
                                                                metrics: { ...prev.metrics, cost: checked }
                                                            }))}
                                                        />
                                                        <Label htmlFor="cost" className="text-sm">Cost</Label>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <Switch
                                                            id="carbon"
                                                            checked={experimentConfig.metrics.carbon}
                                                            onCheckedChange={(checked) => setExperimentConfig(prev => ({ 
                                                                ...prev, 
                                                                metrics: { ...prev.metrics, carbon: checked }
                                                            }))}
                                                        />
                                                        <Label htmlFor="carbon" className="text-sm">Carbon</Label>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            {/* Action Button */}
                                            <div className="flex justify-center pt-4 pb-2 gap-2">
                                                {evalTab === 'abtest' ? (
                                                    <Button onClick={handleCreateABTest} className="px-8 py-2">
                                                        Create A/B Test
                                                    </Button>
                                                ) : (
                                                    <Button onClick={handleCreateExperiment} className="px-8 py-2">
                                                        Add Evaluation
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            </>
                        )}
                        
                        {/* Evaluation Detail Dialog */}
                        <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                            <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
                                <DialogHeader>
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <DialogTitle>{detailSchedule ? 'Schedule Details' : 'Evaluation Details'}</DialogTitle>
                                            <DialogDescription>
                                                {detailSchedule ? 'Detailed view of evaluation schedule' : 'Detailed view of evaluation experiment'}
                                            </DialogDescription>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button size="sm" onClick={() => console.log('Run experiment', selectedEvaluation)}>
                                                <Play className="h-4 w-4 mr-2" /> Run
                                            </Button>
                                            <Button size="sm" variant="outline" onClick={() => console.log('Save config', detailConfig)}>
                                                Save Changes
                                            </Button>
                                        </div>
                                    </div>
                                </DialogHeader>
                                {/* Inline editable configuration section */}
                                <div className="space-y-4 pb-2 border-b">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium">Experiment Name</Label>
                                            <Input value={detailConfig.name} onChange={(e) => setDetailConfig(prev => ({ ...prev, name: e.target.value }))} placeholder="Enter experiment name" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium">Model</Label>
                                            <Select value={detailConfig.model} onValueChange={(value) => setDetailConfig(prev => ({ ...prev, model: value }))}>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                                                    <SelectItem value="gpt-4">GPT-4</SelectItem>
                                                    <SelectItem value="claude-3-sonnet">Claude-3 Sonnet</SelectItem>
                                                    <SelectItem value="claude-3-opus">Claude-3 Opus</SelectItem>
                                                    <SelectItem value="gemini-pro">Gemini Pro</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2 md:col-span-2">
                                            <Label className="text-sm font-medium">Description</Label>
                                            <Textarea value={detailConfig.description} onChange={(e) => setDetailConfig(prev => ({ ...prev, description: e.target.value }))} rows={2} placeholder="Describe your evaluation" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium">Batch Size</Label>
                                            <Input type="number" min="1" max="100" value={detailConfig.batchSize} onChange={(e) => setDetailConfig(prev => ({ ...prev, batchSize: parseInt(e.target.value) || 10 }))} />
                                        </div>
                                        <div className="space-y-2 md:col-span-2">
                                            <Label className="text-sm font-medium">Agents</Label>
                                            <MultiSelect
                                                options={availableAgents.map(agent => ({ label: agent.title, value: agent.id.toString(), icon: Users }))}
                                                onValueChange={(values) => setDetailConfig(prev => ({ ...prev, selectedAgents: values }))}
                                                defaultValue={detailConfig.selectedAgents}
                                                placeholder="Select agents..."
                                                maxCount={3}
                                                className="w-full"
                                            />
                                        </div>
                                    </div>
                                    <div className="mt-2">
                                        <h3 className="text-sm font-medium">Metrics</h3>
                                        <p className="text-xs text-muted-foreground">Select which metrics to track for this evaluation.</p>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="flex items-center space-x-2">
                                            <Switch id="detail-auto-run" checked={detailConfig.autoRun} onCheckedChange={(checked) => setDetailConfig(prev => ({ ...prev, autoRun: checked }))} />
                                            <Label htmlFor="detail-auto-run" className="text-sm">Auto-run</Label>
                                        </div>
                                        <div className="md:col-span-2 flex flex-wrap gap-3">
                                            {Object.entries(detailConfig.metrics).map(([key, value]) => (
                                                <div key={key} className="flex items-center space-x-2">
                                                    <Switch id={`detail-metric-${key}`} checked={value} onCheckedChange={(checked) => setDetailConfig(prev => ({ ...prev, metrics: { ...prev.metrics, [key]: checked } }))} />
                                                    <Label htmlFor={`detail-metric-${key}`} className="text-sm capitalize">{key.replace('_', ' ')}</Label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Aggregated history summary */}
                                {selectedEvaluation && (
                                    <div className="py-4 border-b">
                                        {/* Dashboard controls */}
                                        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-4">
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:flex-1">
                                                <div className="space-y-1">
                                                    <Label className="text-sm font-medium">Metric</Label>
                                                    <Select value={dashboardMetric} onValueChange={(v: any) => setDashboardMetric(v)}>
                                                        <SelectTrigger>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="safety">Safety</SelectItem>
                                                            <SelectItem value="relevance_to_query">Relevance</SelectItem>
                                                            <SelectItem value="avg_latency">Latency</SelectItem>
                                                            <SelectItem value="cost_per_query">Cost</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-sm font-medium">Ask about this evaluation</Label>
                                                    <Input placeholder="e.g., Why did safety drop last week?" value={dashboardQuery} onChange={(e) => setDashboardQuery(e.target.value)} />
                                                </div>
                                                <div className="space-y-1 flex md:justify-end">
                                                    <Button className="md:self-end" onClick={() => setDashboardAnswer(`(stub) Insight for: ${dashboardQuery || 'No question provided'}`)}>Analyze</Button>
                                                </div>
                                            </div>
                                        </div>
                                        {dashboardAnswer && (
                                            <div className="mb-4 p-3 rounded-md bg-secondary text-sm">
                                                {dashboardAnswer}
                                            </div>
                                        )}

                                        {/* Simple trend line as a compact sparkline using SVG */}
                                        <div className="mb-4">
                                            {(() => {
                                                const series = relatedEvaluations
                                                    .slice()
                                                    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                                                    .map((r) => ({
                                                        x: new Date(r.created_at).getTime(),
                                                        y: (r as any)[dashboardMetric] as number,
                                                    }))
                                                if (series.length < 2) return null
                                                const xs = series.map(p => p.x)
                                                const ys = series.map(p => p.y)
                                                const minX = Math.min(...xs)
                                                const maxX = Math.max(...xs)
                                                const minY = Math.min(...ys)
                                                const maxY = Math.max(...ys)
                                                const pad = 8
                                                const w = 600, h = 120
                                                const toX = (x: number) => pad + ((x - minX) / (maxX - minX || 1)) * (w - 2 * pad)
                                                const toY = (y: number) => h - pad - ((y - minY) / (maxY - minY || 1)) * (h - 2 * pad)
                                                const d = series.map((p, i) => `${i === 0 ? 'M' : 'L'} ${toX(p.x)} ${toY(p.y)}`).join(' ')
                                                return (
                                                    <div className="overflow-x-auto">
                                                        <svg width={w} height={h} className="rounded-md border bg-white">
                                                            <path d={d} stroke="#6286F7" strokeWidth="2" fill="none" />
                                                        </svg>
                                                    </div>
                                                )
                                            })()}
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                            <Card>
                                                <CardHeader className="pb-2">
                                                    <CardTitle className="text-sm font-medium">Total Evaluations</CardTitle>
                                                </CardHeader>
                                                <CardContent>
                                                    <div className="text-xl font-semibold">{historyStats.count}</div>
                                                </CardContent>
                                            </Card>
                                            <Card>
                                                <CardHeader className="pb-2">
                                                    <CardTitle className="text-sm font-medium">Avg Safety</CardTitle>
                                                </CardHeader>
                                                <CardContent>
                                                    <div className="text-xl font-semibold">{historyStats.avgSafety.toFixed(2)}</div>
                                                </CardContent>
                                            </Card>
                                            <Card>
                                                <CardHeader className="pb-2">
                                                    <CardTitle className="text-sm font-medium">Avg Latency</CardTitle>
                                                </CardHeader>
                                                <CardContent>
                                                    <div className="text-xl font-semibold">{Math.round(historyStats.avgLatency)}ms</div>
                                                </CardContent>
                                            </Card>
                                            <Card>
                                                <CardHeader className="pb-2">
                                                    <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
                                                </CardHeader>
                                                <CardContent>
                                                    <div className="text-xl font-semibold">${historyStats.totalCost.toFixed(2)}</div>
                                                </CardContent>
                                            </Card>
                                        </div>
                                    </div>
                                )}

                                {/* Historical results table (scores-like) */}
                                <div className="py-4">
                                    <EnhancedDataTable
                                        columns={historyColumns}
                                        data={relatedEvaluations}
                                        searchKey="user_input"
                                        searchPlaceholder="Search historical results..."
                                        onRowClick={() => {}}
                                        placeholder="No history yet"
                                    />
                                </div>
                                
                                {/* Artifacts removed from popover; view them in Scores row details */}
                            </DialogContent>
                        </Dialog>
                        
                        <Button variant="outline" className="rounded-full">
                            <Download className="h-4 w-4 mr-2" />
                            Export
                        </Button>
                        <Button variant="outline" className="rounded-full">
                            <Filter className="h-4 w-4 mr-2" />
                            Filters
                        </Button>

                    </div>
                </div>
                </div>

                {/* Summary Cards removed per request */}

                {/* Active Schedules */}
                {(() => {
                    const savedSchedules = JSON.parse(localStorage.getItem('evaluationSchedules') || '[]')
                    const activeSchedules = savedSchedules.filter((schedule: EvaluationSchedule) => schedule.status === 'active')
                    
                    if (activeSchedules.length > 0) {
                        return (
                            <div className="mb-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-lg font-semibold">Active Evaluation Schedules</h2>
                                    <Button onClick={runScheduledEvaluations} variant="outline" size="sm">
                                        <Play className="h-4 w-4 mr-2" />
                                        Run Scheduled Evaluations
                                    </Button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {activeSchedules.map((schedule: EvaluationSchedule) => (
                                        <Card key={schedule.id} onClick={() => { setDetailSchedule(schedule); setSelectedEvaluation(null); setIsDetailOpen(true) }} className="cursor-pointer transition hover:shadow-md hover:border-primary/30">
                                            <CardHeader className="pb-3">
                                                <div className="flex items-center justify-between">
                                                    <CardTitle className="text-sm font-medium">{schedule.name}</CardTitle>
                                                    <Badge variant={schedule.status === 'active' ? 'default' : 'secondary'}>
                                                        {schedule.status}
                                                    </Badge>
                                                </div>
                                                <CardDescription className="text-xs">
                                                    {schedule.description}
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent className="pt-0">
                                                <div className="space-y-2">
                                                    <div className="flex justify-between text-xs">
                                                        <span className="text-muted-foreground">Runtime:</span>
                                                        <span className="font-medium capitalize">{schedule.runtime}</span>
                                                    </div>
                                                    <div className="flex justify-between text-xs">
                                                        <span className="text-muted-foreground">Agents:</span>
                                                        <span className="font-medium">{schedule.selectedAgents.length}</span>
                                                    </div>
                                                    {schedule.lastRun && (
                                                        <div className="flex justify-between text-xs">
                                                            <span className="text-muted-foreground">Last Run:</span>
                                                            <span className="font-medium">
                                                                {format(new Date(schedule.lastRun), "MMM dd, HH:mm")}
                                                            </span>
                                                        </div>
                                                    )}
                                                    {schedule.nextRun && (
                                                        <div className="flex justify-between text-xs">
                                                            <span className="text-muted-foreground">Next Run:</span>
                                                            <span className="font-medium">
                                                                {format(new Date(schedule.nextRun), "MMM dd, HH:mm")}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        )
                    }
                    return null
                })()}

                {/* Schedule click opens the same details popover, using existing UI */}

                <EnhancedDataTable
                    columns={columns}
                    data={evaluationsData}
                    searchKey="user_input"
                    searchPlaceholder="Search evaluations..."
                    onRowClick={(row) => {
                        handleRowClick(row)
                    }}
                    placeholder="No evaluations found"
                />

                {/* A/B Test Results Dialog */}
                <Dialog open={isABTestResultsOpen} onOpenChange={setIsABTestResultsOpen}>
                    <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader className="pb-4">
                            <DialogTitle className="text-xl font-semibold">A/B Test Results</DialogTitle>
                            <DialogDescription className="text-base">
                                {selectedABTest?.name} - Performance Comparison
                            </DialogDescription>
                        </DialogHeader>
                        
                        {selectedABTest && (() => {
                            const results = generateABTestResults(selectedABTest)
                            const metrics: Array<{
                                key: string
                                label: string
                                isLowerBetter: boolean
                                icon: React.ComponentType<{ className?: string }>
                                color: string
                            }> = [
                                { key: 'safety', label: 'Safety', isLowerBetter: false, icon: Shield, color: 'text-blue-600' },
                                { key: 'relevance', label: 'Relevance', isLowerBetter: false, icon: Target, color: 'text-green-600' },
                                { key: 'groundedness', label: 'Groundedness', isLowerBetter: false, icon: BookOpen, color: 'text-purple-600' },
                                { key: 'bias', label: 'Bias', isLowerBetter: true, icon: Scale, color: 'text-orange-600' },
                                { key: 'empathy', label: 'Empathy', isLowerBetter: false, icon: Heart, color: 'text-pink-600' },
                                { key: 'latency', label: 'Latency', isLowerBetter: true, icon: Zap, color: 'text-yellow-600' },
                                { key: 'cost', label: 'Cost', isLowerBetter: true, icon: DollarSign, color: 'text-emerald-600' },
                                { key: 'carbon', label: 'Carbon', isLowerBetter: true, icon: Leaf, color: 'text-teal-600' }
                            ]

                            // Calculate aggregated results
                            const aggregatedBaseline = {
                                safety: results.reduce((sum, r) => sum + r.baseline_response.metrics.safety, 0) / results.length,
                                relevance: results.reduce((sum, r) => sum + r.baseline_response.metrics.relevance, 0) / results.length,
                                groundedness: results.reduce((sum, r) => sum + r.baseline_response.metrics.groundedness, 0) / results.length,
                                bias: results.reduce((sum, r) => sum + r.baseline_response.metrics.bias, 0) / results.length,
                                empathy: results.reduce((sum, r) => sum + r.baseline_response.metrics.empathy, 0) / results.length,
                                latency: results.reduce((sum, r) => sum + r.baseline_response.metrics.latency, 0) / results.length,
                                cost: results.reduce((sum, r) => sum + r.baseline_response.metrics.cost, 0) / results.length,
                                carbon: results.reduce((sum, r) => sum + r.baseline_response.metrics.carbon, 0) / results.length
                            }

                            const aggregatedVariant = {
                                safety: results.reduce((sum, r) => sum + r.variant_response.metrics.safety, 0) / results.length,
                                relevance: results.reduce((sum, r) => sum + r.variant_response.metrics.relevance, 0) / results.length,
                                groundedness: results.reduce((sum, r) => sum + r.variant_response.metrics.groundedness, 0) / results.length,
                                bias: results.reduce((sum, r) => sum + r.variant_response.metrics.bias, 0) / results.length,
                                empathy: results.reduce((sum, r) => sum + r.variant_response.metrics.empathy, 0) / results.length,
                                latency: results.reduce((sum, r) => sum + r.variant_response.metrics.latency, 0) / results.length,
                                cost: results.reduce((sum, r) => sum + r.variant_response.metrics.cost, 0) / results.length,
                                carbon: results.reduce((sum, r) => sum + r.variant_response.metrics.carbon, 0) / results.length
                            }

                            // Calculate overall winner
                            const baselineWins = results.filter(r => r.winner === 'baseline').length
                            const variantWins = results.filter(r => r.winner === 'variant').length
                            const overallWinner = variantWins > baselineWins ? 'Variant' : 'Baseline'

                            return (
                                <div className="space-y-6">
                                    {/* Header Summary */}
                                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <div>
                                                <h2 className="text-2xl font-bold text-gray-900">{selectedABTest.name}</h2>
                                                <p className="text-gray-600 mt-1">{selectedABTest.description}</p>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-3xl font-bold text-blue-600">{overallWinner}</div>
                                                <div className="text-sm text-gray-500">Overall Winner</div>
                                            </div>
                                        </div>
                                        
                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="bg-white rounded-lg p-4 border">
                                                <div className="flex items-center mb-2">
                                                    <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                                                    <h3 className="font-semibold">Baseline</h3>
                                                </div>
                                                <p className="text-sm text-gray-600">{selectedABTest.baseline.name}</p>
                                                <p className="text-xs text-gray-500 capitalize">{selectedABTest.baseline.type}</p>
                                            </div>
                                            <div className="bg-white rounded-lg p-4 border">
                                                <div className="flex items-center mb-2">
                                                    <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
                                                    <h3 className="font-semibold">Variant</h3>
                                                </div>
                                                <p className="text-sm text-gray-600">{selectedABTest.variant.name}</p>
                                                <p className="text-xs text-gray-500 capitalize">{selectedABTest.variant.type}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Metrics Comparison */}
                                    <div className="bg-white rounded-xl border shadow-sm">
                                        <div className="p-6 border-b">
                                            <h3 className="text-lg font-semibold">Performance Metrics</h3>
                                            <p className="text-sm text-gray-600 mt-1">Aggregated results across all test cases</p>
                                        </div>
                                        <div className="overflow-hidden">
                                            <div className="grid grid-cols-4 bg-gray-50 px-6 py-3 font-medium text-sm text-gray-700">
                                                <div>Metric</div>
                                                <div className="text-center">Baseline</div>
                                                <div className="text-center">Variant</div>
                                                <div className="text-center">Winner</div>
                                            </div>
                                            <div className="max-h-[400px] overflow-y-auto">
                                                {metrics.map((metric) => {
                                                    const baselineValue = aggregatedBaseline[metric.key as keyof typeof aggregatedBaseline]
                                                    const variantValue = aggregatedVariant[metric.key as keyof typeof aggregatedVariant]
                                                    const comparisonClass = getComparisonColor(baselineValue, variantValue, metric.isLowerBetter)
                                                    const isVariantBetter = metric.isLowerBetter ? 
                                                        variantValue < baselineValue : variantValue > baselineValue
                                                    
                                                    return (
                                                        <div key={metric.key} className="grid grid-cols-4 px-6 py-3 border-t hover:bg-gray-50 transition-colors">
                                                            <div className="flex items-center font-medium text-sm">
                                                                <metric.icon className={`w-4 h-4 mr-2 ${metric.color}`} />
                                                                {metric.label}
                                                            </div>
                                                            <div className="text-center">
                                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getCellColor(baselineValue)}`}>
                                                                    {metric.key === 'latency' ? `${baselineValue.toFixed(0)}ms` :
                                                                     metric.key === 'cost' ? `$${baselineValue.toFixed(4)}` :
                                                                     metric.key === 'carbon' ? `${baselineValue.toFixed(2)}g` :
                                                                     baselineValue.toFixed(2)}
                                                                </span>
                                                            </div>
                                                            <div className="text-center">
                                                                <span className={`px-3 py-1 rounded-full text-xs font-medium border-2 ${comparisonClass}`}>
                                                                    {metric.key === 'latency' ? `${variantValue.toFixed(0)}ms` :
                                                                     metric.key === 'cost' ? `$${variantValue.toFixed(4)}` :
                                                                     metric.key === 'carbon' ? `${variantValue.toFixed(2)}g` :
                                                                     variantValue.toFixed(2)}
                                                                </span>
                                                            </div>
                                                            <div className="text-center">
                                                                <Badge 
                                                                    variant={isVariantBetter ? "default" : "secondary"}
                                                                    className="text-xs"
                                                                >
                                                                    {isVariantBetter ? "Variant" : "Baseline"}
                                                                </Badge>
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Test Results Summary */}
                                    <div className="bg-white rounded-xl border shadow-sm">
                                        <div className="p-6 border-b">
                                            <h3 className="text-lg font-semibold">Test Results Summary</h3>
                                            <p className="text-sm text-gray-600 mt-1">Individual test case outcomes</p>
                                        </div>
                                        <div className="p-6">
                                            <div className="grid grid-cols-3 gap-6 mb-6">
                                                <div className="text-center">
                                                    <div className="text-2xl font-bold text-blue-600">{baselineWins}</div>
                                                    <div className="text-sm text-gray-600">Baseline Wins</div>
                                                </div>
                                                <div className="text-center">
                                                    <div className="text-2xl font-bold text-purple-600">{variantWins}</div>
                                                    <div className="text-sm text-gray-600">Variant Wins</div>
                                                </div>
                                                <div className="text-center">
                                                    <div className="text-2xl font-bold text-gray-600">{results.length}</div>
                                                    <div className="text-sm text-gray-600">Total Tests</div>
                                                </div>
                                            </div>
                                            
                                            <div className="space-y-3 max-h-[300px] overflow-y-auto">
                                                {results.map((result, index) => (
                                                    <div key={index} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                                                        <div className="flex items-center justify-between mb-3">
                                                            <div className="flex items-center">
                                                                <span className="text-sm font-medium text-gray-600 mr-2">Test {index + 1}</span>
                                                                <Badge variant={result.winner === 'variant' ? 'default' : 'secondary'} className="text-xs">
                                                                    {result.winner === 'variant' ? 'Variant Wins' : 'Baseline Wins'}
                                                                </Badge>
                                                            </div>
                                                            <div className="text-xs text-gray-500">
                                                                {result.human_preference && (
                                                                    <span className="mr-2">Human: {result.human_preference}</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <p className="text-sm text-gray-700 mb-3">{result.test_case}</p>
                                                        <div className="grid grid-cols-2 gap-4 text-xs">
                                                            <div>
                                                                <div className="font-medium mb-2 text-blue-600">Baseline Response</div>
                                                                <div className="space-y-1">
                                                                    {Object.entries(result.baseline_response.metrics).slice(0, 4).map(([key, value]) => (
                                                                        <div key={key} className="flex justify-between">
                                                                            <span className="capitalize text-gray-600">{key}:</span>
                                                                            <span className={`px-2 py-1 rounded ${getCellColor(value)}`}>
                                                                                {key === 'latency' ? `${value.toFixed(0)}ms` :
                                                                                 key === 'cost' ? `$${value.toFixed(4)}` :
                                                                                 key === 'carbon' ? `${value.toFixed(2)}g` :
                                                                                 value.toFixed(2)}
                                                                            </span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <div className="font-medium mb-2 text-purple-600">Variant Response</div>
                                                                <div className="space-y-1">
                                                                    {Object.entries(result.variant_response.metrics).slice(0, 4).map(([key, value]) => {
                                                                        const baselineValue = result.baseline_response.metrics[key as keyof typeof result.baseline_response.metrics]
                                                                        const comparisonClass = getComparisonColor(baselineValue, value, 
                                                                            ['bias', 'latency', 'cost', 'carbon'].includes(key))
                                                                        return (
                                                                            <div key={key} className="flex justify-between">
                                                                                <span className="capitalize text-gray-600">{key}:</span>
                                                                                <span className={`px-2 py-1 rounded border-2 ${comparisonClass}`}>
                                                                                    {key === 'latency' ? `${value.toFixed(0)}ms` :
                                                                                     key === 'cost' ? `$${value.toFixed(4)}` :
                                                                                     key === 'carbon' ? `${value.toFixed(2)}g` :
                                                                                     value.toFixed(2)}
                                                                                </span>
                                                                            </div>
                                                                        )
                                                                    })}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )
                        })()}
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    )
} 