import { LogRawData, ConversationLog, LogHandle, ConversationStep, Agent, WORKER_TYPES } from "../types"

export class ConversationLogProcessor {
  
  static processHandles(rawHandles: LogHandle[] | Record<string, LogHandle> | null): LogHandle[] {
    if (!rawHandles) return []
    
    if (Array.isArray(rawHandles)) {
      return rawHandles
    }
    
    return Object.values(rawHandles).map((handle: LogHandle) => ({
      id: handle.id || 'unknown',
      name: handle.name || 'unknown',
      type: handle.type || 'unknown',
      value: handle.value || null,
      direction: handle.direction || 'unknown'
    }))
  }

  static createConversationStep(log: LogRawData): ConversationStep {
    return {
      id: log.id,
      worker: log.worker,
      message: log.message || '',
      created_at: log.created_at,
      handles: this.processHandles(log.handles),
      parameters: log.parameters || {},
      state: log.state || {}
    }
  }

  static getAgentTitle(agentId: string, agents: Agent[]): string {
    return agents.find(agent => agent.id === agentId)?.title || agentId
  }

  static groupLogsByConversation(logs: LogRawData[], agents: Agent[]): ConversationLog[] {
    const conversations: { [key: string]: ConversationLog } = {}
    
    logs.forEach(log => {
      const key = `${log.uid || 'no-uid'}_${log.agent}`
      
      if (!conversations[key]) {
        conversations[key] = {
          uid: log.uid || 'no-uid',
          agent: log.agent,
          agentTitle: this.getAgentTitle(log.agent, agents),
          conversationSteps: [],
          totalSteps: 0,
          startedAt: log.created_at,
          lastActivity: log.created_at
        }
      }
      
      const step = this.createConversationStep(log)
      conversations[key].conversationSteps.push(step)
      conversations[key].totalSteps = conversations[key].conversationSteps.length
      conversations[key].lastActivity = log.created_at
    })

    return Object.values(conversations)
  }

  static sortConversationSteps(conversation: ConversationLog): ConversationLog {
    return {
      ...conversation,
      conversationSteps: conversation.conversationSteps.sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )
    }
  }

  static getConversationWorkers(): string[] {
    return [WORKER_TYPES.RESPONSE, WORKER_TYPES.REQUEST]
  }
}
