import { useEffect, useRef, useState } from "react"
import { Button, Input, Modal, Select, SelectProps, Tabs } from "antd"
const { Search } = Input
import { MdMic, MdStop } from "react-icons/md";
import { MdSend } from "react-icons/md"
import { BsRobot } from "react-icons/bs"
import { FaThumbsUp } from "react-icons/fa"
import { FaThumbsDown } from "react-icons/fa"
import { BsEmojiSmile } from "react-icons/bs"
import {useReactMediaRecorder} from "react-media-recorder"
import { api } from "../api"
import { useForceUpdate, useMultiState } from "../components"
import { BotChatMessage } from './botmessage'
import type { TabsProps } from 'antd'

interface Bots {
  [index: number]: {
    name: string
    id: string
    history: BotHistory[]
  }
}

export function AIBot() {

  const [state, setState] = useMultiState({
    isSending: false,
    rebuilding: false,
    loadingBotList: false,
    bots: {} as Bots,
    selectedBots: [] as number[],
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
      message: "Hello, I am Signpost Bot. How can I help you?",
    }
  ])

  const onSend = async (message: string) => {

    // message ||= "what is kobo forms?"
    message ||= "how do I get a passport in Iraq?"
    // message ||= "What documents do I need to work in Greece?"
    // message ||= "what about Communication Channels and contact?"

    if (!message) return

    const selectedBots = state.selectedBots.map(b => ({ label: state.bots[b].name, value: b, history: state.bots[b].history }))

    messages.current.unshift({ type: "human", message })
    setState({ isSending: true })

    const response = await api.askbot({ message }, selectedBots)

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

    messages.current.unshift(response)
    setState({ isSending: false })
  }

  const onRebuild = async () => {
    setState({ isSending: true })
    const selectedBots = state.selectedBots.map(b => ({ label: state.bots[b].name, value: b, history: state.bots[b].history }))
    const response = await api.askbot({ command: "rebuild", }, selectedBots)
    messages.current.unshift(response)
    setState({ isSending: false })
  }

  const onSelectBot = (e: string[]) => {
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

  const hasSelectedBots = state.selectedBots.length > 0

  return <div className="bg-white text-black grid grid-rows-3 grid-cols-1 p-4 relative" style={{ gridTemplateRows: "auto 1fr auto", }}>
    <div className="-mt-6 -mb-2 ml-1 flex items-center">
      <h2>Signpost Bot</h2>
      <div className="px-4 flex-grow flex">
        <div className="w-32 mt-1">Selected Bots</div>
        <Select
          mode="multiple"
          className="w-full"
          placeholder="Please select"
          disabled={state.isSending}
          onChange={onSelectBot}
          options={Object.keys(state.bots).map(k => ({ label: state.bots[k].name, value: k }))}
          loading={Object.values(state.bots).length == 0}
        />
      </div>
    </div>
    <div className="relative">
      <div className="absolute top-0 right-0 left-0 bottom-0 overflow-y-auto border border-solid border-gray-300 p-4 flex flex-col-reverse" >
        {state.isSending &&
          <div className="flex mt-8">
            <BsRobot size={24} className="text-indigo-500" />
            <div className="whitedots h-4 w-4  ml-2 mt-1" />
          </div>
        }
        {messages.current.map((m, i) => <ChatMessage key={i} message={m} isWaiting={state.isSending} />)}
      </div>
    </div>
    {hasSelectedBots && <div className="mt-4">
      <SearchInput onSearch={onSend} disabled={state.isSending} />
    </div>}
    {!hasSelectedBots && <div className="mt-4 flex justify-center">
      Please Select one or more bots
    </div>}
  </div>

}

