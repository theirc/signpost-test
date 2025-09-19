import { z } from "zod"
import { createModel } from "@/lib/agents/utils"
import { generateObject } from "ai"
import { ConversationLog, ConversationAnalysisConfig, ConversationAnalysisResult, ConversationAnalysisField } from "../types"

const defaultInstructions = `
You are an expert conversation analyst. Analyze the conversation between a user and an AI agent with deep attention to patterns, timing, and user behavior.

ANALYSIS GUIDELINES:
1. **Temporal Patterns**: Pay close attention to timestamps and time gaps between messages
2. **User Behavior**: Look for patterns like returning after breaks, repeated questions, escalation
3. **Conversation Flow**: Identify starts, stops, topic changes, resolution patterns
4. **Engagement Metrics**: Count interactions, measure response quality, identify drop-off points

COMMON METRICS TO ANALYZE:
- **Inactivity Returns**: Count how many times a user comes back after periods of silence (look for time gaps)
- **Session Breaks**: Identify natural conversation breaks vs. abandonment
- **Topic Persistence**: How long users stay engaged with specific topics
- **Resolution Success**: Whether issues were resolved satisfactorily
- **Escalation Patterns**: Signs of frustration or satisfaction

TIMING ANALYSIS:
- Consider gaps of >30 minutes as potential inactivity periods
- Look for patterns where users return to continue previous conversations
- Distinguish between same-session continuation vs. new session returns

Be precise and analytical. If data is insufficient, explain why rather than guessing.
`

export class ConversationAnalysisService {
  
  static generateFieldInstructions(fields: ConversationAnalysisField[]): string {
    if (fields.length === 0) return ""
    
    const instructions = fields.map(field => {
      let instruction = `\n**${field.name}** (${field.type}):\n${field.prompt}`
      
      // Add specific guidance based on field name patterns
      if (field.name.toLowerCase().includes('inactivity') || field.name.toLowerCase().includes('return')) {
        instruction += `\n- Look for time gaps of 30+ minutes followed by user messages`
        instruction += `\n- Count each instance where user returns after silence`
      }
      if (field.name.toLowerCase().includes('engagement') || field.name.toLowerCase().includes('interaction')) {
        instruction += `\n- Analyze message frequency and response quality`
        instruction += `\n- Consider conversation flow and user participation`
      }
      if (field.name.toLowerCase().includes('resolution') || field.name.toLowerCase().includes('success')) {
        instruction += `\n- Determine if user needs were met`
        instruction += `\n- Look for signs of satisfaction or frustration`
      }
      if (field.name.toLowerCase().includes('sentiment') || field.name.toLowerCase().includes('tone')) {
        instruction += `\n- Analyze emotional tone throughout conversation`
        instruction += `\n- Note any changes in user sentiment`
      }
      if (field.name.toLowerCase().includes('topic') || field.name.toLowerCase().includes('category')) {
        instruction += `\n- Identify main conversation themes`
        instruction += `\n- Note any topic changes or escalations`
      }
      
      return instruction
    }).join('\n')
    
    return `\nFIELD-SPECIFIC ANALYSIS REQUIREMENTS:${instructions}`
  }
  
  static formatConversationMessages(conversation: ConversationLog) {
    const sortedSteps = conversation.conversationSteps
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    
    const conversationMessages = sortedSteps
      .map((step, index) => {
        let content = ''
        let role: 'user' | 'assistant' = 'user'

        if (step.worker === 'request') {
          role = 'user'
          const messageHandle = step.handles?.find((h: any) => h.name === 'message')
          const inputHandle = step.handles?.find((h: any) => h.name === 'input')
          content = messageHandle?.value || inputHandle?.value || step.message || ''
        } else {
          role = 'assistant'
          const responseHandle = step.handles?.find((h: any) => h.name === 'response')
          const answerHandle = step.handles?.find((h: any) => h.name === 'answer')
          const outputHandle = step.handles?.find((h: any) => h.name === 'output')
          content = responseHandle?.value || answerHandle?.value || outputHandle?.value || step.message || ''
        }

        const cleanContent = content ? content.toString().trim() : ''
        
        // Calculate time gap from previous message for inactivity analysis
        let timeGapInfo = ''
        if (index > 0) {
          const prevStep = sortedSteps[index - 1]
          const currentTime = new Date(step.created_at).getTime()
          const prevTime = new Date(prevStep.created_at).getTime()
          const gapMinutes = (currentTime - prevTime) / (1000 * 60)
          
          if (gapMinutes > 30) {
            timeGapInfo = ` [${Math.round(gapMinutes)} min gap from previous message]`
          }
        }

        const timestampedContent = `[${step.created_at}${timeGapInfo}] ${cleanContent || `[No content - Step ${index + 1}]`}`

        return {
          role,
          content: timestampedContent
        }
      })
      .filter(msg => msg.content !== undefined && msg.content !== null)

    // Calculate additional metadata for timing analysis
    const conversationDurationMs = sortedSteps.length > 0 ? 
      new Date(sortedSteps[sortedSteps.length - 1].created_at).getTime() - new Date(sortedSteps[0].created_at).getTime() : 0
    const conversationDurationMinutes = Math.round(conversationDurationMs / (1000 * 60))

    const metadata = {
      conversationUid: conversation.uid,
      agent: conversation.agentTitle,
      startedAt: conversation.startedAt,
      lastActivity: conversation.lastActivity,
      totalSteps: conversation.totalSteps,
      durationMinutes: conversationDurationMinutes,
      firstMessageTime: sortedSteps[0]?.created_at,
      lastMessageTime: sortedSteps[sortedSteps.length - 1]?.created_at
    }

    return { conversationMessages, metadata }
  }

