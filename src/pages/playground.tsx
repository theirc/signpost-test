"use client"

import { useEffect, useRef, useState } from 'react'
import { app } from '@/lib/app'
import { MessageSquarePlus, History, ChevronDown, ChevronUp, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useMultiState } from '@/hooks/use-multistate'
import { ChatHistory, ChatSession, getChatSessions, saveChatMessage } from '@/pages/playground/history'
import type { AgentChatMessage } from '@/types/types.ai'
import { SearchInput } from "@/pages/playground/search"
import { agents } from "@/lib/agents"
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuGroup, DropdownMenuRadioGroup, DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu"
import ChatMessageComponent from "@/pages/playground/chatmessage"
import "../index.css"
import { agentsModel } from "@/lib/data"
import { useTeamStore } from "@/lib/hooks/useTeam"
import { supabase } from '@/lib/data/db'
import { useUser } from '@/lib/hooks/useUser'

interface AgentEntry {
  id: string
  name: string
  type: "agent"
}

interface WorkerExecution {
  timestamp: number
  worker: any
  state: any
}

export const isImageUrl = (url: string | undefined | null): boolean => {
  if (!url) return false;
  return /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i.test(url)
};

export const parseMarkdownImage = (text: string | undefined | null): { imageUrl: string | null; remainingText: string | null } => {
  if (!text) return { imageUrl: null, remainingText: null };

  const markdownRegex = /^!?\[.*?\]\((.+?)\)\s*(.*)$/s;
  const match = text.match(markdownRegex);

  if (match && match[1]) {
    const imageUrl = match[1];
    const remainingText = match[2] ? match[2].trim() : null;
    if (isImageUrl(imageUrl)) {
      return { imageUrl, remainingText };
    }
  }

  return { imageUrl: null, remainingText: null };
}
const ExecutionLogDisplay = ({ executions, isVisible, onToggle }: { 
  executions: WorkerExecution[], 
  isVisible: boolean, 
  onToggle: () => void 
}) => {
  return (
    <div className="border rounded-lg bg-gray-20 mb-4">
      <Button
        variant="ghost"
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3 h-auto">
        <span className="font-light">Execution Log ({executions.length} steps)</span>
        {isVisible ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </Button>
      {isVisible && (
        <div className="px-3 pb-3 max-h-60 overflow-y-auto">
          <div className="space-y-2">
            {executions.map((execution, index) => (
              <div key={`${execution.timestamp}-${index}`} className="flex items-start gap-2 text-xs">
                <div className="flex-shrink-0 mt-0.5">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-700">
                      {execution.worker?.config?.type || 'Unknown Worker'}
                    </span>
                    <span className="text-gray-400">
                      {new Date(execution.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  {execution.worker?.error && (
                    <div className="text-red-600 mt-1">
                      Error: {execution.worker.error}
                    </div>
                  )}
                  {execution.state && Object.keys(execution.state).length > 0 && (
                    <div className="text-gray-600 mt-1 font-mono bg-gray-100 p-1 rounded text-xs">
                      {JSON.stringify(execution.state, null, 2).slice(0, 100)}
                      {JSON.stringify(execution.state).length > 100 && '...'}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function Chat() {
  const [loadedAgents, setLoadedAgents] = useState<Record<number, AgentEntry>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [sidebarVisible, setSidebarVisible] = useState(false)
  const [message, setMessage] = useState("")
  const [activeChat, setActiveChat] = useState<ChatSession | null>(null)
  const [messages, setMessages] = useState<AgentChatMessage[]>([])
  const [isLoadingFromHistory, setIsLoadingFromHistory] = useState(false)
  const [apiKeys, setApiKeys] = useState<APIKeys>({})
  const messagesEndRef = useRef(null)
  const messagesContainerRef = useRef(null)
  const { selectedTeam } = useTeamStore()
  const { data: user } = useUser()

const [workerExecutions, setWorkerExecutions] = useState<WorkerExecution[]>([])
const [showExecutionLogs, setShowExecutionLogs] = useState(false)

  useEffect(() => {
    let mounted = true

    async function loadAgents() {
      try {
        // Filter agents by the current team_id
        const { data: adata, error: aerr } = await agentsModel.data
          .select("id, title")
          .eq('team_id', selectedTeam?.id)
        
        if (aerr) throw aerr

        const agentEntries = (adata || []).reduce<Record<number, AgentEntry>>((acc, a) => {
          acc[a.id] = { id: String(a.id), name: a.title, type: "agent" }
          return acc
        }, {})

        if (mounted) setLoadedAgents(agentEntries)
      } catch (err: any) {
        if (mounted) setError(err)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    async function fetchApiKey() {
      const apiKeys = await app.fetchAPIkeys(selectedTeam?.id)
      setApiKeys(apiKeys || {})
    }

    loadAgents()
    fetchApiKey()
    return () => { mounted = false }
  }, [selectedTeam?.id])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const [state, setState] = useMultiState({
    isSending: false,
    rebuilding: false,
    loadingAgentList: false,
    agents: {} as Record<number, AgentEntry>,
    selectedAgent: null as number | null,
  })

  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible)
  }

  const handleResetChat = () => {
    setMessages([])
    setActiveChat(null)
    setState({ selectedAgent: null })
    setSidebarVisible(false)
  }

  useEffect(() => {
    if (!loading && !error) {
      setState({ agents: loadedAgents })
    }
  }, [loading, error, loadedAgents, setState])

  const [chatHistory, setChatHistory] = useState<ChatSession[]>([])

  useEffect(() => {
    const loadChatHistory = async () => {
      if (!user?.id || !selectedTeam?.id) return
      
      try {
        const { data: sessions, error } = await getChatSessions(user.id, selectedTeam.id)
        if (error) {
          console.error("Error loading chat history:", error)
          return
        }
        setChatHistory(sessions || [])
      } catch (error) {
        console.error("Error loading initial chat history:", error)
      }
    }

    loadChatHistory()
  }, [user?.id, selectedTeam?.id])

  const handleLoadChatHistory = (chatSession: ChatSession) => {
    setIsLoadingFromHistory(true)
    setActiveChat(chatSession)

    setTimeout(() => {
      const messages = chatSession.messages || []
      setMessages(messages)

      const selectedAgents = chatSession.selectedAgents || []

      setState({
        selectedAgent: selectedAgents.length > 0 ? selectedAgents[0] : null,
      })

      setMessage(prev => prev + "")
      setIsLoadingFromHistory(false)
    }, 50)
  }

  function selectAgent(id: number) {
    setState({ selectedAgent: id })
    setMessages([])
    setActiveChat(null)
  }

  const label =
    state.selectedAgent !== null
      ? state.agents[state.selectedAgent]?.name || "Select Agent"
      : "Select Agent"

  const onSelectAgent = (e: string[] | string) => {
    console.log("Selecting agent:", e)

    const previousSelectedAgent = state.selectedAgent

    if (!e || (Array.isArray(e) && e.length === 0)) {
      setState({ selectedAgent: null })
      return
    }

    let newSelectedAgent: number | null = null

    if (Array.isArray(e)) {
      newSelectedAgent = e.length > 0 ? Number(e[0]) : null
    } else if (typeof e === "string") {
      newSelectedAgent = Number(e)
    }

    const selectionChanged = previousSelectedAgent !== newSelectedAgent

    setState({ selectedAgent: newSelectedAgent })

    if (selectionChanged) {
      setMessages([])
      setActiveChat(null)
    }
  }

  async function addLog(p: { worker: any; state: any }, id: string) {
    const handles = p.worker?.handlersArray?.map((h: any) => ({ [h.name]: h.value })) || []
    const logData = {
      team_id: selectedTeam?.id,
      agent: state.selectedAgent ? state.agents[state.selectedAgent]?.id : null,
      worker: p.worker.config.type,
      state: p.state,
      handles,
      execution: id
    }
    const { data, error } = await supabase.from('logs').insert(logData).select().single()
    return { data, error }
  }

  function onWorkerExecuted(p: { worker: any; state: any }, id: string) {
    console.log(
      `[Worker Executed] type="${p.worker.config.type}", state=`,
      p.state
    )
    addLog(p, id)
    const execution: WorkerExecution = {
      timestamp: Date.now(),
      worker: p.worker,
      state: p.state
    }

    setWorkerExecutions(prev => [...prev, execution])
  }

  async function onSend(userText?: string, audio?: Blob, tts?: boolean) {
    if (!userText && !audio) return
    setState({ isSending: true })

    const currentUid = activeChat?.uid ?? crypto.randomUUID()
    setWorkerExecutions([])

    let inputData: any
    let isJsonInput = false
    
    try {
      if (userText && userText.trim().startsWith('{') && userText.trim().endsWith('}')) {
        inputData = JSON.parse(userText)
        isJsonInput = true
      } else if (userText && userText.trim().startsWith('[') && userText.trim().endsWith(']')) {
        inputData = JSON.parse(userText)
        isJsonInput = true
      } else {
        inputData = userText || ""
      }
    } catch (e) {
      inputData = userText || ""
    }

    const humanMsg: AgentChatMessage = { 
      type: "human", 
      message: isJsonInput ? JSON.stringify(inputData, null, 2) : (userText || "")
    }
    const updatedMessages = [...messages, humanMsg]
    setMessages(updatedMessages)

    const selectedAgent = state.selectedAgent ? state.agents[state.selectedAgent] : null
    let reply: AgentChatMessage
    if (selectedAgent) {
      try {
        const entry = selectedAgent as AgentEntry;
        const worker = await agents.loadAgent(Number(entry.id));

        // Convert messages to ChatHistory format for conversational agents
        const chatHistory: ChatHistory = updatedMessages.map(msg => {
          if (msg.type === "human") {
            return {
              role: "user",
              content: typeof msg.message === "string" ? msg.message : JSON.stringify(msg.message)
            };
          } else {
            return {
              role: "assistant", 
              content: typeof msg.message === "string" ? msg.message : JSON.stringify(msg.message)
            };
          }
        });

        const logId = crypto.randomUUID()

        // Check if this is a conversational agent and use appropriate input format
        const isConversationalAgent = worker.isConversational;
        
        let parameters: AgentParameters;
        
        if (isConversationalAgent) {
          // Use the same input format as chat.tsx for conversational agents
          parameters = {
            input: {
              message: isJsonInput ? JSON.stringify(inputData) : (userText || ""),
              history: chatHistory.slice(0, -1) // Exclude the current message from history
            },
            apiKeys: apiKeys,
            state: {
              agent: {},
              workers: {}
            },
            uid: currentUid,
            logWriter: (p) => onWorkerExecuted(p, logId),
          };
        } else {
          // Use the existing format for non-conversational agents
          const conversationHistory = updatedMessages.map(msg => {
            const sender = (msg.type === "human") ? "User" : "Bot";
            let messageContent = "";

            if (msg.type === "human") {
              messageContent = typeof msg.message === "string" ? msg.message : JSON.stringify(msg.message);
            } else if (msg.type === "agent") {
              messageContent = typeof msg.message === "string" ? msg.message : JSON.stringify(msg.message);
            }

            return sender + ": " + messageContent;
          }).join("\n");

          parameters = {
            input: {
              ...(isJsonInput ? inputData : { question: userText || "" }),
              conversation_history: conversationHistory,
              uid: currentUid
            },
            apiKeys: apiKeys,
            state: {
              agent: {},
              workers: {}
            },
            uid: currentUid,
            logWriter: (p) => onWorkerExecuted(p, logId),
          };
        }

        await worker.execute(parameters);

        reply = {
          type: "agent",
          message: parameters.output,
          messages: [{
            id: Number(entry.id),
            agentName: entry.name,
            message: parameters.output,
            needsRebuild: false
          }],
          needsRebuild: false,
        }
      } catch {
        reply = { type: "agent", message: "Error processing request.", messages: [], needsRebuild: false };
      }
    } else {
      reply = { type: "agent", message: "No agent selected", messages: [], needsRebuild: false };
    }

    const finalMessages = [...updatedMessages, reply];
    setMessages(finalMessages);

    const newSession: ChatSession = {
      uid: currentUid,
      agentName: state.selectedAgent ? state.agents[state.selectedAgent]?.name ?? "Chat" : "Chat",
      selectedAgents: state.selectedAgent ? [state.selectedAgent] : [],
      messages: finalMessages,
      timestamp: new Date().toISOString(),
    }

    setActiveChat(newSession);
    
    if (user?.id && selectedTeam?.id) {
      const agentId = state.selectedAgent?.toString() || 'unknown'
      
      try {
        const userMessage = finalMessages[finalMessages.length - 2]
        const assistantMessage = finalMessages[finalMessages.length - 1]
        
        if (userMessage) {
          const userContent = typeof userMessage.message === 'string' 
            ? userMessage.message 
            : JSON.stringify(userMessage.message)
          await saveChatMessage(user.id, agentId, selectedTeam.id, 'user', userContent)
        }
        
        if (assistantMessage) {
          const assistantContent = typeof assistantMessage.message === 'string' 
            ? assistantMessage.message 
            : JSON.stringify(assistantMessage.message)
          await saveChatMessage(user.id, agentId, selectedTeam.id, 'assistant', assistantContent)
        }
        
        const { data: updatedSessions } = await getChatSessions(user.id, selectedTeam.id)
        setChatHistory(updatedSessions || [])
      } catch (error) {
        console.error('Error saving chat history:', error)
      }
    }

    setState({ isSending: false });
  }

  const hasSelectedAgents = state.selectedAgent !== null

  return (
    <div className="h-screen flex flex-col">
      <div className="flex flex-1 min-h-0">
        <div className="flex-1 flex flex-col">
          <div className="py-4 border-b flex justify-between items-center bg-white px-4 flex-shrink-0">
            <h2 className="text-2xl font-bold tracking-tight">Playground</h2>
            <div className="flex items-center gap-2">
              <div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full justify-between">
                      {label}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-60 max-h-60 overflow-y-auto p-1">
                    <DropdownMenuGroup>
                      <DropdownMenuLabel>Select Agent</DropdownMenuLabel>
                      <DropdownMenuRadioGroup 
                        value={state.selectedAgent?.toString() || ""} 
                        onValueChange={(value) => selectAgent(Number(value))}
                      >
                        {Object.entries(state.agents)
                          .map(([key, a]) => (
                            <DropdownMenuRadioItem
                              key={key}
                              value={key}
                            >
                              {a.name}
                            </DropdownMenuRadioItem>
                          ))}
                      </DropdownMenuRadioGroup>
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <Button
                onClick={toggleSidebar}
                size="sm"
                variant="ghost"
                className="flex items-center gap-1"
              >
                <History className="h-5 w-5" />
              </Button>
            </div>
          </div>
          <div
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto min-h-0"
          >
            <div className="p-4 space-y-4">
              <div className="flex flex-col space-y-6 w-full">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full min-h-[65vh]">
                    <h1
                      className="text-4xl font-bold text-center text-transparent bg-clip-text gradient-text-animation slide-reveal-greeting"
                      style={{
                        backgroundImage: 'linear-gradient(to right, #6286F7, #EA5850)',
                      }}
                    >
                      Hello, how can I help you?
                    </h1>
                  </div>
                ) : (
                  messages.map((m, i) => (
                    <ChatMessageComponent
                      key={m.id || i}
                      message={m}
                      isWaiting={state.isSending && i === messages.length - 1}
                      isLoadingFromHistory={isLoadingFromHistory}
                    />
                  ))
                )}
                {workerExecutions.length > 0 && (
                  <ExecutionLogDisplay 
                  executions={workerExecutions}
                  isVisible={showExecutionLogs}
                  onToggle={() => setShowExecutionLogs(!showExecutionLogs)}
                />
                )}
                {state.isSending && (
                  <div className="flex justify-start w-fit">
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 rounded-full animate-typing-1 bg-gradient-to-r from-pink-500 to-violet-500"></div>
                      <div className="w-1.5 h-1.5 rounded-full animate-typing-2 bg-gradient-to-r from-violet-500 to-cyan-500"></div>
                      <div className="w-1.5 h-1.5 rounded-full animate-typing-3 bg-gradient-to-r from-cyan-500 to-pink-500"></div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>
          </div>
          <div className="bg-white pb-4 pt-2 px-4 flex-shrink-0 border-t">
            {hasSelectedAgents ? (
              <>
                <SearchInput
                  onSearch={onSend}
                  disabled={state.isSending}
                />
                <p className="text-xs text-gray-500 text-center mt-2">
                  Signpost AI is experimental. Please validate results. Supports both text and JSON input.
                </p>
              </>
            ) : (
              <div className="flex justify-center items-center py-4 text-gray-500">
                Select an agent to start chatting
              </div>
            )}
          </div>
        </div>
        <div className={`flex-shrink-0 flex flex-col transition-all duration-300 border-l ${sidebarVisible ? 'w-1/4' : 'w-0 overflow-hidden border-none'
          }`}>
          <div className="py-4 flex justify-between items-center bg-white px-4 flex-shrink-0">
            <h2 className="text-2xl font-bold tracking-tight ml-2">Chat History</h2>
            <Button
              onClick={handleResetChat}
              size="sm"
              variant="ghost"
              className="flex items-center gap-1"
            >
              <MessageSquarePlus />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto min-h-0">
            <div className="p-4">
              <ChatHistory
                setActiveChat={handleLoadChatHistory}
                onSelectAgent={(agentIds) => {
                  onSelectAgent(agentIds)
                }}
                agents={state.agents}
                chatHistory={chatHistory}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
