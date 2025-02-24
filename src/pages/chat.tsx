"use client";

import {useChat} from '@ai-sdk/react'
import { useForm, FormProvider} from "react-hook-form"
import { useEffect } from 'react'
import { getBots } from '@/api/getBots'
import { Paperclip, Play, SendHorizontal, Triangle, Mic } from 'lucide-react'
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import {FormField, FormItem, FormControl, FormMessage} from '@/components/ui/form'
import { useMultiState } from '@/hooks/hooks';
import {useReactMediaRecorder} from 'react-media-recorder'

export default function Chat() {
  const {messages, append, setMessages} = useChat({api: "https://directus-qa-support.azurewebsites.net/ai/",})
  
  const [state, setState] = useMultiState ({
    bots: {} as {[index: number]: string},
    selectedBot: null as number | null,
    selectedBotName: "Select a bot",
    botAudio: null as string | null,
    isVoiceMode: false,
    isRecording: false,
    recordingComplete: false,
    tts: false,
  })

    const form = useForm({
      defaultValues: {
        message: "",
      }
    })

    useEffect(() => {
        async function loadBots () {
          const botList = await getBots()
          setState({bots: botList})

          if(Object.keys(botList).length > 0) {
            const firstBotId = Number(Object.keys(botList)[0])
            setState({selectedBot: firstBotId, selectedBotName: botList[firstBotId]})
          }
        }
        loadBots()
    }, [])

    const handleBotChange = (botId: number) => {
     setState({
      selectedBot: botId,
      selectedBotName: state.bots[botId],
     })
     setMessages([])
    } 
       
      const {status, startRecording, stopRecording, mediaBlobUrl, clearBlobUrl} = useReactMediaRecorder({audio: true})

      const handleRecording = () => {
        if( status === "recording"){
          stopRecording()
          setState({isRecording: false, recordingComplete: true})
          
          setTimeout(handleSendRecording, 1000)
        } else {
          clearBlobUrl()
          startRecording()
          setState({isRecording: true, recordingComplete: false})
        }
      }

      const blobToBase64 = (blob: Blob) => {
        return new Promise<string>((resolve, reject) => {
          const reader = new FileReader ()
          reader. onloadend = () => resolve(reader.result as string)
          reader.onerror = reject
          reader.readAsDataURL(blob)
        })
      }
    
      const handleSendRecording = async () => {
        if(mediaBlobUrl) {
          const response = await fetch(mediaBlobUrl)
          const blob = await response.blob()
          const base64Data = await blobToBase64(blob)

          console.log("Base64 Audio Data Ready:", base64Data)
    

          handleSendMessage({message: "", audio: base64Data, tts: state.tts})

          clearBlobUrl()
          setState({recordingComplete: false})
        }
      }
      const handleSendMessage = async ({message, audio, tts}: {message?: string; audio?: string; tts?: boolean}) => {
        if((!message || !message.trim()) && !audio) return

        append({ role: "user", content: message });
        form.reset();

      try {
        const API_URL = "https://directus-qa-support.azurewebsites.net";
        const requestPayload = {
          message: message || undefined,
          audio,
          id: state.selectedBot, 
          history: messages, 
          tts: state.tts, 
        }

        console.log("Sending request to API:", requestPayload);


        const response = await fetch(`${API_URL}/ai/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestPayload),
        })
    
        if (!response.ok) {
          throw new Error(`Server Error: ${response.status}`)
        }
    
    const responseData = await response.json()
    console.log("Response received:", responseData)

    
    const reply = responseData.message || responseData.messages?.[0]?.message || "No response received."
    append({ role: "assistant", content: reply })

     if(responseData.audioContent) {
      setState({botAudio: responseData.audioContent})
     }
    } catch (error) {
      console.error("Error sending message:", error)
    append({role: "assistant", content: "Failed to get response"})
    }
  }

  const playAudio = () => {
    if(state.botAudio) {
      const audio = new Audio(`data:audio/mp3;base64,${state.botAudio}`)
      audio.play()
    }
  }

  const toggleVoiceMode = () => {
    setState({isVoiceMode: !state.isVoiceMode})
  }
 
    return(
        <div className='flex flex-col h-screen w-full max-w-4xl mx-auto'>
            <div className="py-2 border-b pt-6 flex flex-row justify-between items-center">
            <h2 className="text-lg font-bold">Chatbot Playground</h2>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">{state.selectedBotName}</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className='w-56 max-h-60 overflow-y-auto'>
           <DropdownMenuLabel>Select a bot</DropdownMenuLabel>
           <DropdownMenuGroup>{Object.entries(state.bots).map(([id, name]) => (
            <DropdownMenuItem key={id} onClick={() => handleBotChange(Number(id))}>
                {name}
                </DropdownMenuItem>
           ))}
            </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          </div>

        <div className='flex-1 overflow-y-auto p-4 space-y-2'>
                {messages.length === 0 ? (
                    <div className='flex flex-col items-center text-center text-gray-500'>
                        <Triangle className='size-10 mb-4'/>
                        <p>This is an open-source chatbot. Start chatting below!</p>
                        </div>
                    ) : (
                        messages.map((message, index) => (
                          <div
                           key={index}
                            className={`p-2 rounded-lg w-fit ${
                              message.role === "user" ? "bg-gray-300 text-black ml-auto" : "bg-gray-100 text-gray-800"
                            }`}
                          >
                          {message.content}
                          </div>
                        ))
                      )}
                    </div>
              
          <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(handleSendMessage)} className="flex items-center border-t pt-2 bg-white pb-8">
          <Button type="button" onClick={toggleVoiceMode} className="ml-2 bg-gray-500 text-white">
            {state.isVoiceMode ? "Text" : "Voice"}
          </Button>

          {state.isVoiceMode ? (
            <Button type="button" onClick={handleRecording} className={`ml-2 ${status === "recording" ? "bg-red-500 text-white" : "bg-gray-700 text-white"}`}>
              <Mic className="size-5" />
            </Button>
          ) : (
            <Input placeholder="Send a message" {...form.register("message")} />
          )}
          {state.botAudio && (
            <Button onClick={playAudio} className="ml-2 bg-blue-500 text-white">
              <Play className="size-5" />
            </Button>
          )}

            <Button type="submit" className="ml-2 bg-gray-700 text-white">
            <SendHorizontal className="size-5" />
          </Button>
        </form>
      </FormProvider>
    </div>  
  )
}
