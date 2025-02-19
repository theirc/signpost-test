"use client";

import {useChat} from '@ai-sdk/react'
import { useForm, FormProvider} from "react-hook-form"
import { useCallback, useEffect, useState } from 'react'
import { getBots } from '@/api/getBots'
import { Paperclip, SendHorizontal, Triangle } from 'lucide-react'
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import {FormField, FormItem, FormControl, FormMessage} from '@/components/ui/form'
import { data } from 'react-router-dom';

export default function Chat() {
  const {messages, append, setMessages} = useChat({api: "https://directus-qa-support.azurewebsites.net/ai/",})
  const [bots, setBots] = useState<{[index: number]: string}> ({})
    const [selectedBot, setSelectedBot] = useState<number | null>(null)
    const [selectedBotName, setSelectedBotName] = useState<string> ("Select a bot")

    const form = useForm({
      defaultValues: {
        message: "",
      }
    })

    useEffect(() => {
        async function loadBots () {
          const botList = await getBots()
          setBots(botList)
          if(Object.keys(botList).length > 0) {
            const firstBotId = Number(Object.keys(botList)[0])
            setSelectedBot(firstBotId)
            setSelectedBotName(botList[firstBotId])
          }
        }
        loadBots()
    }, [])

    const handleBotChange = useCallback ((botId: number) => {
      setSelectedBot(botId)
      setSelectedBotName(bots[botId])
      setMessages([])
    }, [bots, setMessages])

    const handleSendMessage = useCallback(
      async (data: { message: string }) => {
        if (!data.message.trim() || !selectedBot) return;
  
        append({ role: "user", content: data.message });
        form.reset();
    
      try {
        const API_URL = "https://directus-qa-support.azurewebsites.net";
    
        const requestPayload = {
          message: data.message,
          id: selectedBot, 
          history: messages, 
          tts: false, 
        };

        const response = await fetch(`${API_URL}/ai/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestPayload),
        });
    
        if (!response.ok) {
          throw new Error(`Server Error: ${response.status}`);
        }
    
        const responseData = await response.json();
    
        const reply = responseData.message || responseData.messages?.[0]?.message || "No response received.";
        append({ role: "assistant", content: reply });
      } catch (error) {
        append({ role: "assistant", content: "Failed to get response. Please try again." });
      }
    },
    [selectedBot, messages, append, form]
  )

    return(
        <div className='flex flex-col h-screen w-full max-w-4xl mx-auto'>
            <div className="py-2 border-b pt-6 flex flex-row justify-between items-center">
            <h2 className="text-lg font-bold">Chatbot Playground</h2>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">{selectedBotName}</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className='w-56 max-h-60 overflow-y-auto'>
           <DropdownMenuLabel>Select a bot</DropdownMenuLabel>
           <DropdownMenuGroup>{Object.entries(bots).map(([id, name]) => (
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
        <button type="button" className="p-2">
          <Paperclip className="size-5 text-gray-300" />
        </button>

        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem className="flex-1">
              <FormControl>
                <Input placeholder="Send a message" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="ml-2 bg-gray-700 text-white">
          <SendHorizontal className="size-5" />
        </Button>
      </form>
    </FormProvider>
    </div>
  );
}
