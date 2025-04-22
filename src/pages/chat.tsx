"use client"
const LOCAL_STORAGE_KEY = "chatHistory"

import { useEffect, useRef, useState } from 'react'
import { api } from '@/api/getBots'
import { app } from '@/lib/app'
import { ChevronLeft, ChevronRight, MessageSquarePlus, AudioWaveform, ArrowUp, CirclePlus, Circle, Copy, Check, History, ThumbsUp, ThumbsDown, Flag, Volume2, Code } from 'lucide-react'
import AgentJsonView from '@/bot/agentview'
import { Button } from '@/components/ui/button'
import { useMultiState } from '@/hooks/use-multistate'
import { Comm } from '../bot/comm'
import { BotChatMessage } from '@/bot/botmessage'
import { ChatHistory, ChatSession } from '@/bot/history'
import { BotHistory } from '@/types/types.ai'
import type { ChatMessage } from '@/types/types.ai'
import { useReactMediaRecorder } from "react-media-recorder"
import { agents } from "@/lib/agents"
import { availableSources } from "@/components/source_input/files-modal"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { MultiSelectDropdown } from '@/components/ui/multiselect'
import type { Option } from '@/components/ui/multiselect'
import "../index.css"

interface Bots {
  [index: number]: {
    name: string
    id: string
    history: BotHistory[]
  }
}

// Define constants for known agent IDs
const AGENT_ID_23 = 23;
const AGENT_ID_27 = 27;
const KNOWN_AGENT_IDS = [AGENT_ID_23, AGENT_ID_27];

// Helper function to check for image URLs
export const isImageUrl = (url: string | undefined | null): boolean => {
  if (!url) return false;
  // Basic check for http/https and common image extensions
  return /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i.test(url);
};

// Helper function to parse markdown image and text
export const parseMarkdownImage = (text: string | undefined | null): { imageUrl: string | null; remainingText: string | null } => {
  if (!text) return { imageUrl: null, remainingText: null };
  
  // Regex to capture ![alt](url) and any subsequent text
  // Allows optional leading '!' for formats like [![Image](...)]
  // Captures URL in group 1, remaining text in group 2
  const markdownRegex = /^!?\[.*?\]\((.+?)\)\s*(.*)$/s; 
  const match = text.match(markdownRegex);

  if (match && match[1]) {
    const imageUrl = match[1];
    const remainingText = match[2] ? match[2].trim() : null; // Get text after the markdown
    // Basic validation if the extracted URL looks like an image URL
    if (isImageUrl(imageUrl)) { 
      return { imageUrl, remainingText };
    }
  }
  
  // If no markdown match, return nulls
  return { imageUrl: null, remainingText: null };
};

