"use client"
const LOCAL_STORAGE_KEY = "chatHistory"

import { useEffect, useRef, useState } from 'react'
import { api } from '@/api/getBots'
import { ChevronLeft, X, ChevronRight, MessageSquarePlus, AudioWaveform, ArrowUp, CirclePlus, Circle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from '@radix-ui/react-checkbox'
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

interface Option {
  label: string
  value: string
}

export function MultiSelectDropdown({
  options,
  selected,
  onChange,
}: {
  options: Option[]
  selected: number[]
  onChange: (selected: number[]) => void
}) {
  const removeBot = (botValue: number) => {
    onChange(selected.filter((v) => v !== botValue))
  }

  const toggleSelection = (botValue: number) => {
    if (selected.includes(botValue)) {
      removeBot(botValue)
    } else if (selected.length < 3) {
      onChange([...selected, botValue])
    }
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <div className="relative w-full min-h-[2.5rem] border border-gray-300 rounded-md px-2 py-1 flex items-center gap-2 cursor-pointer">
          {selected.length === 0 && (
            <span className="text-gray-400">Select Bots</span>
          )}
          {selected.map((val) => {
            const opt = options.find((o) => o.value === val.toString())
            if (!opt) return null
            return (
              <div
                key={opt.value}
                className="flex items-center bg-gray-200 text-sm px-2 py-1 rounded"
              >
                <span className="mr-1">{opt.label}</span>
                <X
                  className="h-4 w-4 cursor-pointer text-gray-600 hover:text-gray-800"
                  onClick={(e) => {
                    e.stopPropagation()
                    removeBot(val)
                  }}
                />
              </div>
            )
          })}
        </div>
      </PopoverTrigger>
      <PopoverContent align="start"
      className="w-auto min-w-[var(--radix-popover-trigger-width)] max-w-[20rem] max-h-60 overflow-y-auto text-sm">
        {options.map((opt) => {
          const botValue = Number(opt.value)
          const isChecked = selected.includes(botValue)
          return (
            <div
              key={opt.value}
              className="flex items-center p-2 hover:bg-gray-100 cursor-pointer"
              onClick={() => toggleSelection(botValue)}
            >
              <Checkbox
                checked={isChecked}
                onCheckedChange={() => {}}
                className=""
              />
              <span>{opt.label}</span>
            </div>
          )
        })}
      </PopoverContent>
    </Popover>
  )
}


export default function Chat () {
  const [sidebarVisible, setSidebarVisible] = useState(false)
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
    api.getBots().then((sb) => {
      const bots: Bots = {}
      for (const key in sb) {
        bots[Number(key)] = { name: sb[key], id: key, history: [] }
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
    
    setActiveChat(chatSession)

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
        timestamp: new Date().toISOString(),
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
        <div className={`border-r flex flex-col transition-all duration-300 ${
            sidebarVisible ? 'w-1/4' : 'w-0 overflow-hidden'
          }`}>
          <div className="p-4 border-b">
            <div className="flex justify-end mb-4">
              <Button 
                onClick={handleResetChat}
                size="sm" 
                className="flex items-center gap-1"
              >
                <MessageSquarePlus/>
              </Button>
            </div>
            <h2 className="text-1xl font-bold text-left">Chat History</h2>
          </div>
          
          <div 
            className="overflow-y-auto" 
            style={{ height: "calc(100% - 100px)" }}
          >
            <div className="p-4">
              <ChatHistory 
                setActiveChat={handleLoadChatHistory} 
                onSelectBot={(botId) => {
                  onSelectBot(botId)
                }} 
                bots={state.bots}
                chatHistory={chatHistory}
              />
            </div>
          </div>
        </div>
        <div className="flex-1 flex flex-col">
          <div className="py-4 border-b flex justify-between items-center bg-white px-4 shadow-sm">
          <Button onClick={toggleSidebar}className="mr-3 p-1 bg-grey-100 text-black rounded hover:bg-gray-100">
              {sidebarVisible ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
             </Button>
            <h2 className="text-lg font-bold">
              Playground
            </h2>
            <div className="flex-grow flex px-4">
            <MultiSelectDropdown options={options} selected={state.selectedBots} onChange={(selected) => {
                  setState({ selectedBots: selected })
                  setMessages([])
                  setActiveChat(null)
                }} />
            </div>
          </div>
          <div 
            className="overflow-y-auto" 
            style={{ height: "calc(100% - 137px)" }} 
          >
            <div className="p-4 space-y-4">
              {!state.audioMode && (
                <div className="flex flex-col space-y-6 w-full">
                  {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                      <p className="text-lg font-medium">Start chatting with Signpost Bot</p>
                      <p className="text-sm mt-2">Select a bot and type a message below</p>
                    </div>
                  ) : (
                    messages.map((m, i) => (
                      <ChatMessage key={i} message={m} isWaiting={state.isSending} />
                    ))
                  )}
                  {state.isSending && (
                    <div className="flex justify-start w-fit">
                      <div className="bg-gray-100 rounded-lg p-3 flex gap-1">
                        <div className="w-2.5 h-2.5 rounded-full animate-typing-1 bg-gradient-to-r from-pink-500 to-violet-500"></div>
                        <div className="w-2.5 h-2.5 rounded-full animate-typing-2 bg-gradient-to-r from-violet-500 to-cyan-500"></div>
                        <div className="w-2.5 h-2.5 rounded-full animate-typing-3 bg-gradient-to-r from-cyan-500 to-pink-500"></div>
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
            <div className="border-t bg-white p-4">
              {hasSelectedBots ? (
                <SearchInput 
                  onSearch={onSend} 
                  disabled={state.isSending} 
                  openFileDialog={() => setShowFileDialog(true)}
                  audioMode={state.audioMode}
                  onModeChanged={onModeChanged}
                />
              ) : (
                <div className="flex justify-center items-center py-4 text-gray-500">
                  <span>Please select a bot to start chatting</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
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
      textareaRef.current.style.height = "24px"
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [value])

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
            className="relative bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden"
          >
            <div className="flex items-center w-full p-2">
              <div className="flex-shrink-0 pl-2">
                <Button
                  type="button"
                  onClick={props.openFileDialog}
                  className="p-2 text-white hover:text-gray-700 hover:bg-gray-100 rounded-full"
                >
                  <CirclePlus className="h-6 w-6" />
                </Button>
              </div>
              <div className="flex-grow px-2 py-3 max-h-48 overflow-y-auto">
                <textarea
                  ref={textareaRef}
                  value={value}
                  onChange={handleSearchChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your message here."
                  className="w-full outline-none resize-none py-1 px-1 text-gray-800 min-h-[40px]"
                  rows={1}
                  style={{ overflowY: 'auto' }}
                />
              </div>
              
              <div className="flex items-center pr-2 gap-2">
              
                <Button
                  type="button"
                  onClick={value.trim() ? handleSendMessage : props.onModeChanged}
                  className={`p-2 rounded-full ${value.trim() ? 'bg-black text-white' : 'bg-black text-white hover:bg-gray-800'}`}
                >
                  {value.trim() ? 
                    <ArrowUp className="h-5 w-5" /> : 
                    <AudioWaveform className="h-5 w-5" />
                  }
                </Button>
              </div>
            </div>
          </form>
        </div>
      )}
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

  if (type === "bot") {
    const hasBots = messages.length > 0

    if (hasBots && messages.length > 1) {
      return (
        <div className="w-full mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
            {messages.map((m) => (
              <div key={m.id} className="border border-gray-300 rounded-lg p-3">
                <div className="font-medium text-xs mb-1">
                  {m.botName}
                </div>
                <BotChatMessage m={m} isWaiting={isWaiting} rebuild={rebuild} />
              </div>
            ))}
          </div>
        </div>
      )
    }
    if (hasBots && messages.length === 1) {
      const single = messages[0]
      return (
        <div className="mt-4">
          <div className="rounded-lg p-3">
            <div className="inline-block px-2 py-1 border border-gray-300 rounded text-sm font-medium mb-1">{single.botName}</div>
            <BotChatMessage m={single} isWaiting={isWaiting} rebuild={rebuild} />
          </div>
        </div>
      )
    }
    return (
      <div className="w-full mt-4">
        <div className="border border-gray-300 rounded-lg p-3">
          {message}
        </div>
      </div>
    )
  }
  return (
    <div className="w-full flex justify-end mt-4">
      <div className="bg-gray-100 text-black p-4 rounded-lg max-w-md">
        <div>{message}</div>
        {!isWaiting && needsRebuild && (
          <Button
            className="mt-2 bg-gray-700 hover:bg-gray-600 text-white"
            onClick={rebuild}
            disabled={isWaiting}
            size="sm"
          >
            <span className="mr-1">↻</span> Rebuild
          </Button>
        )}
      </div>
    </div>
  )
}