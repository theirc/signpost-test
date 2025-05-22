import { BotHistory, ChatMessage } from "@/types/types.ai"
import { useState, useEffect } from "react"
import { Search, X } from "lucide-react"

const LOCAL_STORAGE_KEY = "chatHistory"

export interface ChatSession {
  id: string
  botName?: string
  selectedBots: number[]
  messages: ChatMessage[]
  timestamp: string
}

interface ChatHistoryProps {
  setActiveChat: (chat: ChatSession | null) => void
  onSelectBot?: (botId: string[]) => void
  bots: Record<number, { name: string; history: BotHistory[] }>
  chatHistory: ChatSession[]
}

export function ChatHistory({ setActiveChat, onSelectBot, bots, chatHistory }: ChatHistoryProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredHistory, setFilteredHistory] = useState(chatHistory)

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredHistory(chatHistory)
      return
    }

    const lowerQuery = searchQuery.toLowerCase()
    const filtered = chatHistory.filter(chat => {
      const firstMessage = chat.messages && chat.messages.length > 0
        ? chat.messages[0].message?.toLowerCase() || ""
        : ""
      
      if (firstMessage.includes(lowerQuery)) {
        return true
      }
      
      return chat.messages.some(msg => 
        msg.message && typeof msg.message === 'string' && 
        msg.message.toLowerCase().includes(lowerQuery)
      )
    })
    
    setFilteredHistory(filtered)
  }, [searchQuery, chatHistory])

  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp)

      const today = new Date()
      const isToday = date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear()

      if (isToday) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      } else {
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
      }
    } catch (e) {
      return timestamp
    }
  }

  const getBotNames = (selectedBotIds: number[]) => {
    if (!selectedBotIds || selectedBotIds.length === 0) {
      return "Chat"
    }
    
    return selectedBotIds
      .map(id => bots[id]?.name || "")
      .filter(name => name)
      .join(", ")
  }
  const highlightText = (text: string, query: string) => {
    if (!query.trim() || !text) return text
    
    const parts = text.split(new RegExp(`(${query})`, 'gi'))
    
    return (
      <>
        {parts.map((part, i) => 
          part.toLowerCase() === query.toLowerCase() 
            ? <mark key={i} className="bg-yellow-200 px-0.5">{part}</mark> 
            : part
        )}
      </>
    )
  }

  return (
    <div className="w-full">
      <div className="sticky top-0 bg-white pb-3">
        <div className="relative">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations"
            className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-3 flex items-center"
            >
              <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>
      </div>

      {filteredHistory.length === 0 ? (
        searchQuery ? (
          <p className="text-gray-500 text-center py-4 text-sm">No conversations found</p>
        ) : (
          <p className="text-gray-500 text-left">No past chats</p>
        )
      ) : (
        <div className="space-y-4">
          {filteredHistory.map((chat) => {
            const firstMessage = chat.messages && chat.messages.length > 0
              ? chat.messages[0].message
              : "New Conversation"

            const botNames = chat.selectedBots && chat.selectedBots.length > 0
              ? getBotNames(chat.selectedBots)
              : chat.botName || "Chat"

            return (
              <button
                key={chat.id}
                className="w-full text-left p-2 hover:bg-gray-100 rounded-lg transition-colors"
                onClick={() => {
                  setActiveChat(chat)
                  if (chat.selectedBots && chat.selectedBots.length > 0 && onSelectBot) {
                
                    onSelectBot(chat.selectedBots.map(id => id.toString()))
                  }
                }}
              >
                <div className="flex justify-between items-center">
                  <p className="text-md text-left pl-2 truncate flex-1">
                    {searchQuery ? highlightText(firstMessage, searchQuery) : firstMessage}
                  </p>
                  <span className="text-xs text-gray-500 ml-2 whitespace-nowrap">
                    {formatTimestamp(chat.timestamp)}
                  </span>
                </div>
                <div className="flex items-center mt-1">
                  <span className="text-xs text-gray-500 pl-2">
                    {botNames}
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}