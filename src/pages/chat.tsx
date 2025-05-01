"use client"
const LOCAL_STORAGE_KEY = "chatHistory"

import { useEffect, useRef, useState } from 'react'
import { api } from '@/api/getBots'
import { app } from '@/lib/app'
import { MessageSquarePlus, AudioWaveform, ArrowUp, CirclePlus, Circle, Copy, Check, History } from 'lucide-react'
import AgentJsonView from '@/bot/agentview'
import { Button } from '@/components/ui/button'
import { useMultiState } from '@/hooks/use-multistate'
import { BotEntry, useAllBots } from '@/hooks/use-all-bots'
import { Comm } from '../bot/comm'
import { BotChatMessage } from '@/bot/botmessage'
import { ChatHistory, ChatSession } from '@/bot/history'
import { BotHistory } from '@/types/types.ai'
import type { ChatMessage } from '@/types/types.ai'
import { SearchInput } from '@/bot/search'
import { useReactMediaRecorder } from "react-media-recorder"
import { agents } from "@/lib/agents"
import { availableSources } from "@/components/source_input/files-modal"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { MultiSelectDropdown } from '@/components/ui/multiselect'
import type { Option } from '@/components/ui/multiselect'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuGroup,
  DropdownMenuSeparator, DropdownMenuCheckboxItem,} from "@/components/ui/dropdown-menu"
import ChatMessageComponent from "@/bot/chatmessage"
import "../index.css"


// Helper function to check for image URLs
export const isImageUrl = (url: string | undefined | null): boolean => {
  if (!url) return false;
  return /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i.test(url);
};

// Helper function to parse markdown image and text
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
};

