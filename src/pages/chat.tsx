"use client";

import {useChat} from '@ai-sdk/react'
import { useForm, FormProvider} from "react-hook-form"
import { useCallback, useEffect, useState, useRef } from 'react'
import { getBots } from '@/api/getBots'
import { Paperclip, SendHorizontal, Triangle, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import {FormField, FormItem, FormControl, FormMessage} from '@/components/ui/form'
import { data } from 'react-router-dom';
import { SourcesTable } from "@/components/sources-table"
import { availableSources } from "@/components/forms/files-modal"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export default function Chat() {
  const {messages, append, setMessages} = useChat({api: "https://directus-qa-support.azurewebsites.net/ai/",})
  const [bots, setBots] = useState<{[index: number]: string}> ({})
  const [selectedBot, setSelectedBot] = useState<number | null>(null)
  const [selectedBotName, setSelectedBotName] = useState<string> ("Select a bot")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [showFileDialog, setShowFileDialog] = useState(false);
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [sources, setSources] = useState(availableSources);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading])

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

  useEffect(() => {
    setSources(availableSources);
  }, [availableSources]);

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
      setIsLoading(true);
  
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
      } finally {
        setIsLoading(false);
      }
    },
    [selectedBot, messages, append, form]
  )

  const formatMessage = (content: string) => {
    // Handle numbered lists (1. 2. 3. etc)
    content = content.replace(/^\d+\.\s/gm, (match) => `<span class="mr-2">${match}</span>`);
    
    // Handle bullet points
    content = content.replace(/^\*\s/gm, '• ');
    
    // Handle bold text
    content = content.replace(
      /\*\*(.*?)\*\*/g,
      '<strong class="font-bold">$1</strong>'
    );
    
    // Handle links [text](url)
    content = content.replace(
      /\[(.*?)\]\((.*?)\)/g,
      '<a href="$2" class="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">$1</a>'
    );

    // Handle paragraphs
    content = content.split('\n\n').map(para => 
      `<p class="my-2">${para}</p>`
    ).join('');

    return content;
  };

  const handleToggleSelect = (id: string) => {
    setSelectedSources(prev => 
      prev.includes(id) 
        ? prev.filter(sourceId => sourceId !== id)
        : [...prev, id]
    );
  };

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedSources(event.target.checked ? sources.map(source => source.id) : []);
  };

  const handleAttachFiles = () => {
    const selectedContent = selectedSources
      .map(id => sources.find(source => source.id === id))
      .filter(Boolean)
      .map(source => `<h2>${source?.name}</h2>\n${source?.content}`)
      .join('\n\n');

    if (selectedContent) {
      form.setValue('message', form.getValues('message') + '\n\n' + selectedContent);
    }
    setShowFileDialog(false);
    setSelectedSources([]);
  };

  return(
    <div className='flex flex-col h-screen w-full max-w-4xl mx-auto'>
      <div className="py-2 border-b pt-6 flex flex-row justify-between items-center">
        <h2 className="text-lg font-bold">Chatbot Playground</h2>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              {selectedBotName}
              <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className='w-56 max-h-60 overflow-y-auto'>
            <DropdownMenuLabel>Select a bot</DropdownMenuLabel>
            <DropdownMenuGroup>
              {Object.entries(bots).map(([id, name]) => (
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
          <>
            {messages.map((message, index) => (
              <div
                key={index}
                className={`p-2 rounded-lg w-fit ${
                  message.role === "user" 
                    ? "bg-gray-300 text-black ml-auto" 
                    : "bg-gray-100 text-gray-800 animate-message-popup"
                }`}
              >
                <span 
                  className={message.role === "assistant" ? "animate-typing-text block" : ""}
                  dangerouslySetInnerHTML={{ 
                    __html: message.role === "assistant" 
                      ? formatMessage(message.content) 
                      : message.content 
                  }}
                />
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start w-fit">
                <div className="bg-gray-100 rounded-lg p-3 flex gap-1">
                  <div className="w-2.5 h-2.5 rounded-full animate-typing-1 bg-gradient-to-r from-pink-500 to-violet-500"></div>
                  <div className="w-2.5 h-2.5 rounded-full animate-typing-2 bg-gradient-to-r from-violet-500 to-cyan-500"></div>
                  <div className="w-2.5 h-2.5 rounded-full animate-typing-3 bg-gradient-to-r from-cyan-500 to-pink-500"></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(handleSendMessage)} className="flex items-center border-t pt-2 bg-white pb-8">
          <button 
            type="button" 
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
            onClick={() => setShowFileDialog(true)}
          >
            <Paperclip className="size-5 text-gray-500" />
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

      <style>{`
        @keyframes typing {
          0%, 100% {
            transform: translateY(0px);
            opacity: 0.8;
            background-position: 0% 50%;
          }
          50% {
            transform: translateY(-4px);
            opacity: 1;
            background-position: 100% 50%;
          }
        }

        .animate-typing-1 {
          animation: typing 1s infinite, colorShift1 3s infinite linear;
          background-size: 200% 200%;
        }
        
        .animate-typing-2 {
          animation: typing 1s infinite 0.2s, colorShift2 3s infinite linear;
          background-size: 200% 200%;
        }
        
        .animate-typing-3 {
          animation: typing 1s infinite 0.4s, colorShift3 3s infinite linear;
          background-size: 200% 200%;
        }

        @keyframes colorShift1 {
          0%, 100% { filter: hue-rotate(0deg); }
          50% { filter: hue-rotate(180deg); }
        }

        @keyframes colorShift2 {
          0%, 100% { filter: hue-rotate(120deg); }
          50% { filter: hue-rotate(300deg); }
        }

        @keyframes colorShift3 {
          0%, 100% { filter: hue-rotate(240deg); }
          50% { filter: hue-rotate(60deg); }
        }

        @keyframes messagePopup {
          0% {
            opacity: 0;
            transform: translateY(8px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-message-popup {
          animation: messagePopup 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
