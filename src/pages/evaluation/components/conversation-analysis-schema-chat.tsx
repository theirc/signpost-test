import React, { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sparkles, Send, CheckCircle, ArrowUp, Copy, Check } from "lucide-react"
import { ConversationAnalysisConfig } from "../types"
import { app } from "@/lib/app"
import { useTeamStore } from "@/lib/hooks/useTeam"
import { createModel } from "@/lib/agents/utils"
import { generateObject, generateText } from "ai"
import { z } from "zod"
import { ToMarkdown } from "@/components/ui/tomarkdown"

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface SchemaChatProps {
  onSchemaGenerated: (config: Partial<ConversationAnalysisConfig>) => void
  onClose: () => void
}

const schemaExtractionSchema = z.object({
  name: z.string().describe("A clear, descriptive name for this analysis configuration"),
  instructions: z.string().describe("Detailed instructions for the AI on how to analyze conversations"),
  fields: z.array(z.object({
    name: z.string().describe("Field name (snake_case, no spaces)"),
    type: z.enum(["string", "number", "boolean", "enum", "string[]", "number[]"]).describe("Data type for this field"),
    prompt: z.string().describe("Description of what this field should capture"),
    enum: z.array(z.string()).optional().describe("Enum options if type is 'enum'")
  })).describe("Array of fields to extract from conversations")
})

