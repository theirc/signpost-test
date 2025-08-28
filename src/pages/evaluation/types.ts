export type ExecutionLog = {
  id: string
  agent: string
  worker: string
  workerId: string
  execution: string
  session: string
  type: string
  message: string
  parameters: any
  state: any
  handles: any[]
  inputTokens: number
  outputTokens: number
  created_at: string
  team_id: string
  uid: string
}

export type ConversationLog = {
  uid: string
  agent: string
  agentTitle: string
  conversationSteps: {
    id: string
    worker: string
    message: string
    created_at: string
    handles: any[]
    parameters: any
    state: any
  }[]
  totalSteps: number
  startedAt: string
  lastActivity: string
}

export type LogFilters = {
  selectedAgent: string
  selectedWorker: string
  selectedType: string
  searchQuery: string
  dateRange: { from: string; to: string }
}
