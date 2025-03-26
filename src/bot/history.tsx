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

  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      
      const today = new Date();
      const isToday = date.getDate() === today.getDate() &&  date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
      
      if (isToday) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } else {
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
      }
    } catch (e) {
      return timestamp;
    }
  }
  return (
    <div className="w-full">
    {chatHistory.length === 0 ? (
      <p className="text-gray-500 text-left">No past chats</p>
    ) : (
      <div className="space-y-4">
        {chatHistory.map((chat) => {
          const firstMessage = chat.messages && chat.messages.length > 0 
            ? chat.messages[0].message 
            : "New Conversation";
          const botEntry = Object.entries(bots).find(([_, bot]) => bot.name === chat.botName);
          
          return (
            <button
              key={chat.id}
              className="w-full text-left p-2 hover:bg-gray-100 rounded-lg transition-colors"
              onClick={() => {
                setActiveChat(chat);
                if (botEntry && onSelectBot) {
                  onSelectBot(botEntry[0]);
                }
              }}
            >
              <div className="flex justify-between items-center">
                <p className="text-md text-left pl-2 truncate flex-1">{firstMessage}</p>
                <span className="text-xs text-gray-500 ml-2 whitespace-nowrap">
                  {formatTimestamp(chat.timestamp)}
                </span>
              </div>
              <div className="flex items-center mt-1">
                <span className="text-xs text-gray-500 pl-2">
                  {chat.botName || "Chat"}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    )}
  </div>
)
}