  static createSchema(fields: ConversationAnalysisField[]): z.ZodObject<any> {
    const schemaFields: Record<string, z.ZodTypeAny> = {}

    for (const field of fields) {
      let fieldSchema: z.ZodTypeAny
      
      // Enhanced descriptions for common analysis patterns
      let enhancedDescription = field.prompt || ""
      if (field.name.toLowerCase().includes('inactivity') || field.name.toLowerCase().includes('return')) {
        enhancedDescription += " (Count time gaps of 30+ minutes followed by user messages)"
      }
      if (field.name.toLowerCase().includes('engagement') || field.name.toLowerCase().includes('interaction')) {
        enhancedDescription += " (Analyze frequency and quality of user-assistant exchanges)"
      }
      if (field.name.toLowerCase().includes('resolution') || field.name.toLowerCase().includes('success')) {
        enhancedDescription += " (Determine if user needs were met and issues resolved)"
      }

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

      schemaFields[field.name] = fieldSchema.optional().describe(enhancedDescription)
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
      const model = createModel(apiKeys, config.model || "openai/gpt-4o-mini")
      
      if (!model) {
        throw new Error(`Failed to create model with name: ${config.model || "openai/gpt-4o-mini"}`)
      }
      
      const { conversationMessages, metadata } = this.formatConversationMessages(conversation)
      
      if (conversationMessages.length === 0) {
        throw new Error(`No conversation messages found. Conversation has ${conversation.conversationSteps.length} steps but none contained extractable content.`)
      }

      const fieldInstructions = this.generateFieldInstructions(config.fields)
      
      const messages = [
        {
          role: "system" as const,
          content: `${config.instructions || defaultInstructions}

CONVERSATION METADATA:
- Conversation ID: ${metadata.conversationUid}
- Agent: ${metadata.agent}
- Started: ${metadata.startedAt}
- Last Activity: ${metadata.lastActivity}
- Total Steps: ${metadata.totalSteps}
- Duration: ${metadata.durationMinutes} minutes
- First Message: ${metadata.firstMessageTime}
- Last Message: ${metadata.lastMessageTime}

ANALYSIS CONTEXT:
Each message in the conversation below includes a timestamp [YYYY-MM-DDTHH:MM:SS] and may include time gap information.
Time gaps of 30+ minutes are explicitly marked (e.g., "[45 min gap from previous message]").

${fieldInstructions}

You will analyze the conversation that follows. The conversation contains the actual user-assistant exchanges with timestamps and gap analysis. Extract the requested information based on both the conversation content, metadata, and specific field requirements above.`,
        },
        ...conversationMessages,
        {
          role: "user" as const,
          content: `Based on the timestamped conversation above, please analyze it carefully and extract the specific fields requested in the schema. Follow the field-specific requirements provided. ${config.fields.some(f => f.name.toLowerCase().includes('inactivity') || f.name.toLowerCase().includes('return')) ? 'Pay special attention to time gaps and user return patterns marked in the conversation.' : ''}`,
        },
      ]

      const { object } = await generateObject({
        model,
        schema,
        messages,
        temperature: 0.1,
      })

      return {
        configId: config.id,
        conversationUid: conversation.uid,
        results: object || {},
        processedAt: new Date().toISOString(),
      }
    } catch (error) {
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

// Default metadata fields that should be included in every analysis
export const defaultMetadataFields: ConversationAnalysisField[] = [
  {
    name: "conversation_created",
    type: "string",
    prompt: "When was this conversation started? Extract from the conversation metadata."
  },
  {
    name: "conversation_last_updated", 
    type: "string",
    prompt: "When was the last activity in this conversation? Extract from the conversation metadata."
  },
  {
    name: "total_conversation_steps",
    type: "number", 
    prompt: "How many total steps/exchanges occurred in this conversation? Extract from the conversation metadata."
  },
  {
    name: "conversation_duration_assessment",
    type: "enum",
    prompt: "Based on the timestamps and number of steps, how would you categorize the conversation duration?",
    enum: ["very_short", "short", "medium", "long", "very_long"]
  }
]
