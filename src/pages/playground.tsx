"use client"
const LOCAL_STORAGE_KEY = "chatHistory"

import { useEffect, useRef, useState } from 'react'
import { app } from '@/lib/app'
import { MessageSquarePlus, History } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useMultiState } from '@/hooks/use-multistate'
import { ChatHistory, ChatSession } from '@/pages/playground/history'
import type { ChatMessage } from '@/types/types.ai'
import { SearchInput } from "@/pages/playground/search"
import { agents } from "@/lib/agents"
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuGroup, DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu"
import ChatMessageComponent from "@/pages/playground/chatmessage"
import "../index.css"
import { agentsModel } from "@/lib/data"

interface BotEntry {
  id: string
  name: string
  history: any[]
  type: "agent"
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

export default function Chat() {
  const [bots, setBots] = useState<Record<number, BotEntry>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [sidebarVisible, setSidebarVisible] = useState(false)
  const [message, setMessage] = useState("")
  const [activeChat, setActiveChat] = useState<ChatSession | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoadingFromHistory, setIsLoadingFromHistory] = useState(false)
  const messagesEndRef = useRef(null)
  const messagesContainerRef = useRef(null)

  useEffect(() => {
    let mounted = true

    async function loadAgents() {
      try {
        const { data: adata, error: aerr } = await agentsModel.data.select("id, title")
        if (aerr) throw aerr

        const agentBots = (adata || []).reduce<Record<number, BotEntry>>((acc, a) => {
          acc[a.id] = { id: String(a.id), name: a.title, history: [], type: "agent" }
          return acc
        }, {})

        if (mounted) setBots(agentBots)
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
    loadingBotList: false,
    bots: {} as Record<number, BotEntry>,
    selectedBots: [] as number[],
    audioMode: false,
  })

  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible)
  }

  const handleResetChat = () => {
    setMessages([])
    setActiveChat(null)
    setState({ selectedBots: [] })
    setSidebarVisible(false)
  }

  useEffect(() => {
    if (!loading && !error) {
      setState({ bots })
    }
  }, [loading, error, bots, setState])

