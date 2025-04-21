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
      
      // Automatically scroll to position the user message at the top right
      setTimeout(() => {
        const chatContainer = document.querySelector('.overflow-y-auto');
        if (chatContainer) {
          // Get all message elements
          const messageElements = document.querySelectorAll('.w-full.mt-4');
          if (messageElements.length > 0) {
            // Get the newly added user message (last element)
            const lastMessage = messageElements[messageElements.length - 1];
            
            // Calculate scroll position to place the message near the top
            const topPadding = 60; // Pixels from the top
            const scrollPosition = lastMessage.getBoundingClientRect().top + 
                                  chatContainer.scrollTop - 
                                  chatContainer.getBoundingClientRect().top - 
                                  topPadding;
            
            // Scroll with animation
            chatContainer.scrollTo({
              top: scrollPosition,
              behavior: 'smooth'
            });
          }
        }
      }, 100); 
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

    if (useAgent && selectedAgentId) { // Check selectedAgentId is not undefined
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
                        key={i} 
                        message={m} 
                        isWaiting={state.isSending} 
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

function TypewriterText({ text, speed = 15, onComplete }: { text: string, speed?: number, onComplete?: () => void }) {
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

  // Effect for auto-scrolling
  useEffect(() => {
    const textElement = textElementRef.current;
    const scrollContainer = document.querySelector('.chat-messages-container'); // Find the scroll container

    if (textElement && scrollContainer) {
      const textRect = textElement.getBoundingClientRect();
      const containerRect = scrollContainer.getBoundingClientRect();

      // Define desired visible space below the text (e.g., 80px from container bottom)
      const desiredBottomMargin = 80;
      const targetTextBottomPosition = containerRect.bottom - desiredBottomMargin;

      // Check if the bottom of the text has gone below our target position
      if (textRect.bottom > targetTextBottomPosition) {
        // Calculate how much the text is below the target position
        const distanceBelowTarget = textRect.bottom - targetTextBottomPosition;
        
        // Calculate the new scroll top: current scroll + distance below target
        const newScrollTop = scrollContainer.scrollTop + distanceBelowTarget;

        // Scroll smoothly to the calculated position to keep the last line visible
        scrollContainer.scrollTo({
          top: newScrollTop,
          behavior: 'smooth' // Smooth scroll for better UX
        });
      }
    }
  }, [displayedText]); // Run this effect whenever the displayed text updates

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

  // Reset completion state if the message changes
  useEffect(() => {
    // Skip setting if loading from history, as it will be skipped anyway
    if (!isLoadingFromHistory) { 
      setIsTypingComplete(false);
    }
  }, [m.message, isLoadingFromHistory]);

  // Determine if we should skip the typewriter 
  const skipTypewriter = isLoadingFromHistory || !m.message || (m.type && m.type !== "bot");
                         
  // If skipping OR if typing is complete, render the original component
  // The original component shows the full text and has the button logic
  if (skipTypewriter || isTypingComplete) {
    return <BotChatMessage m={m} isWaiting={isWaiting} rebuild={rebuild} />;
  }
  
  // Calculate dynamic speed: Start at 15ms, decrease by 1ms per 150 chars, min 2ms
  const dynamicSpeed = Math.max(2, 15 - Math.floor((m.message?.length || 0) / 150));

  // While typing, render ONLY the TypewriterText
  return (
    <div className="bot-message-content">
      <TypewriterText 
        text={m.message || ""} 
        speed={dynamicSpeed} 
        onComplete={() => setIsTypingComplete(true)} 
      />
      {/* Icons, References, and Rebuild button are rendered by the original BotChatMessage once isTypingComplete is true */}
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

  // Detect if message is single line or multi-line
  useEffect(() => {
    if (type === "human") {
      // Check for explicit newlines
      const hasNewlines = message.includes('\n');
      
      // If no explicit newlines, check rendered height after component mounts
      if (!hasNewlines && messageTextRef.current) {
        const lineHeight = 23; // Approximate line height (1.5 * font size)
        setIsSingleLine(messageTextRef.current.clientHeight <= lineHeight * 1.2);
      } else {
        setIsSingleLine(!hasNewlines);
      }
    }
  }, [message, type]);

  const handleCopyText = () => {
    navigator.clipboard.writeText(message).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const isLastMessage = messages.length === 1 && messages[0].type === "human";

  if (type === "bot") {
    if (messages.length > 0) {
      // Check if any message corresponds to a known agent
      const agentMessage = messages.find(m => KNOWN_AGENT_IDS.includes(m.id));
      
      if (agentMessage) {
        return (
          <div className="mt-4 w-full" dir="auto">
            <div className="p-3 border border-gray-200 rounded-lg">
              <div className="font-medium text-xs mb-2 pb-1 border-b">Agent</div>
              <AgentJsonView data={agentMessage.message} />

              {needsRebuild && !isWaiting && rebuild && (
                <Button
                  className="mt-3 bg-gray-700 hover:bg-gray-600 text-white"
                  onClick={rebuild}
                  disabled={isWaiting}
                  size="sm"
                >
                  <span className="mr-1">↻</span> Rebuild
                </Button>
              )}
            </div>
          </div>
        );
      }
    }
    if (messages.length > 1) {
      return (
        <div className="w-full mt-4" dir="auto">
          <div className="flex gap-4 w-full">
            {messages.map((m) => (
              <div
                key={m.id}
                className="flex-1 border border-gray-300 rounded-lg p-3 bot-message-content"
                dir="auto"
              >
                <div className="font-medium text-xs mb-1" dir="auto">
                  {m.botName}
                </div>
                <BotChatMessageWithTypewriter 
                  m={m} 
                  isWaiting={isWaiting} 
                  rebuild={rebuild} 
                  isLoadingFromHistory={isLoadingFromHistory}
                />
              </div>
            ))}
          </div>
        </div>
      );
    }
    if (messages.length === 1) {
      const single = messages[0];
      return (
        <div className="mt-4" dir="auto">
          <div className="p-3 bot-message-content">
            <div
              className="inline-block px-2 py-1 border border-gray-300 rounded text-xs font-medium mb-1"
              dir="auto"
            >
              {single.botName}
            </div>
            <BotChatMessageWithTypewriter 
              m={single} 
              isWaiting={isWaiting} 
              rebuild={rebuild} 
              isLoadingFromHistory={isLoadingFromHistory}
            />
          </div>
        </div>
      );
    }
    return (
      <div className="w-full mt-4" dir="auto">
        <div className="border border-gray-300 rounded-lg p-3 bot-message-content" dir="auto" style={{ minWidth: "80px" }}>
          <div className="px-1 text-gray-700" style={{ fontFamily: 'Inter, sans-serif', lineHeight: 1.5, fontSize: '0.925rem' }}>
            <BotChatMessageWithTypewriter 
              m={{ message, type: "bot" }} 
              isWaiting={isWaiting} 
              rebuild={rebuild} 
              isLoadingFromHistory={isLoadingFromHistory}
            />
          </div>
        </div>
      </div>
    );
  }
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
            <Copy className="cursor-pointer hover:text-black transition-colors p-1 hover:bg-gray-100 rounded-md" size={24} onClick={handleCopyText} />
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