"use client"

import { useEffect, useRef, useState } from 'react'
import { app } from '@/lib/app'
import { MessageSquarePlus, History } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useMultiState } from '@/hooks/use-multistate'
import { ChatHistory, ChatSession } from '@/pages/playground/history'
import type { AgentChatMessage } from '@/types/types.ai'
import { SearchInput } from "@/pages/playground/search"
import { agents } from "@/lib/agents"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuGroup, DropdownMenuCheckboxItem } from "@/components/ui/dropdown-menu"
import ChatMessageComponent from "@/pages/playground/chatmessage"
import "../index.css"
import { agentsModel } from "@/lib/data"

interface AgentEntry {
  id: string
  name: string
  type: "agent"
}

export const isImageUrl = (url: string | undefined | null): boolean => {
  if (!url) return false;
  return /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i.test(url)
};

export const parseMarkdownImage = (text: string | undefined | null): { imageUrl: string | null;remainingText: string | null } => {
  if (!text) return { imageUrl: null, remainingText: null }

  const markdownRegex = /^!?\[.*?\]\((.+?)\)\s*(.*)$/s
  const match = text.match(markdownRegex)

  if (match && match[1]) {
    const imageUrl = match[1];
    const remainingText = match[2] ? match[2].trim() : null
    if (isImageUrl(imageUrl)) {
      return { imageUrl, remainingText }
    }
  }

  return { imageUrl: null, remainingText: null }
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
  const [chatHistory, setChatHistory] = useState<ChatSession[]>([])
  const messagesEndRef = useRef(null)
  const messagesContainerRef = useRef(null)

  useEffect(() => {
    let mounted = true

    async function loadAgents() {
      try {
        const { data: adata, error: aerr } = await agentsModel.data.select("id, title")
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

    loadAgents()
    return () => { mounted = false }
  }, [])

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
    selectedAgents: [] as number[],
  })

  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible)
  }

  const handleResetChat = () => {
    setMessages([])
    setActiveChat(null)
    setState({ selectedAgents: [] })
    setSidebarVisible(false)
  }

  useEffect(() => {
    if (!loading && !error) {
      setState({ agents: loadedAgents })
    }
  }, [loading, error, loadedAgents, setState])

  const handleLoadChatHistory = (chatSession: ChatSession) => {
    setIsLoadingFromHistory(true)
    setActiveChat(chatSession)

    setTimeout(() => {
      const messages = chatSession.messages || []
      setMessages(messages)

      const selectedAgents = chatSession.selectedAgents || []

      setState({
        selectedAgents,
      })

      setMessage(prev => prev + "")
      setIsLoadingFromHistory(false)
    }, 50)
  }

  function toggleAgent(id: number) {
    const next = state.selectedAgents.includes(id)
      ? state.selectedAgents.filter(x => x !== id)
      : [...state.selectedAgents, id]
    setState({ selectedAgents: next })
    setMessages([])
    setActiveChat(null)
  }

  const label =
    state.selectedAgents.length > 0
      ? state.selectedAgents.map(id => state.agents[id]?.name).filter(Boolean).join(", ")
      : "Select Agent"

  const onSelectAgent = (e: string[] | string) => {
    console.log("Selecting agent:", e)

    const previousSelectedAgent = state.selectedAgents.length > 0 ? state.selectedAgents[0] : null

    if (!e || (Array.isArray(e) && e.length === 0)) {
      setState({ selectedAgents: [] })
      return
    }

    let newSelectedAgents: number[] = []

    if (Array.isArray(e)) {
      newSelectedAgents = e.map(Number)
      setState({ selectedAgents: newSelectedAgents })
    } else if (typeof e === "string") {
      newSelectedAgents = [Number(e)]
      setState({ selectedAgents: newSelectedAgents })
    }

    const selectionChanged =
      previousSelectedAgent !== newSelectedAgents[0] ||
      state.selectedAgents.length !== newSelectedAgents.length ||
      !state.selectedAgents.every(id => newSelectedAgents.includes(id))

    if (selectionChanged) {
      setMessages([])
      setActiveChat(null)
    }
  }

  const formatConversationHistory = (messages: AgentChatMessage[]) => {
    return messages.map(msg => ({
      type: msg.type,
      message: msg.message,
      timestamp: new Date().toISOString()
    }))
  }

  async function onSend(userText?: string, audio?: Blob, tts?: boolean) {
    if (!userText && !audio) return
    setState({ isSending: true })

    const currentUid = activeChat?.uid ?? crypto.randomUUID()

    const humanMsg: AgentChatMessage = { type: "human", message: userText || "" }
    const updatedMessages = [...messages, humanMsg]
    setMessages(updatedMessages)

    const selected = state.selectedAgents.map(id => state.agents[id]).filter(Boolean)
    let reply: AgentChatMessage

    if (selected.length) {
      try {
        const entry = selected[0] as AgentEntry;
        const worker = await agents.loadAgent(Number(entry.id));
        
        const payload = {
          id: Number(entry.id),
          question: userText || "",
          conversation_history: formatConversationHistory(updatedMessages),
          uid: currentUid
        }
  
        const parameters = {
          input: payload,
          apikeys: app.getAPIkeys(),
          uid: currentUid,
          output: undefined
        }

        await worker.execute(parameters)
        
        reply = {
          type: "agent",
          message: parameters.output || "No response received",
          messages: [{
            id: Number(entry.id),
            agentName: entry.name,
            message: parameters.output || "No response received",
            needsRebuild: false
          }],
          needsRebuild: false,
        }
      } catch (error) {
        console.error("Error processing request:", error)
        reply = { 
          type: "agent", 
          message: "Error processing request.", 
          messages: [], 
          needsRebuild: false 
        };
      }
    } else {
      reply = { 
        type: "agent", 
        message: "No agent selected", 
        messages: [], 
        needsRebuild: false 
      };
    }

    const finalMessages = [...updatedMessages, reply]
    setMessages(finalMessages);

    const newSession: ChatSession = {
      uid: currentUid,
      agentName: state.agents[state.selectedAgents[0]]?.name ?? "Chat",
      selectedAgents: [...state.selectedAgents],
      messages: finalMessages,
      timestamp: new Date().toISOString(),
    }

    setActiveChat(newSession);
    setChatHistory(prev => {
      const exists = prev.find(c => c.uid === currentUid)
      if (exists) {
        return prev.map(c => c.uid === currentUid ? newSession : c)
      } else {
        return [newSession, ...prev]
      }
    })

    setState({ isSending: false })
  }

  const hasSelectedAgents = state.selectedAgents.length > 0

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
                      <DropdownMenuLabel>Agents</DropdownMenuLabel>
                      {Object.entries(state.agents)
                        .map(([key, a]) => (
                          <DropdownMenuCheckboxItem
                            key={key}
                            checked={state.selectedAgents.includes(Number(key))}
                            onCheckedChange={() => toggleAgent(Number(key))}
                          >
                            {a.name}
                          </DropdownMenuCheckboxItem>
                        ))}
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
                  Signpost AI is experimental. Please validate results.
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