function SearchInput(props: { onSearch: (message: string) => void, disabled: boolean }) {

  const [value, setValue] = useState("")
  const [isVoiceMode, setIsVoiceMode] = useState<boolean>(false)
  const [recordingComplete, setRecordingComplete] = useState<boolean>(false)

  const {
    status,
    startRecording,
    stopRecording,
    mediaBlobUrl,
    clearBlobUrl,
  } = useReactMediaRecorder({audio: true})

    const handleToggleRecording = () => {
       if(status === "recording") {
        stopRecording();
        setRecordingComplete(true)
       } else {
        clearBlobUrl();
        startRecording();
        setRecordingComplete(false)
       }
    }

  const handleModeToggle = () => {
      setIsVoiceMode(!isVoiceMode);
  }

  const handleSearchChange = (e: React.ChangeEvent <HTMLInputElement>) => {
    setValue(e.target.value)
  }

  const handleSearch = (v:string) => {
    props.onSearch(v);
    setValue("")
  }

  const handleSendRecording = async () => {
    if(mediaBlobUrl) {
      const response = await fetch(mediaBlobUrl);
      const blob = await response.blob()
      console.log("Sending audio blob to server:", blob)

      clearBlobUrl()
      setRecordingComplete(false)
    }
  }

  // const onChange = (e: any) => {
  //   setValue(e.target.value)
  // }
  // const onSearch = (v) => {
  //   props.onSearch(v)
  //   setValue("")
  // }

  return (
    <div>
    <div className="mb-4 flex justify-between">
      <Button onClick={handleModeToggle} type="primary" className="w-40">
        {isVoiceMode ? "Switch to Text" : "Switch to Voice"}
      </Button>
    </div>

    {!isVoiceMode ? (
      <Search
        value={value}
        onChange={handleSearchChange}
        className="w-full"
        size="large"
        disabled={props.disabled}
        placeholder="Ask me anything"
        enterButton={<MdSend className="mt-1" />}
        onSearch={handleSearch}
      />
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
          icon={status === "recording" ? <MdStop className="text-xl"/> : <MdMic className="text-xl" />}
          type="primary"
          shape="circle"
          size="large"
          className="flex items-center justify-center"
        />
        { recordingComplete && mediaBlobUrl && (
          <div className="mt-4 flex items-center">
          <audio controls src={mediaBlobUrl} className="mt-4" />
          <Button 
          onClick={handleSendRecording}
          icon={<MdSend/>}
          type="primary"
          shape="circle"
          size="large"
          className="h-10 ml-6"
          />
          </div>
        )}
      </div>
    )}
  </div>
);
}
  
interface MessageProps {
  message: ChatMessage
  isWaiting?: boolean
}

function ChatMessage(props: MessageProps) {

  const { isWaiting } = props
  let { type, message, messages, needsRebuild, rebuild } = props.message
  messages = messages || []
  const items: TabsProps['items'] = []

  for (const m of messages) {
    items.push({
      key: m.id as any,
      label: m.botName,
      children: <BotChatMessage m={m} key={m.id} isWaiting={isWaiting} rebuild={rebuild} />
    })
  }

  const hasBots = messages.length > 0

  if (type == "bot") {

    return <div className="mt-8">
      <div className="flex">
        <div className="">
          <BsRobot size={24} className="text-indigo-500" />
        </div>
        {hasBots && <div className="-mt-3 ml-4 w-full flex gap-4">

          {messages.map((m) => {
            return <div key={m.id} className="">
              <div className="font-medium text-xs text-blue-500 mb-1">{m.botName}</div>
              <BotChatMessage m={m} key={m.id} isWaiting={isWaiting} rebuild={rebuild} />
            </div>
          })}

          {/* <Tabs className="w-full" items={items} /> */}
        </div>}
        {!hasBots && <div className="">
          <div className="ml-2">{message}</div>
        </div>}
      </div>
    </div>

    // return <div className="mt-8">
    //   <div className="flex">
    //     <div className="">
    //       <BsRobot size={24} className="text-indigo-500" />
    //     </div>
    //     {hasBots && <div className="-mt-3 ml-4 w-11/12">
    //       <Tabs className="w-full" items={items} />
    //     </div>}
    //     {!hasBots && <div className="">
    //       <div className="ml-2">{message}</div>
    //     </div>}
    //   </div>
    // </div>


  }

  return <div className="mt-8">
    <div className="flex">
      <div>
        <BsEmojiSmile size={24} className="" />
      </div>
      <div>
        <div className="ml-2">{message}</div>
      </div>
      {!isWaiting && needsRebuild && <Button
        className="mx-2 -mt-1"
        type="primary"
        onClick={rebuild}
        loading={isWaiting}
        disabled={isWaiting}>
        Rebuild
      </Button>}
    </div>
  </div>

}