export function ConversationAnalysisSchemChat({ onSchemaGenerated, onClose }: SchemaChatProps) {
  const { selectedTeam } = useTeamStore()
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hi! I'll help you create a custom analysis schema for your conversations. Let's start by understanding what you want to analyze.\n\nWhat type of insights are you looking to extract from your conversations? For example:\n- Customer satisfaction and sentiment\n- Support ticket categorization\n- Sales lead qualification\n- Product feedback analysis\n\nTell me about your specific use case!",
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState("")
  const [executing, setExecuting] = useState(false)
  const [generatedSchema, setGeneratedSchema] = useState<Partial<ConversationAnalysisConfig> | null>(null)
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, executing])

  const handleCopyText = (messageId: string, content: string) => {
    navigator.clipboard.writeText(content).then(() => {
      setCopiedMessageId(messageId)
      setTimeout(() => setCopiedMessageId(null), 2000)
    })
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    setInput(newValue)
    e.target.style.height = "auto"
    e.target.style.height = `${e.target.scrollHeight}px`
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleSendMessage = async () => {
    if (!input.trim() || executing) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput("")
    setExecuting(true)

    try {
      const apiKeys = await app.fetchAPIkeys(selectedTeam?.id || '')
      if (!apiKeys.openai) {
        throw new Error('OpenAI API key not found')
      }

      // Create conversation history for context
      const conversationHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }))

      // Add current user message
      conversationHistory.push({
        role: 'user',
        content: input.trim()
      })

      // System prompt for schema generation assistant
      const systemPrompt = `You are a helpful assistant that helps users define analysis schemas for conversation data. 

Your role is to:
1. Ask clarifying questions to understand what the user wants to analyze
2. Suggest specific fields and data types based on their needs
3. When the user seems ready, you can suggest they're ready to generate a schema

Keep responses conversational and helpful. Ask follow-up questions to get specific details about:
- What specific metrics or insights they want
- What categories or classifications they need
- Whether they want numerical scores, text categories, or boolean flags
- Any specific enum values for categorical fields

When the user provides enough information, you can suggest they're ready to generate a schema.

Current conversation context: The user wants to create an analysis schema for conversation data.`

      const messages_with_system = [
        { role: 'system' as const, content: systemPrompt },
        ...conversationHistory
      ]

      // Use the existing model creation directly instead of API endpoint
      const model = createModel(apiKeys, "openai/gpt-4.1-nano")
      
      const { text } = await generateText({
        model,
        messages: messages_with_system,
        temperature: 0.7,
      })

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: text,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])

      // Check if we should attempt schema generation
      if (conversationHistory.length >= 6) { // After some back and forth
        await attemptSchemaGeneration(conversationHistory, apiKeys)
      }

    } catch (error) {
      console.error('Chat error:', error)
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I apologize, but I encountered an error. Please try again or configure the schema manually.",
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setExecuting(false)
    }
  }

  const attemptSchemaGeneration = async (conversationHistory: any[], apiKeys: any) => {
    try {
      const model = createModel(apiKeys, "openai/gpt-4.1-nano")
      
      const schemaPrompt = `Based on the conversation history, extract a complete analysis schema configuration. 

Conversation summary: ${conversationHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n\n')}

Generate a schema that captures what the user wants to analyze. Include:
- A descriptive name for the analysis
- Clear instructions for the AI analyzer
- Specific fields with appropriate data types
- Enum values for categorical fields where applicable

Field types available: string, number, boolean, enum, string[], number[]`

      const { object } = await generateObject({
        model,
        schema: schemaExtractionSchema,
        messages: [
          { role: 'system', content: 'Extract an analysis schema based on the user conversation.' },
          { role: 'user', content: schemaPrompt }
        ]
      })

      if (object && object.fields.length > 0) {
        // Ensure all required fields are present
        const validatedSchema: Partial<ConversationAnalysisConfig> = {
          name: object.name,
          instructions: object.instructions,
          fields: object.fields.filter(field => 
            field.name && field.type && field.prompt
          ).map(field => ({
            name: field.name!,
            type: field.type!,
            prompt: field.prompt!,
            enum: field.enum
          }))
        }
        
        if (validatedSchema.fields && validatedSchema.fields.length > 0) {
          setGeneratedSchema(validatedSchema)
        }
      }
    } catch (error) {
      console.error('Schema generation error:', error)
    }
  }

  const handleGenerateSchema = () => {
    if (generatedSchema) {
      onSchemaGenerated(generatedSchema)
    }
  }

  return (
    <div className="border-l h-full border-r border-gray-200 flex flex-col resize-x">
      <div className="grid grid-rows-[1fr_auto] flex-grow h-0 min-h-0">
        <div ref={scrollRef} className="overflow-y-auto p-4 space-y-4 text-sm">
          {messages.map((message) => {
            if (message.role === "user") {
              return (
                <div key={message.id} className="w-full message-fade-in" dir="auto">
                  <div className="flex flex-col items-end">
                    <div 
                      className={`bg-blue-500 message-bubble shadow-sm text-white ${message.content.length < 50 ? 'single-line' : ''}`}
                      dir="auto"
                    >
                      <div
                        className="break-words whitespace-pre-wrap"
                        style={{
                          fontFamily: 'Inter, sans-serif',
                          lineHeight: 1.5,
                          fontSize: '0.925rem',
                          color: '#ffffff'
                        }}
                      >
                        {message.content}
                      </div>
                    </div>
                    <div className="mt-1 pr-1 flex justify-end gap-2 text-gray-400">
                      {copiedMessageId === message.id ?
                        <Check className="cursor-pointer text-gray-400 hover:text-black transition-colors p-1 hover:bg-gray-100 rounded-md" size={20} /> :
                        <Copy className="cursor-pointer hover:text-black transition-colors p-1 hover:bg-gray-100 rounded-md" size={20} onClick={() => handleCopyText(message.id, message.content)} />
                      }
                    </div>
                  </div>
                </div>
              )
            }

            return (
              <div key={message.id} className="w-full message-fade-in">
                <div className="flex">
                  <div>
                    <Sparkles className="inline mr-2 mt-1 text-blue-500" size={16} />
                  </div>
                  <div className="flex-1">
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <ToMarkdown>{message.content}</ToMarkdown>
                    </div>
                    <div className="mt-1 pl-1 flex gap-2 text-gray-400">
                      {copiedMessageId === message.id ?
                        <Check className="cursor-pointer text-gray-400 hover:text-black transition-colors p-1 hover:bg-gray-100 rounded-md" size={20} /> :
                        <Copy className="cursor-pointer hover:text-black transition-colors p-1 hover:bg-gray-100 rounded-md" size={20} onClick={() => handleCopyText(message.id, message.content)} />
                      }
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {generatedSchema && (
          <div className="px-4 py-3 border-t bg-green-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">Schema Generated!</span>
                <Badge variant="secondary" className="text-xs text-green-600">
                  {generatedSchema.name} • {generatedSchema.fields?.length} fields
                </Badge>
              </div>
              <Button onClick={handleGenerateSchema} size="sm" className="bg-green-600 hover:bg-green-700">
                Use This Schema
              </Button>
            </div>
          </div>
        )}

        <div className="p-2">
          <div className="relative">
            <form
              onSubmit={e => {
                e.preventDefault()
                handleSendMessage()
              }}
              className={`relative bg-white rounded-xl border overflow-hidden ${
                !input.trim()
                  ? 'border-gray-200'
                  : 'border-gray-200 shadow-[4px_4px_20px_-4px_rgba(236,72,153,0.1),_-4px_4px_20px_-4px_rgba(124,58,237,0.1),_0_4px_20px_-4px_rgba(34,211,238,0.1)]'
              }`}
            >
              <div className="flex flex-col w-full">
                <div className="px-2 py-3 max-h-80 overflow-y-auto">
                                      <textarea
                      ref={textareaRef}
                      value={input}
                      onChange={handleSearchChange}
                      onKeyDown={handleKeyDown}
                      placeholder={executing ? "AI is thinking..." : "Describe what you want to analyze..."}
                      className="w-full outline-none resize-none py-1 px-1 text-sm min-h-[40px] text-black placeholder-gray-500"
                      style={{
                        fontFamily: 'Inter, sans-serif',
                        color: '#000000'
                      }}
                    />
                </div>

                <div className="flex justify-between items-center p-2">
                  <div className="text-xs text-gray-500">
                    {executing ? "AI is responding..." : "Press Enter to send, Shift+Enter for new line"}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={onClose}>
                      Skip & Configure Manually
                    </Button>
                    <Button
                      type="button"
                      onClick={handleSendMessage}
                      className="w-8 h-8 flex items-center justify-center rounded-full bg-black text-white disabled:bg-gray-400"
                      disabled={executing || !input.trim()}
                    >
                      {executing ? (
                        <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <ArrowUp className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>

        {executing && (
          <div className="flex items-center justify-center p-2 mb-2">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}