import { z } from "zod"
import { createModel } from "@/lib/agents/utils"
import { generateObject } from "ai"
import { ConversationLog, ConversationAnalysisConfig, ConversationAnalysisResult, ConversationAnalysisField } from "../types"

const defaultInstructions = `
Analyze the conversation between a user and an AI agent. Extract the requested information based on the conversation flow and content.
Consider the context, sentiment, and outcomes of the conversation in your analysis.
`

export class ConversationAnalysisService {
  
  static formatConversationForAnalysis(conversation: ConversationLog): string {
    const steps = conversation.conversationSteps
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      .map((step, index) => {
        let content = ''
        let role = ''

        if (step.worker === 'request') {
          role = 'User'
          const messageHandle = step.handles?.find((h: any) => h.name === 'message')
          content = messageHandle?.value || step.message || ''
        } else {
          role = 'Assistant'
          const responseHandle = step.handles?.find((h: any) => h.name === 'response')
          content = responseHandle?.value || step.message || ''
        }

        return `${index + 1}. ${role}: ${content}`
      })
      .filter(step => step.includes(': ') && !step.endsWith(': '))
      .join('\n\n')

    return `
Conversation UID: ${conversation.uid}
Agent: ${conversation.agentTitle}
Started: ${conversation.startedAt}
Last Activity: ${conversation.lastActivity}
Total Steps: ${conversation.totalSteps}

Conversation Flow:
${steps}
    `.trim()
  }

  static createSchema(fields: ConversationAnalysisField[]): z.ZodObject<any> {
    const schemaFields: Record<string, z.ZodTypeAny> = {}

    for (const field of fields) {
      let fieldSchema: z.ZodTypeAny

      switch (field.type) {
        case 'boolean':
          fieldSchema = z.boolean().nullable().default(null)
          break
        case 'number':
          fieldSchema = z.number().nullable().default(null)
          break
        case 'string':
          fieldSchema = z.string().nullable().default(null)
          break
        case 'string[]':
          fieldSchema = z.array(z.string()).nullable().default(null)
          break
        case 'number[]':
          fieldSchema = z.array(z.number()).nullable().default(null)
          break
        case 'enum':
          if (field.enum && field.enum.length > 0) {
            fieldSchema = z.enum(field.enum as [string, ...string[]]).nullable().default(null)
          } else {
            fieldSchema = z.string().nullable().default(null)
          }
          break
        default:
          fieldSchema = z.any().nullable().default(null)
      }

      schemaFields[field.name] = fieldSchema.optional().describe(field.prompt || "")
    }

    return z.object(schemaFields)
  }

  static async analyzeConversation(
    conversation: ConversationLog,
    config: ConversationAnalysisConfig,
    apiKeys: APIKeys
  ): Promise<ConversationAnalysisResult> {
    try {
      const schema = this.createSchema(config.fields)
      const model = createModel(apiKeys, config.model || "openai/gpt-4.1-nano")
      
      const conversationText = this.formatConversationForAnalysis(conversation)
      
      const messages = [
        {
          role: "system" as const,
          content: config.instructions || defaultInstructions,
        },
        {
          role: "user" as const,
          content: `Please analyze the following conversation and extract the requested information:\n\n${conversationText}`,
        },
      ]

      const { object } = await generateObject({
        model,
        schema,
        messages,
      })

      return {
        configId: config.id,
        conversationUid: conversation.uid,
        results: object || {},
        processedAt: new Date().toISOString(),
      }
    } catch (error) {
      console.error('Conversation analysis failed:', error)
      return {
        configId: config.id,
        conversationUid: conversation.uid,
        results: {},
        processedAt: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  static async analyzeConversations(
    conversations: ConversationLog[],
    config: ConversationAnalysisConfig,
    apiKeys: APIKeys,
    onProgress?: (processed: number, total: number) => void
  ): Promise<ConversationAnalysisResult[]> {
    const results: ConversationAnalysisResult[] = []
    
    for (let i = 0; i < conversations.length; i++) {
      const conversation = conversations[i]
      const result = await this.analyzeConversation(conversation, config, apiKeys)
      results.push(result)
      
      if (onProgress) {
        onProgress(i + 1, conversations.length)
      }
    }
    
    return results
  }
}

export const analysisTemplates: Partial<ConversationAnalysisConfig>[] = [
  {
    name: "Conversation Quality Analysis",
    instructions: "Analyze the quality and effectiveness of this conversation. Consider user satisfaction, issue resolution, and agent performance.",
    fields: [
      {
        name: "sentiment",
        type: "enum",
        prompt: "Overall sentiment of the conversation",
        enum: ["very_positive", "positive", "neutral", "negative", "very_negative"]
      },
      {
        name: "resolution_status",
        type: "enum",
        prompt: "Was the user's issue or question resolved?",
        enum: ["fully_resolved", "partially_resolved", "not_resolved", "unclear"]
      },
      {
        name: "quality_score",
        type: "number",
        prompt: "Rate the conversation quality from 1-10 based on helpfulness, clarity, and professionalism"
      },
      {
        name: "key_topics",
        type: "string[]",
        prompt: "Main topics or themes discussed in the conversation"
      },
      {
        name: "user_satisfaction",
        type: "enum",
        prompt: "Estimated user satisfaction level",
        enum: ["very_satisfied", "satisfied", "neutral", "dissatisfied", "very_dissatisfied"]
      }
    ]
  }
]