"use client";

import { useEffect, useRef, useState } from 'react'
import { api } from '@/api/getBots'
import { Bot, Play, SendHorizontal, Triangle, Square, Mic, ChevronDown, Loader2, MessageSquare, StopCircle, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useMultiState } from '@/hooks/use-multistate'
import { Comm } from '../bot/comm'
import { BotChatMessage } from '@/bot/botmessage'
import { BotHistory } from '@/types/types.ai';
import type { ChatMessage } from '@/types/types.ai';
import { useReactMediaRecorder } from "react-media-recorder";

interface Bots {
  [index: number]: {
    name: string
    id: string
    history: BotHistory[]
  }
}

export default function Chat () {

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

  const messages = useRef<ChatMessage[]>([
    {
      type: "bot",
      message: "Hello, I am SignpostChat. How can I assist you today?",
    }
  ])

  const onSend = async (message?: string, audio?: any, tts?: boolean) => {

    if (!message && !audio) return

    const selectedBots = state.selectedBots.map(b => ({ label: state.bots[b].name, value: b, history: state.bots[b].history }))

    if (message) {
      messages.current.unshift({ type: "human", message })
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

  function onModeChanged() {
    setState({ audioMode: !state.audioMode })
  }

  const hasSelectedBots = state.selectedBots.length > 0

  return (  <div className="flex flex-col h-screen w-full mx-auto">
  <div className="py-4 border-b flex justify-between items-center bg-white px-4 shadow-md">
    <h2 className="text-lg font-bold">Signpost Bot</h2>
    
    {/* Bot Selector */}
    <div className="flex-grow flex px-4">
      <Select onValueChange={onSelectBot}>
        <SelectTrigger>
          <SelectValue placeholder="Please select Bots" />
        </SelectTrigger>
        <SelectContent>
          {Object.keys(state.bots).map((k) => (
            <SelectItem key={k} value={k}>{state.bots[k].name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>

    {/* Audio Mode Toggle */}
    <Button onClick={onModeChanged} size="icon" variant="outline">
      {state.audioMode ? <MessageSquare className="size-5" /> : <Mic className="size-5" />}
    </Button>
  </div>

  <div className="flex-1 flex flex-col p-4 overflow-y-auto">
  <div className="flex-1 overflow-y-auto flex flex-col space-y-4"> 
    {state.isSending && <Loader2 className="animate-spin mx-auto" />}

    {/* Messages */}
    {!state.audioMode && (
      <div className="flex-1 overflow-y-auto p-6 space-y-4 w-full">
        {messages.current.length === 0 ? (
          <div className="flex flex-col items-center text-gray-500">
            <p>Start chatting below!</p>
          </div>
        ) : (
          messages.current.map((m, i) => (
            <ChatMessage key={i} message={m} isWaiting={state.isSending} />
          ))
        )}
      </div>
    )}
  </div>
  </div>

  {/* Voice Mode - Comm Component */}
  {state.audioMode && hasSelectedBots && (
    <Comm bot={state.selectedBots[0] ? state.selectedBots[0] : null} />
  )}

  {/* Message Input Box */}
  {hasSelectedBots && !state.audioMode ? (
    <div className="border-t p-4 bg-white">
      <SearchInput onSearch={onSend} disabled={state.isSending} />
    </div>
  ) : (
    <div className="border-t p-4 flex justify-center text-gray-600 bg-white">
      Please select one or more bots
    </div>
  )}
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
        e.preventDefault();
        handleSearch(value);
      }}
      className="flex items-center border border-gray-300 rounded-lg p-2 bg-white shadow-sm w-full"
    >
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
    </div>
  )
}

interface MessageProps {
  message: ChatMessage
  isWaiting?: boolean
}

function ChatMessage(props: MessageProps) {
  const { isWaiting } = props;
  let { type, message, messages = [], needsRebuild, rebuild } = props.message;

  const isBot = type === "bot"
  const hasBots = messages.length > 0;

  return (
    <div className={`mt-4 flex w-full ${isBot ? "justify-start" : "justify-end"}`}>
    {hasBots ? (
      <Tabs defaultValue={messages[0]?.id?.toString()}>
        <TabsList>
          {messages.map((m) => (
            <TabsTrigger key={m.id} value={m.id.toString()}>
              {m.botName}
            </TabsTrigger>
          ))}
        </TabsList>

        {messages.map((m) => (
          <TabsContent key={m.id} value={m.id.toString()}>
            <BotChatMessage m={m} isWaiting={isWaiting} rebuild={rebuild} />
          </TabsContent>
        ))}
      </Tabs>
    ) : (
      <div className={`p-3 rounded-lg ${isBot ? "bg-gray-100 text-black" : "bg-gray-200 text-black max-w-xs"}`}>
        {message}
      </div>
    )}

    {!isWaiting && needsRebuild && (
      <Button
        className="mx-2 -mt-1"
        variant="default"
        onClick={rebuild}
        disabled={isWaiting}
      >
        {isWaiting ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          "Rebuild"
        )}
      </Button>
    )}
  </div>
)
}
}