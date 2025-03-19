"use client";

import { useEffect, useRef, useState } from 'react'
import { api } from '@/api/getBots'
import { AudioWaveform, ArrowUp, Plus, MessageSquare, CirclePlus, Circle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select"
import { useMultiState } from '@/hooks/use-multistate'
import { Comm } from '../bot/comm'
import { BotChatMessage } from '@/bot/botmessage'
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

  const [state, setState] = useMultiState({
    isSending: false,
    rebuilding: false,
    loadingBotList: false,
    bots: {} as Bots,
    selectedBots: [] as number[],
    audioMode: false,
  })

  useEffect(() => {
    api.getBots().then((sb) => {
      const bots: Bots = {}
      for (const value in sb) {
        bots[value] = { name: sb[value], id: value, history: [] }
      }
      setState({ bots })
    })
  }, [])

  useEffect(()=> {
    setSources(availableSources)
  }, [availableSources])
  
  const messages = useRef<ChatMessage[]>([
    {
      type: "bot",
      message: "Hello, how can I assist you today?",
    }
  ])

  const onSend = async (message?: string, audio?: any, tts?: boolean) => {

    message ||= "where can i find english classes in athens?"

    if (!message && !audio) return

    const selectedBots = state.selectedBots.map(b => ({ label: state.bots[b].name, value: b, history: state.bots[b].history }))

    if (message) {
      messages.current.push({ type: "human", message })
    }
    setState({ isSending: true })

    const response = message ? await api.askbot({ message }, tts, selectedBots) : await api.askbot({ audio }, tts, selectedBots)

    if (!response.error) {
      for (const m of response.messages) {
        const rbot = state.bots[m.id]
        if (!rbot) continue
        const messageRegistered = rbot.history.find(h => h.message == message && h.isHuman)
        if (!messageRegistered) rbot.history.push({ isHuman: true, message })
        if (!m.needsRebuild && !m.error) {
          const messageRegistered = rbot.history.find(h => h.message == m.message && !h.isHuman)
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

    messages.current.push(response)
    setState({ isSending: false })
  }

  const onRebuild = async () => {
    setState({ isSending: true })
    const selectedBots = state.selectedBots.map(b => ({ label: state.bots[b].name, value: b, history: state.bots[b].history }))
    const response = await api.askbot({ command: "rebuild", }, false, selectedBots)
    messages.current.push(response)
    setState({ isSending: false })
  }

  const onSelectBot = (e: string[] | string) => {
    if (!e || e.length == 0) {
      setState({ selectedBots: [] })
      return
    }

    if (typeof e == "string") {
      setState({ selectedBots: [Number(e)] })
    } else {
      const bots = e.map(Number)

      for (const b of bots) {
        const bot = state.bots[b]
        if (!bot) continue
        if (state.selectedBots.includes(b)) continue
        state.selectedBots.push(b)
        bot.history = []
      }

      setState({ selectedBots: bots })
    }
    messages.current = []
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

  const hasSelectedBots = state.selectedBots.length > 0

  return ( 
    <div className="flex flex-col h-screen w-full max-w-4xl mx-auto">
      <div className="py-3 px-4 border-b flex justify-between items-center bg-white shadow-sm">
        <h2 className="text-lg font-bold text-gray-800">Playground</h2>
        <div className="flex-grow max-w-sm mx-4">
          <Select onValueChange={onSelectBot}>
            <SelectTrigger className="h-9 border-gray-300 bg-white hover:bg-gray-50">
              <SelectValue placeholder="Select bot" />
            </SelectTrigger>
            <SelectContent>
              {Object.keys(state.bots).map((k) => (
                <SelectItem key={k} value={k}>{state.bots[k].name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto flex flex-col space-y-4 p-4">
        <div className="flex-1 overflow-y-auto space-y-6 w-full">
          {messages.current.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <MessageSquare className="h-12 w-12 mb-4 opacity-40" />
              <p className="text-lg font-medium">Start chatting with Signpost Bot</p>
              <p className="text-sm mt-2">Select a bot and type a message below</p>
            </div>
          ) : (
            messages.current.map((m, i) => (
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
      </div>

      {/* Input Area */}
      <div className="sticky bottom-0 border-t bg-white p-4">
        {hasSelectedBots ? (
          <SearchInput 
            onSearch={onSend} 
            disabled={state.isSending}
            openFileDialog={() => setShowFileDialog(true)}
          />
        ) : (
          <div className="flex justify-center items-center py-4 text-gray-500">
            <MessageSquare className="h-5 w-5 mr-2 opacity-70" />
            <span>Please select a bot to start chatting</span>
          </div>
        )}
      </div>

      {/* File Dialog - Kept in parent component */}
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
  openFileDialog: () => void
}) {
  const [value, setValue] = useState("")
  const [recordingComplete, setRecordingComplete] = useState<boolean>(false)
  const [tts, setTts] = useState<boolean>(false)
  const [showSettings, setShowSettings] = useState(false)
  
  const [isRecordingMode, setIsRecordingMode] = useState(false)

  const {
    status,
    startRecording,
    stopRecording,
    mediaBlobUrl,
    clearBlobUrl,
  } = useReactMediaRecorder({ audio: true })

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "24px"
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [value])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setValue(e.target.value)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSearch(value)
    }
  }

  const handleSearch = (v: string) => {
    if (!v.trim()) return;
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

  const blobToBase64 = (blob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject
      reader.readAsDataURL(blob)
    });
  }

  const handleSendRecording = async () => {
    if (mediaBlobUrl) {
      const response = await fetch(mediaBlobUrl)
      const blob = await response.blob()
      const base64Data = await blobToBase64(blob)
      props.onSearch(undefined, base64Data, true)
      clearBlobUrl();
      setRecordingComplete(false)
      setIsRecordingMode(false)
    }
  }

  const handleActionButton = () => {
    if (value.trim()) {
      handleSearch(value)
    } else {
      setIsRecordingMode(true)
    }
  }

  return (
    <div className="w-full">
      {/* Settings Panel */}
      {showSettings && (
        <div className="mb-4 bg-white rounded-lg p-4 shadow-md border border-gray-200">
          <h3 className="font-medium mb-3 text-gray-700">Chat Settings</h3>
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Voice Response</span>
              <Button 
                onClick={() => setTts(!tts)} 
                variant="outline" 
                size="sm"
                className="h-8"
              >
                {tts ? "Enabled" : "Disabled"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Voice Recording Mode */}
      {isRecordingMode ? (
        <div className="relative">
          <div className="relative bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
            <div className="flex flex-col items-center p-6">
              <div className="text-lg font-medium text-gray-700 mb-6">
                {status === "recording" ? "Recording..." : "Ready to record"}
              </div>

              <button 
                onClick={handleToggleRecording}
                className={`h-20 w-20 rounded-full flex items-center justify-center transition-colors ${
                  status === "recording" ? 'bg-red-500' : 'bg-gray-200 hover:bg-gray-300'
                }`}
              >
                {status === "recording" ? 
                  <Circle  /> : 
                  <AudioWaveform className="h-8 w-8 text-gray-800" />
                }
              </button>

              {mediaBlobUrl && (
                <>
                  <div className="mt-6 w-full max-w-md">
                    <audio 
                      controls 
                      src={mediaBlobUrl} 
                      className="w-full rounded-md shadow-sm border border-gray-300" 
                    />
                  </div>
                  
                  <button
                    onClick={handleSendRecording}
                    className="mt-4 px-4 py-2 bg-black text-white rounded-full flex items-center hover:bg-gray-900"
                  >
                    <ArrowUp className="h-5 w-5 mr-2" />
                    Send
                  </button>
                </>
              )}
              
              <button
                onClick={() => setIsRecordingMode(false)}
                className="mt-6 text-gray-600 hover:text-gray-900"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch(value);
            }}
            className="relative bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden"
          >
            <div className="flex items-center w-full p-2">
              <div className="flex-shrink-0 pl-2">
                <button
                  type="button"
                  onClick={props.openFileDialog}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full"
                >
                  <CirclePlus className="h-6 w-6" />
                </button>
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
              
              <div className="flex items-center pr-2">
                <button
                  type="button"
                  onClick={() => setShowSettings(!showSettings)}
                  className="p-2 mr-1 hover:text-gray-700 hover:bg-gray-100 rounded-full bg-black text-white"
                >
                  <MessageSquare className="h-5 w-5" />
                </button>
                
                <button
                  type="button"
                  onClick={handleActionButton}
                  className="p-2 rounded-full bg-black text-white hover:bg-gray-900"
                >
                  {value.trim() ? 
                    <ArrowUp className="h-5 w-5" />
                    : 
                    <AudioWaveform className="h-5 w-5" />
                  }
                </button>
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
  let { type, message, messages, needsRebuild, rebuild } = props.message
  messages = messages || []

  const hasBots = messages.length > 0

  if (type == "bot") {
    return (
      <div className="flex w-full max-w-3xl">
        <div className="flex gap-3 w-full">
          <div className="flex-grow">
            {hasBots ? (
              <div className="space-y-6 w-full">
                {messages.map((m) => (
                  <div key={m.id} className="w-full">
                    <div className="font-medium text-xs mb-1 border border-gray-300 rounded-lg p-3 px-4 w-fit">
                      {m.botName}
                    </div>
                    <BotChatMessage m={m} isWaiting={isWaiting} rebuild={rebuild} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-800 rounded-lg max-w-full prose prose-sm">
                <div>{message}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full max-w-3xl ml-auto justify-end">
      <div className="flex gap-3">
        <div className="bg-gray-100 text-black p-2 rounded-lg max-w-md">
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
    </div>
  );
}
