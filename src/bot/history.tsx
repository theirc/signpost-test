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
    chatHistory: ChatSession[]
}
export function ChatHistory  ({setActiveChat, onSelectBot, bots, chatHistory}: ChatHistoryProps)  {
  return (
    <div className="w-full h-full flex flex-col p-4 overflow-y-auto">
      <h2 className="text-1xl font-bold mb-6 text-left">Chat History</h2>
      
      <div className="flex-1">
        {chatHistory.length === 0 ? (
          <p className="text-gray-500 text-left">No past chats</p>
        ) : (
          <div className="space-y-4">
            {chatHistory.map((chat) => {
              const firstMessage = chat.messages && chat.messages.length > 0 ? chat.messages[0].message : "New Conversation"
              const botEntry = Object.entries(bots).find(([_, bot]) => bot.name === chat.botName)
              
              return (
                <button
                  key={chat.id}
                  className="w-full text-left p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  onClick={() => {
                    setActiveChat(chat);
                    if (botEntry && onSelectBot) {
                      onSelectBot(botEntry[0])
                    }
                  }}
                >
                  <p className="text-md text-left pl-2">{firstMessage}</p>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}