import { useState, useEffect } from "react"
import { BotHistory, ChatMessage } from "@/types/types.ai"

const LOCAL_STORAGE_KEY = "chatHistory"

export interface ChatSession {
    id: string
    botName?: string
    messages: ChatMessage[]
    timestamp: string
}

interface ChatHistoryProps {
    setActiveChat: (chat: ChatSession | null) => void
    onSelectBot?: (botId: string) => void
    bots: Record<number, {name: string; history: BotHistory[]}>
}
export function ChatHistory  ({setActiveChat, onSelectBot, bots}: ChatHistoryProps)  {
    const [chatHistory, setChatHistory] = useState<ChatSession[]>([])

    useEffect(() => {
      const savedChats = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || "[]");
      console.log("Loading chat history from LocalStorage:", savedChats)
      if (Array.isArray(savedChats)) {
        setChatHistory(savedChats)
      }
    }, [])
  
    return (
      <div className="w-full">
        <h3 className="text-sm font-semibold mb-1">Chat History</h3>
        <div className="h-64 overflow-y-auto border p-2 rounded bg-gray-50">
          {chatHistory.length === 0 ? (
            <p className="text-xs text-gray-500">No past chats</p>
          ) : (
            chatHistory.map((chat) => {
              const botEntry = Object.entries(bots).find(([id, bot]) => bot.name === chat.botName)
             return (
            <div
              key={chat.id}
              className="p-2 text-xs cursor-pointer border-b hover:bg-gray-200"
              onClick={() => {
                setActiveChat(chat);
                if (botEntry) {
                  onSelectBot(botEntry[0])
                  }
                }}
                >
                  <p className="truncate font-semibold">{chat.botName || "Chat"}</p>
                  <span className="text-xs text-gray-500">{chat.timestamp}</span>
                </div>
              );
            })
          )}
        </div>
      </div>
    )
  }