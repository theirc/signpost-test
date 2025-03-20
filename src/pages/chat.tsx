"use client"
const LOCAL_STORAGE_KEY = "chatHistory"

import { useEffect, useState } from 'react'
import { api } from '@/api/getBots'
import { Paperclip, Mic, Loader2, MessageSquare, StopCircle, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select"
import { useMultiState } from '@/hooks/use-multistate'
import { Comm } from '../bot/comm'
import { BotChatMessage } from '@/bot/botmessage'
import { ChatHistory, ChatSession } from '@/bot/history'
import { BotHistory } from '@/types/types.ai'
import type { ChatMessage } from '@/types/types.ai'
import { useReactMediaRecorder } from "react-media-recorder"
import { SourcesTable } from '@/components/sources-table'
import { availableSources } from "@/components/old_forms/files-modal"
import {Dialog, DialogContent, DialogHeader, DialogTitle} from "@/components/ui/dialog"
import "../index.css"

interface Bots {
  [index: number]: {
    name: string
    id: string
    history: BotHistory[]
  }
}

export default function Chat () {
  const [showFileDialog, setShowFileDialog] = useState(false)
  const [selectedSources, setSelectedSources] = useState<string[]>([])
  const [sources, setSources] = useState(availableSources)
  const [message, setMessage] = useState("")
  const [activeChat, setActiveChat] = useState<ChatSession | null>(null)
  
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      type: "bot",
      message: "Hello, how can I assist you today?",
    }
  ])

  const [state, setState] = useMultiState({
    isSending: false,
    rebuilding: false,
    loadingBotList: false,
    bots: {} as Record<number, {name: string; history: any[]}>,
    selectedBots: [] as number[],
    audioMode: false,
  })

  useEffect(() => {
    api.getBots().then((sb) => {
      const bots: Record<number, { name: string; history: any[] }> = {}
      for (const key in sb) {
        bots[Number(key)] = { name: sb[key], history: [] }
      }
      setState({ bots })
    })
  }, [])

  useEffect(()=> {
    setSources(availableSources)
  }, [availableSources])

  const [chatHistory, setChatHistory] = useState<ChatSession[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedChats = localStorage.getItem(LOCAL_STORAGE_KEY)
        if (savedChats) {
          const parsedChats = JSON.parse(savedChats)
          console.log("Initializing chat history from localStorage:", parsedChats)
          return Array.isArray(parsedChats) ? parsedChats : []
        }
      } catch (error) {
        console.error("Error loading initial chat history:", error)
      }
    }
    return []
  })

  useEffect(()=> {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(chatHistory))
  }, [chatHistory])
  
  const handleLoadChatHistory = (chatSession: ChatSession) => {
    console.log("Loading chat history session:", chatSession)
    
    setActiveChat(chatSession)
    console.log("Chat session messages:", chatSession.messages)

    setTimeout(() => {
      if (chatSession.messages && chatSession.messages.length > 0) {
        setMessages([...chatSession.messages])
      } else {
        setMessages([])
      }
      
      if (chatSession.botName) {
        const botEntry = Object.entries(state.bots).find(
          ([_, bot]) => bot.name === chatSession.botName
        )
  
        if (botEntry) {
          const botId = Number(botEntry[0])
          setState({ selectedBots: [botId] })
        }
      }
      setMessage(prev => prev + "")
    }, 50)
  }

  const onSelectBot = (e: string[] | string) => {
    console.log("Selecting bot:", e)
  
    const previousSelectedBot = state.selectedBots.length > 0 ? state.selectedBots[0] : null
    
    if (!e || e.length == 0) {
      setState({ selectedBots: [] })
      return
    }
  
    let newSelectedBotId: number
    
    if (typeof e == "string") {
      newSelectedBotId = Number(e)
      setState({ selectedBots: [newSelectedBotId] })
    } else {
      const bots = e.map(Number)
      newSelectedBotId = bots[0]
      
      for (const b of bots) {
        const bot = state.bots[b]
        if (!bot) continue
        if (state.selectedBots.includes(b)) continue
        state.selectedBots.push(b)
        bot.history = []
      }
  
      setState({ selectedBots: bots })
    }
    
    if (previousSelectedBot !== newSelectedBotId) {
      setMessages([])
      
      setActiveChat(null)
    }
  }

  const onSend = async (message?: string, audio?: any, tts?: boolean) => {
    message ||= "where can i find english classes in athens?"
    
    if (!message && !audio) return
    
    const selectedBots = state.selectedBots.map(b => ({ label: state.bots[b].name, value: b, history: state.bots[b].history }))
    
    const currentBotName = state.selectedBots.length > 0 ? state.bots[state.selectedBots[0]].name : "Chat"
    
    const userMessage: ChatMessage = { type: "human", message: message || "" }
    
    if (message) {
      setMessages(prev => [...prev, userMessage])
    }
    
    let currentActiveChat: ChatSession
    
    if (!activeChat) {
      currentActiveChat = {
        id: new Date().toISOString(),
        botName: currentBotName,
        messages: [userMessage],
        timestamp: new Date().toLocaleString(),
      }
      setActiveChat(currentActiveChat)
      
      setChatHistory(prevHistory => [currentActiveChat, ...prevHistory])
    } else {
      currentActiveChat = {
        ...activeChat,
        messages: [...activeChat.messages, userMessage]
      }
      setActiveChat(currentActiveChat)
      
      setChatHistory(prevHistory => 
        prevHistory.map(chat => 
          chat.id === currentActiveChat.id ? currentActiveChat : chat
        )
      )
    }
    
    setState({ isSending: true })
    
    const response = message ? 
      await api.askbot({ message }, tts, selectedBots) : 
      await api.askbot({ audio }, tts, selectedBots)
    
    if (!response.error) {
      for (const m of response.messages) {
        const rbot = state.bots[m.id]
        if (!rbot) continue
        
        const messageRegistered = rbot.history.find(h => h.message === message && h.isHuman)
        if (!messageRegistered) rbot.history.push({ isHuman: true, message: message || "" })
        
        if (!m.needsRebuild && !m.error) {
          const messageRegistered = rbot.history.find(h => h.message === m.message && !h.isHuman)
          if (!messageRegistered) rbot.history.push({ isHuman: false, message: m.message })
        }
      }
    }
    
    response.rebuild = async () => {
      setState({ isSending: true })
      response.needsRebuild = false
      await onRebuild()
      setState({ isSending: false })
    }
    
    const botResponseForHistory: ChatMessage = {
      type: "bot",
      message: response.message || "",
      messages: response.messages || [],
      needsRebuild: response.needsRebuild || false
    }
    
    setMessages(prev => [...prev, response as ChatMessage])
    
    const updatedChatWithResponse: ChatSession = {
      ...currentActiveChat,
      messages: [...currentActiveChat.messages, botResponseForHistory]
    }
    
    setActiveChat(updatedChatWithResponse)
    
    setChatHistory(prevHistory => 
      prevHistory.map(chat => 
        chat.id === updatedChatWithResponse.id ? updatedChatWithResponse : chat
      )
    )
      setState({ isSending: false })
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

  const handleAttachFiles = () =>{
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

  const hasSelectedBots = state.selectedBots.length > 0

  return ( 
    <div className="flex h-screen">
      {/* Sidebar for Chat History and New Conversation */}
      <div className="w-1/4 border-r p-4">
        <ChatHistory 
          setActiveChat={handleLoadChatHistory} 
          onSelectBot={(botId) => {
            console.log("ChatHistory selected bot ID:", botId)
            onSelectBot(botId)
          }} 
          bots={state.bots}
          chatHistory={chatHistory}
        />
      </div>
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        <div className="py-4 border-b flex justify-between items-center bg-white px-4 shadow-md">
          <h2 className="text-lg font-bold">
            Playground
          </h2>
          {/* Bot Selector */}
          <div className="flex-grow flex px-4">
            <Select onValueChange={onSelectBot}>
              <SelectTrigger>
                <SelectValue placeholder={
                  state.selectedBots.length > 0 
                    ? state.bots[state.selectedBots[0]]?.name || "Please select Bots"
                    : "Please select Bots"
                } />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(state.bots).map((k) => (
                  <SelectItem key={k} value={k}>
                    {state.bots[k].name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Audio Mode Toggle */}
          <Button onClick={onModeChanged} size="icon" variant="outline">
            {state.audioMode ? (
              <MessageSquare className="size-5" />
            ) : (
              <Mic className="size-5" />
            )}
          </Button>
        </div>

        <div className="flex-1 flex flex-col p-4 overflow-y-auto">
          <div className="flex-1 overflow-y-auto flex flex-col space-y-4">
            {!state.audioMode && (
              <div className="flex-1 flex flex-col p-4 overflow-y-auto">
                <div className="flex-1 overflow-y-auto flex flex-col space-y-4">
                  {messages.length === 0 ? (
                    <div className="flex flex-col items-center text-gray-500">
                      <p>Start chatting below!</p>
                    </div>
                  ) : (
                    messages.map((m, i) => (
                      <ChatMessage key={i} message={m} isWaiting={state.isSending} />
                    ))
                  )}
                  {state.isSending && (
                    <div className="flex justify-start w-fit">
                      <div className="bg-gray-100 rounded-lg p-3 flex gap-1">
                        {/* Typing animation dots */}
                        <div className="w-2.5 h-2.5 rounded-full animate-typing-1 bg-gradient-to-r from-pink-500 to-violet-500"></div>
                        <div className="w-2.5 h-2.5 rounded-full animate-typing-2 bg-gradient-to-r from-violet-500 to-cyan-500"></div>
                        <div className="w-2.5 h-2.5 rounded-full animate-typing-3 bg-gradient-to-r from-cyan-500 to-pink-500"></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Voice Mode - Comm Component */}
            {state.audioMode && hasSelectedBots && (
              <Comm bot={state.selectedBots[0] ? state.selectedBots[0] : null} />
            )}

            {/* Message Input Box */}
            {hasSelectedBots && !state.audioMode ? (
              <div className="sticky bottom-0 border-t p-4 bg-white">
                <SearchInput onSearch={onSend} disabled={state.isSending} />
              </div>
            ) : (
              <div className="border-t p-4 flex justify-center text-gray-600 bg-white">
                Please select one or more bots
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )

  function SearchInput(props: { onSearch: (message?: string, audio?: any, tts?: boolean) => void, disabled: boolean }) {
    const [value, setValue] = useState("")
    const [isVoiceMode, setIsVoiceMode] = useState<boolean>(false)
    const [recordingComplete, setRecordingComplete] = useState<boolean>(false)
    const [tts, setTts] = useState<boolean>(false)

    const {
      status,
      startRecording,
      stopRecording,
      mediaBlobUrl,
      clearBlobUrl,
    } = useReactMediaRecorder({ audio: true })

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
        props.onSearch(undefined, base64Data, tts)

        clearBlobUrl()
        setRecordingComplete(false)
      }
    }

    const handleModeToggle = () => {
      setIsVoiceMode(!isVoiceMode)
    }

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setValue(e.target.value)
    }

    const handleSearch = (v: string) => {
      props.onSearch(v, '', tts)
      setValue("")
    }

    return (
      <div>
        <div className="mb-4 flex justify-between">
          <Button onClick={handleModeToggle} className="w-40 hover:bg-gray-600">
            {isVoiceMode ? "Switch to Text" : "Switch to Voice"}
          </Button>
          <Button onClick={() => setTts(!tts)}  className="w-50 hover:bg-gray-600">
            {tts ? "Switch to Text Response" : "Switch to Voice Response"}
          </Button>
        </div>

        {!isVoiceMode ? (
        <form
        onSubmit={(e) => {
          e.preventDefault()
          handleSearch(value)
        }}
        className="flex items-center border border-gray-300 rounded-lg p-2 bg-white shadow-sm w-full"
      >
        <Button 
        type="button" 
        variant="ghost" 
        className="mr-2"
        onClick={() => setShowFileDialog(true)} 
      >
      <Paperclip className="h-5 w-5 text-gray-500 hover:text-gray-700" />
      </Button>

        <input
          type="text"
          value={value}
          onChange={handleSearchChange}
          placeholder="Ask me anything"
          className="w-full px-3 py-2 bg-transparent outline-none"
        />
        <button
          type="submit"
          className="bg-gray-300 hover:bg-gray-400 text-gray-600 px-3 py-2 rounded-lg ml-2"
        >
          <Send className="size-5" />
        </button>
      </form>
        ) : (
          <div className="flex flex-col items-center">
            <div className="text-center mb-2">
              <p>
                {status === "recording" ? "Recording" : "Ready to Record"}
              </p>
              <p className="text-sm ml-4">
                {status === "recording" ? "Start speaking..." : ""}
              </p>
            </div>

            <Button
            onClick={handleToggleRecording}
            variant="outline"
            size="icon">
            {status === "recording" ? <StopCircle className="size-5 text-red-500" /> : <Mic className="size-5" />}
            </Button>
            {recordingComplete && mediaBlobUrl && (
              <div className="mt-4 flex flex-col items-center space-y-4 w-full">
                <audio controls src={mediaBlobUrl} className="w-full max-w-md rounded-lg shadow-sm border border-gray-300 p-2 bg-gray-100" />
                <Button
                onClick={handleSendRecording}
                size="sm"
                variant='default'
              className="flex items-center justify-content gap-2 px-4 py-2 rounded-lg shadow-md transition hover:bg-gray-800">
              <Send className="size-5" />
              <span>Send</span>
              </Button>
              </div>
            )}
          </div>
        )}
        <Dialog open={showFileDialog} onOpenChange={setShowFileDialog}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Attach Files</DialogTitle>
            </DialogHeader>
            <div className="mt-4">
              <SourcesTable 
                sources={sources}
                selectedSources={selectedSources}
                onToggleSelect={handleToggleSelect}
                onSelectAll={handleSelectAll}
                showCheckboxes={true}
              />
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

  interface MessageProps {
    message: ChatMessage
    isWaiting?: boolean
  }

  function ChatMessage(props: MessageProps) {
    const { isWaiting } = props
    let { type, message, messages, needsRebuild, rebuild } = props.message
    messages = messages || []

    const hasBots = messages.length > 0 

    if(type == "bot") {
    return (
    <div className="mt-8 flex w-full justify-start">
    <div className="flex gap-4">
      {hasBots && (
        <div className="-mt-3 ml-4 w-full flex gap-4">
          {messages.map((m) => (
            <div key={m.id}>
              <div className="font-medium text-xs text-blue-500 mb-1">{m.botName}</div>
              <BotChatMessage m={m} isWaiting={isWaiting} rebuild={rebuild} />
            </div>
          ))}
        </div>
      )}
      {!hasBots && message && (
        <div className="bg-white text-black p-3 rounded-lg max-w-xs">
          <div className="">{message}</div>
        </div>
      )}
    </div>
  </div>
  )
  }

  return (
  <div className="mt-8 flex w-full justify-end">
  <div className="bg-gray-200 text-black p-3 rounded-lg max-w-xs">
    <div>
      <div className="ml-2">{message}</div>
    </div>
    {!isWaiting && needsRebuild && (
      <Button
        className="mx-2 -mt-1"
        onClick={rebuild}
        disabled={isWaiting}
      >
        Rebuild
      </Button>
    )}
  </div>
  </div>
  )
  }
  }
