export const WORKER_TYPES = {
  REQUEST: 'request',
  RESPONSE: 'response'
} as const

export const AGENT_FILTER_VALUES = {
  ALL: 'all'
} as const

export type WorkerType = typeof WORKER_TYPES[keyof typeof WORKER_TYPES]

export type LogHandle = {
  id: string
  name: string
  type: string
  value: any
  direction: string
}

export type LogRawData = {
  id: string
  agent: string
  worker: WorkerType
  workerId: string
  execution: string
  session: string
  type: string
  message: string
  parameters: Record<string, any>
  state: Record<string, any>
  handles: LogHandle[] | Record<string, LogHandle>
  inputTokens?: number
  outputTokens?: number
  created_at: string
  team_id: string
  uid?: string
}

export type ExecutionLog = {
  id: string
  agent: string
  worker: string
  workerId: string
  execution: string
  session: string
  type: string
  message: string
  parameters: Record<string, any>
  state: Record<string, any>
  handles: LogHandle[]
  inputTokens: number
  outputTokens: number
  created_at: string
  team_id: string
  uid: string
}

export type ConversationStep = {
  id: string
  worker: WorkerType
  message: string
  created_at: string
  handles: LogHandle[]
  parameters: Record<string, any>
  state: Record<string, any>
}

export type ConversationLog = {
  uid: string
  agent: string
  agentTitle: string
  conversationSteps: ConversationStep[]
  totalSteps: number
  startedAt: string
  lastActivity: string
  analysis?: ConversationAnalysisResult
}

export type DateRange = {
  from: string
  to: string
}

export type LogFilters = {
  selectedAgent: string
  searchQuery: string
  dateRange: DateRange
}

export type ConversationAnalysisField = {
  name: string
  type: 'string' | 'number' | 'boolean' | 'enum' | 'string[]' | 'number[]'
  prompt: string
  enum?: string[]
}

export type ConversationAnalysisConfig = {
  id: string
  name: string
  model: string
  instructions: string
  fields: ConversationAnalysisField[]
  enabled: boolean
  createdAt: string
  updatedAt: string
}

export type ConversationAnalysisResult = {
  configId: string
  conversationUid: string
  results: Record<string, any>
  processedAt: string
  error?: string
}

export type Agent = {
  id: string
  title: string
}