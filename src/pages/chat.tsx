"use client"
const LOCAL_STORAGE_KEY = "chatHistory"

import { useEffect, useRef, useState } from 'react'
import { api } from '@/api/getBots'
import { app } from '@/lib/app'
import { ChevronLeft, ChevronRight, MessageSquarePlus, AudioWaveform, ArrowUp, CirclePlus, Circle } from 'lucide-react'
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
import { MultiSelectDropdown, Option } from '@/components/ui/multiselect'
import "../index.css"

interface Bots {
  [index: number]: {
    name: string
    id: string
    history: BotHistory[]
  }
}

const AGENT_ID = 23

export default function Chat() {
  const [sidebarVisible, setSidebarVisible] = useState(false)
  const [showFileDialog, setShowFileDialog] = useState(false)
  const [selectedSources, setSelectedSources] = useState<string[]>([])
  const [sources, setSources] = useState(availableSources)
  const [message, setMessage] = useState("")
  const [activeChat, setActiveChat] = useState<ChatSession | null>(null)
  const [agentInstance, setAgentInstance] = useState<any>(null)
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
    async function initBots() {
      const sb = await api.getBots()
      const bots: Bots = {}
      for (const key in sb) {
        bots[Number(key)] = { name: sb[key], id: key, history: [] }
      }

      bots[AGENT_ID] = { name: AGENT_ID.toString(), id: AGENT_ID.toString(), history: [] }
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

    const selectedBots = state.selectedBots.map(b => ({
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
        messages: [userMessage],
        timestamp: new Date().toISOString(),
      }
      setActiveChat(currentActiveChat)
      setChatHistory(prev => [currentActiveChat, ...prev])
    } else {
      currentActiveChat = {
        ...activeChat,
        messages: [...activeChat.messages, userMessage],
      }
      setActiveChat(currentActiveChat)
      setChatHistory(prev =>
        prev.map(chat =>
          chat.id === currentActiveChat.id ? currentActiveChat : chat
        )
      )
    }

    setState({ isSending: true })

    const useAgent = state.selectedBots.includes(AGENT_ID)
    let botResponseForHistory: ChatMessage

    if (useAgent) {
      try {
        const agent = await agents.loadAgent(AGENT_ID);
        const parameters: AgentParameters = {
          input: { question: message! },
          apikeys: app.getAPIkeys(),
        };
        await agent.execute(parameters);

        const raw = parameters.error
          ? `Agent error: ${parameters.error}`
          : parameters.output;

        const text = typeof raw === "string"
          ? raw
          : JSON.stringify(raw, null, 2)

        const rbot = state.bots[AGENT_ID]!;
        if (!rbot.history.some(h => h.isHuman && h.message === message))
          rbot.history.push({ isHuman: true, message });
        if (!rbot.history.some(h => !h.isHuman && h.message === text))
          rbot.history.push({ isHuman: false, message: text });

        botResponseForHistory = {
          type: "bot",
          message: text,
          messages: [{
            id: AGENT_ID,
            botName: "Agent",
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
            id: AGENT_ID,
            botName: "Agent",
            message: errorMsg,
            needsRebuild: false,
          }],
          needsRebuild: false
        }
      }
    } else {
      const response = message ? await api.askbot({ message }, tts, selectedBots) : await api.askbot({ audio }, tts, selectedBots)

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
        setState({ isSending: true })
        response.needsRebuild = false
        await onRebuild()
        setState({ isSending: false })
      }

      botResponseForHistory = { type: "bot", message: response.message || "", messages: response.messages || [], needsRebuild: response.needsRebuild || false, }
    }

    setMessages(prev => [...prev, botResponseForHistory])

    const updatedChatWithResponse: ChatSession = {
      ...currentActiveChat, messages: [...currentActiveChat.messages, botResponseForHistory],
    }
    setActiveChat(updatedChatWithResponse)
    setChatHistory(prev => prev.map(chat => chat.id === updatedChatWithResponse.id ? updatedChatWithResponse : chat))
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
        <div className={`flex flex-col transition-all duration-300 ${sidebarVisible ? 'w-1/4 border-r' : 'w-0 overflow-hidden border-none'
          }`}>
          <div className="p-4 border-b">
            <div className="flex justify-end mb-4">
              <Button
                onClick={handleResetChat}
                size="sm"
                className="flex items-center gap-1"
              >
                <MessageSquarePlus />
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
            <Button onClick={toggleSidebar} className="mr-3 p-1 bg-grey-100 text-black rounded hover:bg-gray-100">
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
                className={`h-20 w-20 rounded-full flex items-center justify-center transition-colors ${status === "recording" ? 'bg-red-500' : 'bg-gray-200 hover:bg-gray-300'
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
  const { isWaiting } = props;
  let { type, message, messages, needsRebuild, rebuild } = props.message;
  messages = messages || [];
  const [copied, setCopied] = useState(false);
  const [isSingleLine, setIsSingleLine] = useState(true);
  const messageTextRef = useRef<HTMLDivElement>(null);
  const messageContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (type === "human") {
      const hasNewlines = message.includes('\n');

      if (!hasNewlines && messageTextRef.current) {
        const lineHeight = 23;
        setIsSingleLine(messageTextRef.current.clientHeight <= lineHeight * 1.2);
      } else {
        setIsSingleLine(!hasNewlines);
      }
    }
  }, [message, type])

  const handleCopyText = () => {
    navigator.clipboard.writeText(message).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    })
  }

  if (type === "human") {
    return (
      <div className="w-full mt-4" dir="auto">
        <div
          className="bg-gray-100 text-black p-4 rounded-lg max-w-[20%]"
          style={{ marginInlineStart: 'auto' }}
          dir="auto"
        >
          <div ref={messageTextRef}>{message}</div>
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
    );
  }
  if (type === "bot") {
    if (messages.length > 0) {
      const agentMessage = messages.find(m => m.id === AGENT_ID);

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
        )
      }
    }
    if (messages.length > 1) {
      return (
        <div className="w-full mt-4" dir="auto">
          <div className="flex gap-4 w-full">
            {messages.map((m) => (
              <div
                key={m.id}
                className="flex-1 border border-gray-300 rounded-lg p-3"
                dir="auto"
              >
                <div className="font-medium text-xs mb-1" dir="auto">
                  {m.botName}
                </div>
                <BotChatMessage m={m} isWaiting={isWaiting} rebuild={rebuild} />
              </div>
            ))}
          </div>
        </div>
      )
    }
    if (messages.length === 1) {
      const single = messages[0];
      return (
        <div className="mt-4" dir="auto">
          <div className="p-3">
            <div
              className="inline-block px-2 py-1 border border-gray-300 rounded text-xs font-medium mb-1"
              dir="auto"
            >
              {single.botName}
            </div>
            <BotChatMessage m={single} isWaiting={isWaiting} rebuild={rebuild} />
          </div>
        </div>
      )
    }

    return (
      <div className="w-full mt-4" dir="auto">
        <div className="border border-gray-300 rounded-lg p-3" dir="auto">
          {message}
        </div>
      </div>
    )
  }

  return null
}