export default function Chat() {
  const [sidebarVisible, setSidebarVisible] = useState(false)
  const [showFileDialog, setShowFileDialog] = useState(false)
  const [selectedSources, setSelectedSources] = useState<string[]>([])
  const [sources, setSources] = useState(availableSources)
  const [message, setMessage] = useState("")
  const [activeChat, setActiveChat] = useState<ChatSession | null>(null)
  const [agentInstance, setAgentInstance] = useState<any>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoadingFromHistory, setIsLoadingFromHistory] = useState(false)
  const chatContainerRef = useRef<HTMLDivElement>(null); // Ref for the scrollable container

  const [state, setState] = useMultiState({
    isSending: false,
    rebuilding: false,
    loadingBotList: false,
    bots: {} as Bots,
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
    async function initBots() {
      const sb = await api.getBots()
      const bots: Bots = {}
      for (const key in sb) {
        bots[Number(key)] = { name: sb[key], id: key, history: [] }
      }

      // Add known agents manually
      bots[AGENT_ID_23] = { name: `Agent ${AGENT_ID_23}`, id: AGENT_ID_23.toString(), history: [] }
      bots[AGENT_ID_27] = { name: `Aprendia Test`, id: AGENT_ID_27.toString(), history: [] }
      
      setState({ bots })
    }
    initBots()
  }, [])

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

  const onMultiSelectBot = (selected: number[]) => {
    if (JSON.stringify(state.selectedBots) !== JSON.stringify(selected)) {
      setState({ selectedBots: selected })
      setMessages([])
      setActiveChat(null)
    }
  }

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

  const onSend = async (message?: string, audio?: any, tts?: boolean) => {
    message ||= "where can i find english classes in athens?"
    if (!message && !audio) return

    const selectedBotsConfig = state.selectedBots.map(b => ({
      label: state.bots[b].name,
      value: b,
      history: state.bots[b].history,
    }))

    const currentBotName = state.selectedBots.length > 0
      ? state.bots[state.selectedBots[0]].name
      : "Chat"

    const userMessage: ChatMessage = { type: "human", message }
    if (message) {
      setMessages(prev => [...prev, userMessage])
    }

    let currentActiveChat: ChatSession
    if (!activeChat) {
      currentActiveChat = {
        id: new Date().toISOString(),
        botName: currentBotName,
        selectedBots: [...state.selectedBots], 
        messages: [userMessage],
        timestamp: new Date().toISOString(),
      }
      setActiveChat(currentActiveChat)
      setChatHistory(prev => [currentActiveChat, ...prev])
    } else {
      currentActiveChat = {
        ...activeChat,
        messages: [...activeChat.messages, userMessage],
        selectedBots: [...state.selectedBots], 
      }
      setActiveChat(currentActiveChat)
      setChatHistory(prev =>
        prev.map(chat =>
          chat.id === currentActiveChat.id ? currentActiveChat : chat
        )
      )
    }
    setState({ isSending: true })

    // Determine if an agent is selected and which one
    const selectedAgentId = state.selectedBots.find(id => KNOWN_AGENT_IDS.includes(id));
    const useAgent = selectedAgentId !== undefined;
    
    let botResponseForHistory: ChatMessage

    if (useAgent && selectedAgentId) {
      try {
        const agent = await agents.loadAgent(selectedAgentId); // Use the detected agent ID

        // Format the entire conversation history including the latest user message
        const formattedHistory = currentActiveChat.messages
          .map(msg => {
            if (msg.type === 'human') {
              return `User: ${msg.message}`;
            } else if (msg.type === 'bot') {
              // Extract bot message content (handle potential variations)
              let botContent = "[Bot message not found]";
              if (msg.messages && msg.messages.length > 0) {
                  // Prioritize agent-specific message if available, using the selectedAgentId
                  const agentMsg = msg.messages.find(m => m.id === selectedAgentId);
                  botContent = agentMsg?.message || msg.messages[0]?.message || msg.message || "[Empty bot message]";
              } else if (msg.message) {
                  botContent = msg.message;
              }
              return `Assistant: ${botContent}`;
            }
            return null; // Ignore other message types or malformed messages
          })
          .filter(Boolean) // Remove null entries
          .join('\\n\\n'); // Separate messages with double newline

        // Ensure the input object exists if it doesn't (though it should)
        const agentInput = { 
            question: formattedHistory // Pass the combined history string
        };

        const parameters: AgentParameters = {
          input: agentInput,
          apikeys: app.getAPIkeys(),
        };
        
        console.log(`Sending to agent ${selectedAgentId} with combined history in input:`, parameters); // Log for verification

        await agent.execute(parameters);
        
        // Set isSending to false *after* agent execution completes
        setState({ isSending: false }); 

        const raw = parameters.error
          ? `Agent error: ${parameters.error}`
          : parameters.output;

        const text = typeof raw === "string"
          ? raw
          : JSON.stringify(raw, null, 2)

        const rbot = state.bots[selectedAgentId]!; // Use the correct agent ID here
        if (!rbot.history.some(h => h.isHuman && h.message === message))
          rbot.history.push({ isHuman: true, message });
        if (!rbot.history.some(h => !h.isHuman && h.message === text))
          rbot.history.push({ isHuman: false, message: text });

        botResponseForHistory = {
          type: "bot",
          message: text,
          messages: [{
            id: selectedAgentId, // Use the correct agent ID here
            botName: `Agent ${selectedAgentId}`, // Use the correct agent ID here
            message: text,
            needsRebuild: false,
          }],
          needsRebuild: false
        };
      } catch (err: unknown) {
        let errorMsg = "Oops, something went wrong with the agent.";
        if (err && typeof err === "object") {
          const e = err as any;
          if (typeof e.message === "string") {
            errorMsg = e.message;
          } else if (typeof e.status === "number") {
            errorMsg = `Agent server returned ${e.status}`;
          }
        }
        botResponseForHistory = {
          type: "bot",
          message: errorMsg,
          messages: [{
            id: selectedAgentId, // Use the correct agent ID here
            botName: `Agent ${selectedAgentId}`, // Use the correct agent ID here
            message: errorMsg,
            needsRebuild: false,
          }],
          needsRebuild: false
        }
      }
    } else {
      // Fetch response from non-agent bot
      const response = message ? await api.askbot({ message }, tts, selectedBotsConfig) : await api.askbot({ audio }, tts, selectedBotsConfig)
      
      // Set isSending to false *after* API call completes
      setState({ isSending: false }); 

      if (!response.error) {
        for (const m of response.messages) {
          const rbot = state.bots[m.id]
          if (!rbot) continue

          if (
            !rbot.history.find(h => h.isHuman && h.message === message)
          ) {
            rbot.history.push({ isHuman: true, message })
          }
          if (!m.needsRebuild && !m.error) {
            if (
              !rbot.history.find(
                h => !h.isHuman && h.message === m.message
              )
            ) {
              rbot.history.push({
                isHuman: false,
                message: m.message,
              })
            }
          }
        }
      }

      response.rebuild = async () => {
        setState({ isSending: true }) // Keep true here for rebuild action
        response.needsRebuild = false
        await onRebuild()
        setState({ isSending: false }) // Set false after rebuild completes
      }

      botResponseForHistory = { type: "bot", message: response.message || "", messages: response.messages || [], needsRebuild: response.needsRebuild || false, rebuild: response.rebuild }
    }

    // Add the bot response to messages AFTER setting isSending to false
    setMessages(prev => [...prev, botResponseForHistory])

    const updatedChatWithResponse: ChatSession = {
      ...currentActiveChat, 
      messages: [...currentActiveChat.messages, botResponseForHistory],
      selectedBots: [...state.selectedBots], 
    }
    setActiveChat(updatedChatWithResponse)
    setChatHistory(prev => prev.map(chat => 
      chat.id === updatedChatWithResponse.id ? updatedChatWithResponse : chat
    ))
  }

  const onRebuild = async () => {
    setState({ isSending: true })
    const selectedBots = state.selectedBots.map(b => ({ label: state.bots[b].name, value: b, history: state.bots[b].history }))
    const response = await api.askbot({ command: "rebuild", }, false, selectedBots)
    setMessages(prev => [...prev, response])
    setState({ isSending: false })
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

    const lastMessage = messages[messages.length - 1];

    // Scroll bot messages to the top
    if (lastMessage?.type === 'bot') {
      const lastMessageElement = container.querySelector(':scope > div:last-child') as HTMLElement;
      if (lastMessageElement) {
        const topPadding = 20; // Pixels from the top
        const targetScrollTop = lastMessageElement.offsetTop - container.offsetTop - topPadding;
        
        container.scrollTo({
          top: targetScrollTop,
          behavior: 'smooth'
        });
      }
    } 
    // Optionally, scroll user messages fully into view at the bottom if needed
    // else if (lastMessage?.type === 'human') {
    //   container.scrollTo({
    //     top: container.scrollHeight,
    //     behavior: 'smooth'
    //   });
    // }

  }, [messages]); // Dependency array includes messages

  return (
    <div className="relative" style={{ height: "calc(100vh - 40px)" }}>
      <div className="flex h-full">
        <div className="flex-1 flex flex-col relative">
          <div className="py-4 border-b flex justify-between items-center bg-white px-4">
            <h2 className="text-2xl font-bold tracking-tight">Playground</h2>
            <div className="flex items-center gap-2">
              <div className={state.selectedBots.length === 0 ? 'empty-model-select rounded-md' : ''}>
                <MultiSelectDropdown 
                  options={options} 
                  selected={state.selectedBots} 
                  onChange={(selected) => {
                    setState({ selectedBots: selected })
                    setMessages([])
                    setActiveChat(null)
                  }}
                />
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
                      <ChatMessage 
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

function SearchInput(props: {
  onSearch: (message?: string, audio?: any, tts?: boolean) => void,
  disabled: boolean,
  openFileDialog: () => void,
  audioMode: boolean,
  onModeChanged: () => void
}) {
  const [value, setValue] = useState("")
  const [recordingComplete, setRecordingComplete] = useState<boolean>(false)
  const [tts, setTts] = useState<boolean>(false)
  const [isRecordingMode, setIsRecordingMode] = useState(false)

  const {
    status,
    startRecording,
    stopRecording,
    mediaBlobUrl,
    clearBlobUrl,
  } = useReactMediaRecorder({ audio: true })

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"; 
      // Set height based on the content scroll height
    }
  }, [value]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSearch(value)
    }
  }

  const handleSearch = (v: string) => {
    if (!v.trim()) return
    props.onSearch(v, '', tts)
    setValue("")
  }

  const handleToggleRecording = () => {
    if (status === "recording") {
      stopRecording()
      setRecordingComplete(true)
    } else {
      clearBlobUrl()
      startRecording()
      setRecordingComplete(false)
    }
  }

  const handleSendMessage = () => {
    if (value.trim()) {
      handleSearch(value)
    }
  }
  const blobToBase64 = (blob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  }

  const handleSendRecording = async () => {
    if (mediaBlobUrl) {
      const response = await fetch(mediaBlobUrl)
      const blob = await response.blob()
      const base64Data = await blobToBase64(blob)
      props.onSearch(undefined, base64Data, true)
      clearBlobUrl()
      setRecordingComplete(false)
      setIsRecordingMode(false)
    }
  }
  return (
    <div className="w-full">
      {isRecordingMode ? (
        <div className="relative">
          <div className="relative bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
            <div className="flex flex-col items-center p-6">
              <div className="text-lg font-medium text-gray-700 mb-6">
                {status === "recording" ? "Recording..." : "Ready to record"}
              </div>

              <Button 
                onClick={handleToggleRecording}
                className={`h-20 w-20 rounded-full flex items-center justify-center transition-colors ${
                  status === "recording" ? 'bg-red-500' : 'bg-gray-200 hover:bg-gray-300'
                }`}
              >
                {status === "recording" ? 
                  <Circle className="h-8 w-8 text-white" /> : 
                  <AudioWaveform className="h-8 w-8 text-gray-800" />
                }
              </Button>

              {mediaBlobUrl && (
                <>
                  <div className="mt-6 w-full max-w-md">
                    <audio 
                      controls 
                      src={mediaBlobUrl} 
                      className="w-full rounded-md shadow-sm border border-gray-300" 
                    />
                  </div>
                  
                  <Button
                    onClick={handleSendRecording}
                    className="mt-4 px-4 py-2 bg-black text-white rounded-full flex items-center hover:bg-gray-900"
                  >
                    <ArrowUp className="h-5 w-5 mr-2" />
                    <span>Send</span>
                  </Button>
                </>
              )}
              
              <Button
                onClick={() => setIsRecordingMode(false)}
                className="mt-6 text-gray-600 hover:text-gray-900"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSearch(value)
            }}
            className={`relative bg-white rounded-xl border border-gray-200 overflow-hidden ${
              !value.trim() 
                ? 'pulse-input-shadow' 
                : 'shadow-[4px_4px_20px_-4px_rgba(236,72,153,0.1),_-4px_4px_20px_-4px_rgba(124,58,237,0.1),_0_4px_20px_-4px_rgba(34,211,238,0.1)]'
            }`}
          >
            <div className="flex flex-col w-full">
              <div className="px-2 py-3 max-h-80 overflow-y-auto">
                <textarea
                  ref={textareaRef}
                  value={value}
                  onChange={handleSearchChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your message here."
                  className="w-full outline-none resize-none py-1 px-1 text-sm min-h-[40px] block"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                />
              </div>
              
              <div className="flex justify-between items-center p-2">
                <div>
                  <Button
                    type="button"
                    onClick={props.openFileDialog}
                    className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-black transition-colors p-1 hover:bg-gray-100 rounded-full border border-gray-200 bg-transparent"
                    variant="ghost"
                  >
                    <CirclePlus className="h-6 w-6" />
                  </Button>
                </div>
                
                <div>
                  <Button
                    type="button"
                    onClick={value.trim() ? handleSendMessage : props.onModeChanged}
                    className={`w-10 h-10 p-0 flex items-center justify-center rounded-full ${value.trim() ? 'bg-black text-white' : 'bg-black text-white hover:bg-gray-800'}`}
                  >
                    {value.trim() ? 
                      <ArrowUp className="h-5 w-5" /> : 
                      <AudioWaveform className="h-5 w-5" />
                    }
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

// Base speed for typewriter effect (milliseconds per character)
const TYPEWRITER_BASE_SPEED = 8; // Changed from 15
const TYPEWRITER_MIN_SPEED = 2; // Minimum speed

function TypewriterText({ text, speed = TYPEWRITER_BASE_SPEED, onComplete }: { text: string, speed?: number, onComplete?: () => void }) {
  const [displayedText, setDisplayedText] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const textElementRef = useRef<HTMLDivElement>(null);

  // Effect for typing animation
  useEffect(() => {
    setDisplayedText("");
    setIsComplete(false);
    
    let index = 0;
    const timer = setInterval(() => {
      if (index < text.length) {
        setDisplayedText(text.substring(0, index + 1));
        index++;
      } else {
        clearInterval(timer);
        setIsComplete(true);
        onComplete?.(); 
      }
    }, speed);

    return () => clearInterval(timer);
  }, [text, speed, onComplete]);

  // REMOVED: useEffect for auto-scrolling while typing
  // useEffect(() => { ... }, [displayedText]);

  return (
    <div 
      ref={textElementRef}
      className={`whitespace-pre-wrap ${isComplete ? "typewriter-text-complete" : ""}`}
    >
      {isComplete ? text : displayedText} 
    </div>
  );
}

function BotChatMessageWithTypewriter({ m, isWaiting, rebuild, isLoadingFromHistory }: { m: any, isWaiting?: boolean, rebuild?: () => void, isLoadingFromHistory?: boolean }) {

  const [isTypingComplete, setIsTypingComplete] = useState(false);

  useEffect(() => {
    if (!isLoadingFromHistory) { 
      setIsTypingComplete(false);
    }
  }, [m.message, isLoadingFromHistory]);

  // Determine if we should skip the typewriter 
  const skipTypewriter = isLoadingFromHistory || !m.message || (m.type && m.type !== "bot");
                         
  // If skipping OR if typing is complete, render the final content directly
  if (skipTypewriter || isTypingComplete) {
    const { imageUrl, remainingText } = parseMarkdownImage(m.message);
    const isPlainImage = !imageUrl && isImageUrl(m.message);

    // Render final state (image or text)
    if (imageUrl) {
       return (
         <div className="bot-message-content">
            <a href={imageUrl} target="_blank" rel="noopener noreferrer" className="block mb-2">
              <img 
                src={imageUrl} 
                alt="Bot image" 
                className="max-w-md h-auto rounded"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            </a>
            {remainingText && <div className="mt-2 text-sm whitespace-pre-wrap">{remainingText}</div>}
         </div>
       )
    } else if (isPlainImage) {
      return (
        <div className="bot-message-content">
            <a href={m.message} target="_blank" rel="noopener noreferrer" className="block mb-2">
              <img 
                src={m.message} 
                alt="Bot image" 
                className="max-w-md h-auto rounded"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            </a>
        </div>
      )
    } else {
        // Render plain text without typewriter effect
        return <div className="bot-message-content whitespace-pre-wrap">{m.message || ""}</div>;
    }
  }
  
  // Calculate dynamic speed based on message length
  const dynamicSpeed = Math.max(
    TYPEWRITER_MIN_SPEED, 
    TYPEWRITER_BASE_SPEED - Math.floor((m.message?.length || 0) / 150)
  );

  // While typing, render ONLY the TypewriterText component
  return (
    <div className="bot-message-content">
      <TypewriterText 
        text={m.message || ""} 
        speed={dynamicSpeed} 
        onComplete={() => setIsTypingComplete(true)} 
      />
      {/* Note: Action buttons like Copy, Thumbs up/down, Rebuild are handled within the ChatMessage component */}
      {/* This component focuses solely on displaying the message content with a typewriter effect */}
    </div>
  );
}

interface MessageProps {
  message: ChatMessage
  isWaiting?: boolean
  isLoadingFromHistory?: boolean
}

function ChatMessage(props: MessageProps) {
  const { isWaiting, isLoadingFromHistory, message: msg } = props;
  let { type, message, messages, needsRebuild, rebuild } = msg;
  messages = messages || [];
  const [copied, setCopied] = useState(false);
  const [isSingleLine, setIsSingleLine] = useState(true);
  const messageTextRef = useRef<HTMLDivElement>(null);
  const messageContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (type === "human" && message) {
      const hasNewlines = message.includes('\\n');
      if (!hasNewlines && messageTextRef.current) {
        const lineHeight = 23;
        setIsSingleLine(messageTextRef.current.clientHeight <= lineHeight * 1.2);
      } else {
        setIsSingleLine(!hasNewlines);
      }
    }
  }, [message, type]);

  const handleCopyText = () => {
    const { imageUrl, remainingText } = parseMarkdownImage(message);
    let textToCopy = message; // Default to copying the raw message

    if (imageUrl) {
      // If markdown image, decide what to copy (e.g., URL + text)
      textToCopy = imageUrl + (remainingText ? ` ${remainingText}` : '');
    } else if (isImageUrl(message)) {
      // If plain image URL, copy the URL
      textToCopy = message;
    } // Otherwise, textToCopy remains the original message text

    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  const isLastMessage = messages.length === 1 && messages[0].type === "human";

  if (type === "bot") {
    // Agent messages
    if (messages.length > 0) {
      const agentMessage = messages.find(m => KNOWN_AGENT_IDS.includes(m.id));
      if (agentMessage) {
        let answerContent: string | null = null;
        try {
          const parsedJson = JSON.parse(agentMessage.message);
          if (parsedJson && typeof parsedJson.answer === 'string') {
            answerContent = parsedJson.answer;
          }
        } catch (e) {
          console.warn("Agent message was not valid JSON for extracting answer:", agentMessage.message);
        }
        const messageForTypewriter = answerContent ? {
          ...agentMessage,
          message: answerContent,
        } : null;

        return (
          <>
            <div className="mt-4 w-full" dir="auto">
              <div className="p-3 border border-gray-200 rounded-lg">
                <div className="font-medium text-xs mb-1 pb-1 border-b">Agent Raw Output: {agentMessage.botName || `ID ${agentMessage.id}`}</div>
                <AgentJsonView data={agentMessage.message} />
              </div>
            </div>

            {messageForTypewriter && (
              <div className="mt-4 w-full" dir="auto">
                <div className="font-medium text-xs mb-2">Agent Answer:</div>
                <BotChatMessageWithTypewriter 
                  m={messageForTypewriter} 
                  isWaiting={isWaiting} 
                  isLoadingFromHistory={isLoadingFromHistory}
                />
              </div>
            )}
            
            {needsRebuild && !isWaiting && rebuild && (
              <div className="mt-2 w-full flex justify-start">
                <Button
                  className="bg-gray-700 hover:bg-gray-600 text-white"
                  onClick={rebuild}
                  disabled={isWaiting}
                  size="sm"
                >
                  <span className="mr-1">↻</span> Rebuild
                </Button>
              </div>
            )}
          </>
        );
      }
    }
    
    // Multiple bot messages side-by-side
    if (messages.length > 1) {
      return (
        <div className="w-full mt-4" dir="auto">
          <div className="flex gap-4 w-full">
            {messages.map((m) => {
              const { imageUrl, remainingText } = parseMarkdownImage(m.message);
              const isPlainImage = !imageUrl && isImageUrl(m.message);

              return (
                <div
                  key={m.id}
                  className="flex-1 border border-gray-300 rounded-lg p-3 bot-message-content"
                  dir="auto"
                >
                  <div className="font-medium text-xs mb-2">{m.botName}</div>
                  {imageUrl ? (
                    <div>
                      <a href={imageUrl} target="_blank" rel="noopener noreferrer" className="block mb-2">
                        <img 
                          src={imageUrl} 
                          alt="Bot image" 
                          className="max-w-md h-auto rounded"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      </a>
                      {remainingText && <div className="mt-2 text-sm whitespace-pre-wrap">{remainingText}</div>}
                    </div>
                  ) : isPlainImage ? (
                     <a href={m.message} target="_blank" rel="noopener noreferrer" className="block mb-2">
                       <img 
                         src={m.message} 
                         alt="Bot image" 
                         className="max-w-md h-auto rounded"
                         onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                       />
                     </a>
                  ) : (
                    <BotChatMessageWithTypewriter 
                      m={m} 
                      isWaiting={isWaiting} 
                      rebuild={rebuild} 
                      isLoadingFromHistory={isLoadingFromHistory}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    
    // Single bot message
    if (messages.length === 1) {
      const single = messages[0];
      const { imageUrl, remainingText } = parseMarkdownImage(single.message);
      const isPlainImage = !imageUrl && isImageUrl(single.message);

      return (
        <div className="mt-4" dir="auto">
          <div className="p-3 bot-message-content">
            <div
              className="inline-block px-2 py-1 border border-gray-300 rounded text-xs font-medium mb-2"
              dir="auto"
            >
              {single.botName}
            </div>
            {imageUrl ? (
              <div>
                 <a href={imageUrl} target="_blank" rel="noopener noreferrer" className="block mb-2">
                  <img 
                    src={imageUrl} 
                    alt="Bot image" 
                    className="max-w-md h-auto rounded"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                 </a>
                 {remainingText && <div className="mt-2 text-sm whitespace-pre-wrap">{remainingText}</div>}
              </div>
            ) : isPlainImage ? (
               <a href={single.message} target="_blank" rel="noopener noreferrer" className="block mb-2">
                 <img 
                   src={single.message} 
                   alt="Bot image" 
                   className="max-w-md h-auto rounded"
                   onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                 />
               </a>
            ) : (
              <BotChatMessageWithTypewriter 
                m={single} 
                isWaiting={isWaiting} 
                rebuild={rebuild} 
                isLoadingFromHistory={isLoadingFromHistory}
              />
            )}
          </div>
        </div>
      );
    }
    
    // Fallback case: Bot message directly on the main message object
    const { imageUrl, remainingText } = parseMarkdownImage(message);
    const isPlainImage = !imageUrl && isImageUrl(message);

    return (
      <div className="w-full mt-4" dir="auto">
        <div className="border border-gray-300 rounded-lg p-3 bot-message-content" dir="auto" style={{ minWidth: "80px" }}>
           {imageUrl ? (
             <div>
               <a href={imageUrl} target="_blank" rel="noopener noreferrer" className="block mb-2">
                 <img 
                   src={imageUrl} 
                   alt="Bot image" 
                   className="max-w-md h-auto rounded"
                   onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                 />
               </a>
               {remainingText && <div className="mt-2 text-sm whitespace-pre-wrap">{remainingText}</div>}
             </div>
           ) : isPlainImage ? (
             <a href={message} target="_blank" rel="noopener noreferrer" className="block mb-2">
               <img 
                 src={message} 
                 alt="Bot image" 
                 className="max-w-md h-auto rounded"
                 onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
             </a>
           ) : (
            <div className="px-1 text-gray-700" style={{ fontFamily: 'Inter, sans-serif', lineHeight: 1.5, fontSize: '0.925rem' }}>
              <BotChatMessageWithTypewriter 
                m={{ message, type: "bot" }} 
                isWaiting={isWaiting} 
                rebuild={rebuild} 
                isLoadingFromHistory={isLoadingFromHistory}
              />
            </div>
           )}
        </div>
      </div>
    );
  }
  
  // Human messages remain unchanged
  return (
    <div className="w-full mt-4 message-fade-in" dir="auto" ref={messageContainerRef}>
      <div className="flex flex-col items-end">
        <div
          className={`bg-gray-100 text-black message-bubble shadow-sm ${isSingleLine ? 'single-line' : ''}`}
          dir="auto"
        >
          <div 
            ref={messageTextRef}
            className="break-words whitespace-pre-wrap" 
            style={{ fontFamily: 'Inter, sans-serif', lineHeight: 1.5, fontSize: '0.925rem' }}
          >
            {message}
          </div>
        </div>
        <div className="mt-1 pr-1 flex justify-end gap-2 text-gray-400">
          {copied ? 
            <Check className="cursor-pointer text-gray-400 hover:text-black transition-colors p-1 hover:bg-gray-100 rounded-md" size={24} /> :
            message ? <Copy className="cursor-pointer hover:text-black transition-colors p-1 hover:bg-gray-100 rounded-md" size={24} onClick={handleCopyText} /> : null
          }
          {!isWaiting && needsRebuild && (
            <Button
              className="bg-gray-700 hover:bg-gray-600 text-white"
              onClick={rebuild}
              disabled={isWaiting}
              size="sm"
            >
              <span className="mr-1">↻</span> Rebuild
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}