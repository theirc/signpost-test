import { AgentChatMessage} from "@/types/types.ai"
import { useState, useEffect } from "react"
import { Search, X } from "lucide-react"
import { supabase } from '@/lib/data/db'

export interface ChatSession {
  uid: string          
  agentName?: string
  selectedAgents: number[]
  messages: AgentChatMessage[]
  timestamp: string
}

export async function saveChatMessage(
  userId: string,
  agentId: string,
  teamId: string,
  role: 'user' | 'assistant',
  content: string
): Promise<{ data: any; error: any }> {
  const { data, error } = await supabase
    .from('chat_history')
    .insert({
      user_id: userId,
      agent_id: agentId,
      team_id: teamId,
      role,
      content
    })
    .select()
    .single()

  return { data, error }
}

export async function getChatSessions(userId: string, teamId: string): Promise<{ data: ChatSession[] | null; error: any }> {
  const { data: chatRecords, error } = await supabase
    .from('chat_history')
    .select('*')
    .eq('user_id', userId)
    .eq('team_id', teamId)
    .order('created_at', { ascending: true })
  
  if (error || !chatRecords) {
    return { data: null, error }
  }

  const sessionsMap = new Map<string, ChatSession>()

  chatRecords.forEach(record => {
    const sessionKey = `${record.user_id}-${record.agent_id}-${record.team_id}`
    
    if (!sessionsMap.has(sessionKey)) {
      sessionsMap.set(sessionKey, {
        uid: sessionKey,
        agentName: record.agent_id,
        selectedAgents: [parseInt(record.agent_id)],
        messages: [],
        timestamp: record.created_at
      })
    }

    const session = sessionsMap.get(sessionKey)!
    const message: AgentChatMessage = {
      type: record.role === 'user' ? 'human' : 'agent',
      message: record.content
    }

    session.messages.push(message)
    
    if (record.created_at > session.timestamp) {
      session.timestamp = record.created_at
    }
  })

  const sessions = Array.from(sessionsMap.values())
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  return { data: sessions, error: null }
}

interface ChatHistoryProps {
  setActiveChat: (chat: ChatSession | null) => void
  onSelectAgent?: (agentId: string[]) => void
  agents: Record<number, { name: string }>  
  chatHistory: ChatSession[]
}

export function ChatHistory({ setActiveChat, onSelectAgent, agents, chatHistory }: ChatHistoryProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredHistory, setFilteredHistory] = useState(chatHistory)

  const getMessageAsString = (message: string | object | undefined): string => {
    if (!message) return ""
    if (typeof message === "string") return message
    return JSON.stringify(message, null, 2)
  }

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredHistory(chatHistory)
      return
    }

    const lowerQuery = searchQuery.toLowerCase()
    const filtered = chatHistory.filter(chat => {
      const firstMessage = chat.messages && chat.messages.length > 0
        ? getMessageAsString(chat.messages[0].message).toLowerCase()
        : ""
      
      if (firstMessage.includes(lowerQuery)) {
        return true
      }
      
      return chat.messages.some(msg => {
        const messageStr = getMessageAsString(msg.message).toLowerCase()
        return messageStr.includes(lowerQuery)
      })
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

  const getAgentNames = (selectedAgentIds: number[]) => {
    if (!selectedAgentIds || selectedAgentIds.length === 0) {
      return "Chat"
    }
    
    return selectedAgentIds
      .map(id => agents[id]?.name || "")
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

  const handleChatSelect = (chat: ChatSession) => {
    setActiveChat(chat)
    
    if (chat.selectedAgents && chat.selectedAgents.length > 0 && onSelectAgent) {
      onSelectAgent(chat.selectedAgents.map(id => id.toString()))
    }
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
              ? getMessageAsString(chat.messages[0].message)
              : "New Conversation"

            const agentNames = chat.selectedAgents && chat.selectedAgents.length > 0
              ? getAgentNames(chat.selectedAgents)
              : chat.agentName || "Chat"

            return (
              <button
                key={chat.uid}
                className="w-full text-left p-2 hover:bg-gray-100 rounded-lg transition-colors"
                onClick={() => handleChatSelect(chat)}
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
                    {agentNames}
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