  const [chatHistory, setChatHistory] = useState<ChatSession[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedChats = localStorage.getItem(LOCAL_STORAGE_KEY)
        if (savedChats) {
          const parsedChats = JSON.parse(savedChats)
          return Array.isArray(parsedChats) ? parsedChats : []
        }
      } catch (error) {
        console.error("Error loading initial chat history:", error)
      }
    }
    return []
  })

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(chatHistory))
  }, [chatHistory])

  const handleLoadChatHistory = (chatSession: ChatSession) => {
    setIsLoadingFromHistory(true)
    setActiveChat(chatSession)

    setTimeout(() => {
      const messages = chatSession.messages || []
      setMessages(messages)

      const selectedBots = chatSession.selectedBots || []

      const updatedBots = { ...state.bots }

      selectedBots.forEach(botId => {
        const bot = updatedBots[botId]
        if (bot) {
          bot.history = messages.map(m => ({
            isHuman: m.type === "human",
            message: m.message
          }))
        }
      })

      setState({
        selectedBots,
        bots: updatedBots
      })

      setMessage(prev => prev + "")
      setIsLoadingFromHistory(false)
    }, 50)
  }

  function toggleBot(id: number) {
    const next = state.selectedBots.includes(id)
      ? state.selectedBots.filter(x => x !== id)
      : [...state.selectedBots, id]
    setState({ selectedBots: next })
    setMessages([])
    setActiveChat(null)
  }

  const label =
    state.selectedBots.length > 0
      ? state.selectedBots.map(id => state.bots[id].name).join(", ")
      : "Select Agent"

  const onSelectBot = (e: string[] | string) => {
    console.log("Selecting bot:", e)

    const previousSelectedBot = state.selectedBots.length > 0 ? state.selectedBots[0] : null

    if (!e || (Array.isArray(e) && e.length === 0)) {
      setState({ selectedBots: [] })
      return
    }

    let newSelectedBots: number[] = []

    if (Array.isArray(e)) {
      newSelectedBots = e.map(Number)
      setState({ selectedBots: newSelectedBots })
    } else if (typeof e === "string") {
      newSelectedBots = [Number(e)]
      setState({ selectedBots: newSelectedBots })
    }

    const selectionChanged =
      previousSelectedBot !== newSelectedBots[0] ||
      state.selectedBots.length !== newSelectedBots.length ||
      !state.selectedBots.every(id => newSelectedBots.includes(id))

    if (selectionChanged) {
      setMessages([])
      setActiveChat(null)
    }
  }

  async function onSend(userText?: string, audio?: Blob, tts?: boolean) {
    if (!userText && !audio) return;
    setState({ isSending: true })
    const humanMsg: ChatMessage = {
      type: "human",
      message: userText || "",
    };

    const updatedMessages = [...messages, humanMsg]

    setMessages(updatedMessages)

    const selected = state.selectedBots.map(id => state.bots[id])
    let reply: ChatMessage

    const agentEntry = selected.find(b => b.type === "agent")
    if (agentEntry) {
      const worker = await agents.loadAgent(Number(agentEntry.id))

      const newHumanMessage = {
        isHuman: true,
        message: userText || "",
      }
      agentEntry.history.push(newHumanMessage)

      const ensureString = (value: any): string => {
        if (value == null) return "";
        if (typeof value === "string") return value;
        try {
          return JSON.stringify(value);
        } catch {
          return String(value);
        }
      }

      const historyText = agentEntry.history.map(m =>
        `${m.isHuman ? "User" : "Assistant"}: ${ensureString(m.message)}`
      ).join("\n\n")

      const parameters: AgentParameters = {
        input: { question: historyText },
        apikeys: app.getAPIkeys(),
      }

      console.log("AGENT INPUT", parameters.input.question)

      await worker.execute(parameters);

      const outputText = parameters.output as string;

      agentEntry.history.push({
        isHuman: false,
        message: outputText,
      });

      reply = {
        type: "bot",
        message: outputText,
        messages: [{
          id: Number(agentEntry.id),
          botName: agentEntry.name,
          message: outputText,
          needsRebuild: false,
        }],
        needsRebuild: false,
      }
    } else {
      reply = {
        type: "bot",
        message: "No agent selected",
        messages: [],
        needsRebuild: false,
      };
    }

    const finalMessages = [...updatedMessages, reply]
    setMessages(finalMessages)

    if (!activeChat) {
      const newChatSession: ChatSession = {
        id: new Date().toISOString(),
        botName: state.bots[state.selectedBots[0]]?.name ?? "Chat",
        selectedBots: [...state.selectedBots],
        messages: [humanMsg, reply],
        timestamp: new Date().toISOString(),
      };
      setActiveChat(newChatSession);
      setChatHistory(prev => [newChatSession, ...prev])
    } else {
      const updatedChatWithResponse: ChatSession = {
        ...activeChat,
        messages: [...activeChat.messages, humanMsg, reply],
        selectedBots: [...state.selectedBots],
      };
      setActiveChat(updatedChatWithResponse)
      setChatHistory(prev =>
        prev.map(chat => chat.id === updatedChatWithResponse.id ? updatedChatWithResponse : chat)
      );
    }

    setState({ isSending: false })
  }

  const hasSelectedBots = state.selectedBots.length > 0

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
                      {Object.entries(state.bots)
                        .map(([key, b]) => (
                          <DropdownMenuCheckboxItem
                            key={key}
                            checked={state.selectedBots.includes(Number(key))}
                            onCheckedChange={() => toggleBot(Number(key))}
                          >
                            {b.name}
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
            {hasSelectedBots ? (
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
                onSelectBot={(botIds) => {
                  onSelectBot(botIds)
                }}
                bots={state.bots}
                chatHistory={chatHistory}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}