export default function Chat() {
  const {bots, loading, error} = useAllBots()
  const [sidebarVisible, setSidebarVisible] = useState(false)
  const [showFileDialog, setShowFileDialog] = useState(false)
  const [selectedSources, setSelectedSources] = useState<string[]>([])
  const [sources, setSources] = useState(availableSources)
  const [message, setMessage] = useState("")
  const [activeChat, setActiveChat] = useState<ChatSession | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoadingFromHistory, setIsLoadingFromHistory] = useState(false)
  const chatContainerRef = useRef<HTMLDivElement>(null);

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


  useEffect(() => {
    setSources(availableSources)
  }, [availableSources])

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
    if (chatSession.messages && chatSession.messages.length > 0) {
      setMessages([...chatSession.messages])
    } else {
      setMessages([])
    }
    
    if (chatSession.selectedBots && chatSession.selectedBots.length > 0) {
      setState({ selectedBots: [...chatSession.selectedBots] })
    } else if (chatSession.botName) {
  
      const botEntry = Object.entries(state.bots).find(
        ([_, bot]) => bot.name === chatSession.botName
      )

      if (botEntry) {
        const botId = Number(botEntry[0])
        setState({ selectedBots: [botId] })
      }
    }
    
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
    : "Select Bots & Agents…"

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
  setState({ isSending: true });

  const humanMsg: ChatMessage = {
    type:    "human",
    message: userText || "",
  };
  setMessages(prev => [...prev, humanMsg]);

  const selected = state.selectedBots.map(id => state.bots[id]);

  let reply: ChatMessage;

  const agentEntry = selected.find(b => b.type === "agent");
  if (agentEntry) {
    const worker = await agents.loadAgent(Number(agentEntry.id));

    const historyText = messages
      .map(m =>
        m.type === "human"
          ? `User: ${m.message}`
          : `Assistant: ${
              m.messages?.find(x => x.id === Number(agentEntry.id))?.message
              || m.message
            }`
      )
      .join("\n\n");

    const parameters: AgentParameters = {
      input:   { question: historyText },
      apikeys: app.getAPIkeys(),
    };
    await worker.execute(parameters);
    const outputText = parameters.output as string;
    agentEntry.history.push({ isHuman: false, message: outputText });

    reply = {
      type: "bot",
      message: outputText,
      messages: [{
        id:         Number(agentEntry.id),
        botName:    agentEntry.name,
        message:    outputText,
        needsRebuild: false,
      }],
      needsRebuild: false,
    };
  } else {
    const config = selected.map(b => ({
      label: b.name,
      value: Number(b.id),
      history: b.history,
    }));
    const res = await api.askbot({ message: userText, audio }, tts, config);
    res.messages.forEach(m => {
      const bot = state.bots[m.id];
      bot.history.push({ isHuman: false, message: m.message });
    });

    reply = {
      type:        "bot",
      message:     res.message || "",
      messages:    res.messages || [],
      needsRebuild: res.needsRebuild || false,
      rebuild:     res.rebuild,
    };
  }

  setMessages(prev => [...prev, reply]);

  setChatHistory(prev => [
    {
      id:           new Date().toISOString(),
      botName:      state.bots[state.selectedBots[0]]?.name ?? "Chat",
      selectedBots: [...state.selectedBots],
      messages:     [humanMsg, reply],
      timestamp:    new Date().toISOString(),
    },
    ...prev,
  ]);

  setState({ isSending: false });
}


  const handleToggleSelect = (id: string) => {
    setSelectedSources(prev =>
      prev.includes(id)
        ? prev.filter(sourceId => sourceId !== id)
        : [...prev, id]
    )
  }

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedSources(event.target.checked ? sources.map(source => source.id) : [])
  }

  const handleAttachFiles = () => {
    const selectedContent = selectedSources.map(id => sources.find(source => source.id === id))
      .filter(Boolean)
      .map(source => `<h2>${source?.name}</h2>\n${source?.content}`)
      .join('\n\n')

    if (selectedContent) {
      setMessage(prevMessage => prevMessage + '\n\n' + selectedContent)
    }
    setShowFileDialog(false)
    setSelectedSources([])
  }

  function onModeChanged() {
    setState({ audioMode: !state.audioMode })
  }

  function onExitAudioMode() {
    setState({ audioMode: false })
    console.log("Exiting audio mode")
  }

  const hasSelectedBots = state.selectedBots.length > 0
  const options: Option[] = Object.keys(state.bots).map((k) => ({
    label: state.bots[Number(k)].name,
    value: k,
  }))

  // Scroll Effect for new messages
  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    // Always scroll to the bottom smoothly when messages change
    container.scrollTo({
      top: container.scrollHeight, // Scroll to the very bottom
      behavior: 'smooth'
    });

  }, [messages]); // Dependency array includes messages

  return (
    <div className="relative" style={{ height: "calc(100vh - 40px)" }}>
      <div className="flex h-full">
        <div className="flex-1 flex flex-col relative">
          <div className="py-4 border-b flex justify-between items-center bg-white px-4">
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
            <DropdownMenuLabel>Bots</DropdownMenuLabel>
            {Object.entries(state.bots)
              .filter(([, b]) => b.type === "api")
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
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuLabel>Agents</DropdownMenuLabel>
            {Object.entries(state.bots)
              .filter(([, b]) => b.type === "agent")
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
            ref={chatContainerRef}
            className="overflow-y-auto chat-messages-container flex-1"
            style={{ paddingBottom: "180px" }}
          >
            <div className="p-4 space-y-4">
              {!state.audioMode && (
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
                        isWaiting={state.isSending && i === messages.length -1}
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
                </div>
              )}
              {state.audioMode && hasSelectedBots && (
                <Comm 
                  bot={state.selectedBots[0]} 
                  onExit={onExitAudioMode} 
                />
              )}
            </div>
          </div>
          
          {!state.audioMode && (
            <div className="bg-white pb-6 pt-2 px-4 sticky bottom-0 z-10">
              {hasSelectedBots ? (
                <>
                  <SearchInput 
                    onSearch={onSend} 
                    disabled={state.isSending} 
                    openFileDialog={() => setShowFileDialog(true)}
                    audioMode={state.audioMode}
                    onModeChanged={onModeChanged}
                  />
                  <p className="text-xs text-gray-500 text-center mt-2">
                    Signpost AI is experimental. Please validate results.
                  </p>
                </>
              ) : (
                <div className="flex justify-center items-center py-4 text-gray-500">
                  {/* Remove this span */}
                  {/* <span>Please select a bot to start chatting</span> */}
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className={`flex flex-col transition-all duration-300 border-l ${
         sidebarVisible ? 'w-1/4' : 'w-0 overflow-hidden border-none'
          }`}>
          <div className="py-4 flex justify-between items-center bg-white px-4">
            <h2 className="text-2xl font-bold tracking-tight ml-2">Chat History</h2>
            <Button 
              onClick={handleResetChat}
              size="sm" 
              variant="ghost"
              className="flex items-center gap-1"
            >
              <MessageSquarePlus/>
            </Button>
          </div>
          
          <div 
            className="overflow-y-auto" 
            style={{ height: "calc(100% - 100px)" }}
          >
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
      <Dialog open={showFileDialog} onOpenChange={setShowFileDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Attach Files</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <div className="flex justify-end mt-4 gap-2">
              <Button
                variant="outline"
                onClick={() => setShowFileDialog(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAttachFiles}
                disabled={selectedSources.length === 0}
              >
                Attach Selected
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
