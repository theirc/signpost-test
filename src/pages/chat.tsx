"use client"
const LOCAL_STORAGE_KEY = "chatHistory"

import { useEffect, useRef, useState } from 'react'
import { api } from '@/api/getBots'
import { app } from '@/lib/app'
import { MessageSquarePlus, AudioWaveform, ArrowUp, CirclePlus, Circle, Copy, Check, History } from 'lucide-react'
import AgentJsonView from '@/bot/agentview'
import { Button } from '@/components/ui/button'
import { useMultiState } from '@/hooks/use-multistate'
import { BotEntry, useAllBots } from '@/hooks/use-all-bots'
import { Comm } from '../bot/comm'
import { BotChatMessage } from '@/bot/botmessage'
import { ChatHistory, ChatSession } from '@/bot/history'
import { BotHistory } from '@/types/types.ai'
import type { ChatMessage } from '@/types/types.ai'
import { SearchInput } from '@/bot/search'
import { useReactMediaRecorder } from "react-media-recorder"
import { agents } from "@/lib/agents"
import { availableSources } from "@/components/source_input/files-modal"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { MultiSelectDropdown } from '@/components/ui/multiselect'
import type { Option } from '@/components/ui/multiselect'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuGroup,
  DropdownMenuSeparator, DropdownMenuCheckboxItem,} from "@/components/ui/dropdown-menu"
import "../index.css"


// Helper function to check for image URLs
export const isImageUrl = (url: string | undefined | null): boolean => {
  if (!url) return false;
  // Basic check for http/https and common image extensions
  return /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i.test(url);
};

// Helper function to parse markdown image and text
export const parseMarkdownImage = (text: string | undefined | null): { imageUrl: string | null; remainingText: string | null } => {
  if (!text) return { imageUrl: null, remainingText: null };
  
  // Regex to capture ![alt](url) and any subsequent text
  // Allows optional leading '!' for formats like [![Image](...)]
  // Captures URL in group 1, remaining text in group 2
  const markdownRegex = /^!?\[.*?\]\((.+?)\)\s*(.*)$/s; 
  const match = text.match(markdownRegex);

  if (match && match[1]) {
    const imageUrl = match[1];
    const remainingText = match[2] ? match[2].trim() : null; // Get text after the markdown
    // Basic validation if the extracted URL looks like an image URL
    if (isImageUrl(imageUrl)) { 
      return { imageUrl, remainingText };
    }
  }
  
  // If no markdown match, return nulls
  return { imageUrl: null, remainingText: null };
};

export default function Chat() {
  const {bots, loading, error} = useAllBots()
  const [sidebarVisible, setSidebarVisible] = useState(false)
  const [showFileDialog, setShowFileDialog] = useState(false)
  const [selectedSources, setSelectedSources] = useState<string[]>([])
  const [sources, setSources] = useState(availableSources)
  const [message, setMessage] = useState("")
  const [activeChat, setActiveChat] = useState<ChatSession | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoadingFromHistory, setIsLoadingFromHistory] = useState(false)
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const [state, setState] = useMultiState({
    isSending: false,
    rebuilding: false,
    loadingBotList: false,
    bots: {} as Record<number, BotEntry>,
    selectedBots: [] as number[],
    audioMode: false,
  })

  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible)
  }

  const handleResetChat = () => {
    setMessages([])
    setActiveChat(null)
    setState({ selectedBots: [] })
    setSidebarVisible(false)
  }

  useEffect(() => {
    if (!loading && !error) {
      setState({ bots })
    }
  }, [loading, error, bots, setState])


  useEffect(() => {
    setSources(availableSources)
  }, [availableSources])

  const [chatHistory, setChatHistory] = useState<ChatSession[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedChats = localStorage.getItem(LOCAL_STORAGE_KEY)
        if (savedChats) {
          const parsedChats = JSON.parse(savedChats)
          return Array.isArray(parsedChats) ? parsedChats : []
        }
      } catch (error) {
        console.error("Error loading initial chat history:", error)
      }
    }
    return []
  })

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(chatHistory))
  }, [chatHistory])


const handleLoadChatHistory = (chatSession: ChatSession) => {
  setIsLoadingFromHistory(true)
  setActiveChat(chatSession)

  setTimeout(() => {
    if (chatSession.messages && chatSession.messages.length > 0) {
      setMessages([...chatSession.messages])
    } else {
      setMessages([])
    }
    
    if (chatSession.selectedBots && chatSession.selectedBots.length > 0) {
      setState({ selectedBots: [...chatSession.selectedBots] })
    } else if (chatSession.botName) {
  
      const botEntry = Object.entries(state.bots).find(
        ([_, bot]) => bot.name === chatSession.botName
      )

      if (botEntry) {
        const botId = Number(botEntry[0])
        setState({ selectedBots: [botId] })
      }
    }
    
    setMessage(prev => prev + "")
    setIsLoadingFromHistory(false)
  }, 50)
}

function toggleBot(id: number) {
  const next = state.selectedBots.includes(id)
    ? state.selectedBots.filter(x => x !== id)
    : [...state.selectedBots, id]
  setState({ selectedBots: next })
  setMessages([])      
  setActiveChat(null)
}

const label =
  state.selectedBots.length > 0
    ? state.selectedBots.map(id => state.bots[id].name).join(", ")
    : "Select Bots & Agents…"

const onSelectBot = (e: string[] | string) => {
  console.log("Selecting bot:", e)

  const previousSelectedBot = state.selectedBots.length > 0 ? state.selectedBots[0] : null

  if (!e || (Array.isArray(e) && e.length === 0)) {
    setState({ selectedBots: [] })
    return
  }

  let newSelectedBots: number[] = []

  if (Array.isArray(e)) {
    newSelectedBots = e.map(Number)
    setState({ selectedBots: newSelectedBots })
  } else if (typeof e === "string") {
    newSelectedBots = [Number(e)]
    setState({ selectedBots: newSelectedBots })
  }

  const selectionChanged = 
    previousSelectedBot !== newSelectedBots[0] || 
    state.selectedBots.length !== newSelectedBots.length ||
    !state.selectedBots.every(id => newSelectedBots.includes(id))
  
  if (selectionChanged) {
    setMessages([])
    setActiveChat(null)
  }
}

async function onSend(userText?: string, audio?: Blob, tts?: boolean) {
  if (!userText && !audio) return;
  setState({ isSending: true });

  const humanMsg: ChatMessage = {
    type:    "human",
    message: userText || "",
  };
  setMessages(prev => [...prev, humanMsg]);

  const selected = state.selectedBots.map(id => state.bots[id]);

  let reply: ChatMessage;

  const agentEntry = selected.find(b => b.type === "agent");
  if (agentEntry) {
    const worker = await agents.loadAgent(Number(agentEntry.id));

    const historyText = messages
      .map(m =>
        m.type === "human"
          ? `User: ${m.message}`
          : `Assistant: ${
              m.messages?.find(x => x.id === Number(agentEntry.id))?.message
              || m.message
            }`
      )
      .join("\n\n");

    const parameters: AgentParameters = {
      input:   { question: historyText },
      apikeys: app.getAPIkeys(),
    };
    await worker.execute(parameters);
    const outputText = parameters.output as string;
    agentEntry.history.push({ isHuman: false, message: outputText });

    reply = {
      type: "bot",
      message: outputText,
      messages: [{
        id:         Number(agentEntry.id),
        botName:    agentEntry.name,
        message:    outputText,
        needsRebuild: false,
      }],
      needsRebuild: false,
    };
  } else {
    const config = selected.map(b => ({
      label: b.name,
      value: Number(b.id),
      history: b.history,
    }));
    const res = await api.askbot({ message: userText, audio }, tts, config);
    res.messages.forEach(m => {
      const bot = state.bots[m.id];
      bot.history.push({ isHuman: false, message: m.message });
    });

    reply = {
      type:        "bot",
      message:     res.message || "",
      messages:    res.messages || [],
      needsRebuild: res.needsRebuild || false,
      rebuild:     res.rebuild,
    };
  }

  setMessages(prev => [...prev, reply]);

  setChatHistory(prev => [
    {
      id:           new Date().toISOString(),
      botName:      state.bots[state.selectedBots[0]]?.name ?? "Chat",
      selectedBots: [...state.selectedBots],
      messages:     [humanMsg, reply],
      timestamp:    new Date().toISOString(),
    },
    ...prev,
  ]);

  setState({ isSending: false });
}


  const handleToggleSelect = (id: string) => {
    setSelectedSources(prev =>
      prev.includes(id)
        ? prev.filter(sourceId => sourceId !== id)
        : [...prev, id]
    )
  }

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedSources(event.target.checked ? sources.map(source => source.id) : [])
  }

  const handleAttachFiles = () => {
    const selectedContent = selectedSources.map(id => sources.find(source => source.id === id))
      .filter(Boolean)
      .map(source => `<h2>${source?.name}</h2>\n${source?.content}`)
      .join('\n\n')

    if (selectedContent) {
      setMessage(prevMessage => prevMessage + '\n\n' + selectedContent)
    }
    setShowFileDialog(false)
    setSelectedSources([])
  }

  function onModeChanged() {
    setState({ audioMode: !state.audioMode })
  }

  function onExitAudioMode() {
    setState({ audioMode: false })
    console.log("Exiting audio mode")
  }

  const hasSelectedBots = state.selectedBots.length > 0
  const options: Option[] = Object.keys(state.bots).map((k) => ({
    label: state.bots[Number(k)].name,
    value: k,
  }))

  // Scroll Effect for new messages
  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    // Always scroll to the bottom smoothly when messages change
    container.scrollTo({
      top: container.scrollHeight, // Scroll to the very bottom
      behavior: 'smooth'
    });

  }, [messages]); // Dependency array includes messages

  return (
    <div className="relative" style={{ height: "calc(100vh - 40px)" }}>
      <div className="flex h-full">
        <div className="flex-1 flex flex-col relative">
          <div className="py-4 border-b flex justify-between items-center bg-white px-4">
            <h2 className="text-2xl font-bold tracking-tight">Playground</h2>
            <div className="flex items-center gap-2">
              <div>
              <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="w-full justify-between">
            {label}
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent className="w-60 max-h-60 overflow-y-auto p-1">
          <DropdownMenuGroup>
            <DropdownMenuLabel>Bots</DropdownMenuLabel>
            {Object.entries(state.bots)
              .filter(([, b]) => b.type === "api")
              .map(([key, b]) => (
                <DropdownMenuCheckboxItem
                  key={key}
                  checked={state.selectedBots.includes(Number(key))}
                  onCheckedChange={() => toggleBot(Number(key))}
                >
                  {b.name}
                </DropdownMenuCheckboxItem>
              ))}
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuLabel>Agents</DropdownMenuLabel>
            {Object.entries(state.bots)
              .filter(([, b]) => b.type === "agent")
              .map(([key, b]) => (
                <DropdownMenuCheckboxItem
                  key={key}
                  checked={state.selectedBots.includes(Number(key))}
                  onCheckedChange={() => toggleBot(Number(key))}
                >
                  {b.name}
                </DropdownMenuCheckboxItem>
              ))}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
              </div>
              <Button 
                onClick={toggleSidebar} 
                size="sm"
                variant="ghost"
                className="flex items-center gap-1"
              >
                <History className="h-5 w-5" />
              </Button>
            </div>
          </div>
          <div 
            ref={chatContainerRef}
            className="overflow-y-auto chat-messages-container flex-1"
            style={{ paddingBottom: "180px" }}
          >
            <div className="p-4 space-y-4">
              {!state.audioMode && (
                <div className="flex flex-col space-y-6 w-full">
                  {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full min-h-[65vh]">
                      <h1 
                        className="text-4xl font-bold text-center text-transparent bg-clip-text gradient-text-animation slide-reveal-greeting"
                        style={{
                          backgroundImage: 'linear-gradient(to right, #6286F7, #EA5850)',
                        }}
                      >
                        Hello, how can I help you?
                      </h1>
                    </div>
                  ) : (
                    messages.map((m, i) => (
                      <ChatMessage 
                        key={m.id || i}
                        message={m} 
                        isWaiting={state.isSending && i === messages.length -1}
                        isLoadingFromHistory={isLoadingFromHistory}
                      />
                    ))
                  )}
                  {state.isSending && (
                    <div className="flex justify-start w-fit">
                      <div className="flex gap-1">
                        <div className="w-1.5 h-1.5 rounded-full animate-typing-1 bg-gradient-to-r from-pink-500 to-violet-500"></div>
                        <div className="w-1.5 h-1.5 rounded-full animate-typing-2 bg-gradient-to-r from-violet-500 to-cyan-500"></div>
                        <div className="w-1.5 h-1.5 rounded-full animate-typing-3 bg-gradient-to-r from-cyan-500 to-pink-500"></div>
                      </div>
                    </div>
                  )}
                </div>
              )}
              {state.audioMode && hasSelectedBots && (
                <Comm 
                  bot={state.selectedBots[0]} 
                  onExit={onExitAudioMode} 
                />
              )}
            </div>
          </div>
          
          {!state.audioMode && (
            <div className="bg-white pb-6 pt-2 px-4 sticky bottom-0 z-10">
              {hasSelectedBots ? (
                <>
                  <SearchInput 
                    onSearch={onSend} 
                    disabled={state.isSending} 
                    openFileDialog={() => setShowFileDialog(true)}
                    audioMode={state.audioMode}
                    onModeChanged={onModeChanged}
                  />
                  <p className="text-xs text-gray-500 text-center mt-2">
                    Signpost AI is experimental. Please validate results.
                  </p>
                </>
              ) : (
                <div className="flex justify-center items-center py-4 text-gray-500">
                  {/* Remove this span */}
                  {/* <span>Please select a bot to start chatting</span> */}
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className={`flex flex-col transition-all duration-300 border-l ${
         sidebarVisible ? 'w-1/4' : 'w-0 overflow-hidden border-none'
          }`}>
          <div className="py-4 flex justify-between items-center bg-white px-4">
            <h2 className="text-2xl font-bold tracking-tight ml-2">Chat History</h2>
            <Button 
              onClick={handleResetChat}
              size="sm" 
              variant="ghost"
              className="flex items-center gap-1"
            >
              <MessageSquarePlus/>
            </Button>
          </div>
          
          <div 
            className="overflow-y-auto" 
            style={{ height: "calc(100% - 100px)" }}
          >
            <div className="p-4">
              <ChatHistory 
                setActiveChat={handleLoadChatHistory} 
                onSelectBot={(botIds) => {
                  onSelectBot(botIds)
                }} 
                bots={state.bots}
                chatHistory={chatHistory}
              />
            </div>
          </div>
        </div>
      </div>
      <Dialog open={showFileDialog} onOpenChange={setShowFileDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Attach Files</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
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
    </div>
  )
}


// Base speed for typewriter effect (milliseconds per character)
const TYPEWRITER_BASE_SPEED = 8; // Changed from 15
const TYPEWRITER_MIN_SPEED = 2; // Minimum speed

function TypewriterText({ text, speed = TYPEWRITER_BASE_SPEED, onComplete }: { text: string, speed?: number, onComplete?: () => void }) {
  const [displayedText, setDisplayedText] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const textElementRef = useRef<HTMLDivElement>(null);

  // Effect for typing animation
  useEffect(() => {
    setDisplayedText("");
    setIsComplete(false);
    
    let index = 0;
    const timer = setInterval(() => {
      if (index < text.length) {
        setDisplayedText(text.substring(0, index + 1));
        index++;
      } else {
        clearInterval(timer);
        setIsComplete(true);
        onComplete?.(); 
      }
    }, speed);

    return () => clearInterval(timer);
  }, [text, speed, onComplete]);

  // REMOVED: useEffect for auto-scrolling while typing
  // useEffect(() => { ... }, [displayedText]);

  return (
    <div 
      ref={textElementRef}
      className={`whitespace-pre-wrap ${isComplete ? "typewriter-text-complete" : ""}`}
    >
      {isComplete ? text : displayedText} 
    </div>
  );
}

function BotChatMessageWithTypewriter({ m, isWaiting, rebuild, isLoadingFromHistory }: { m: any, isWaiting?: boolean, rebuild?: () => void, isLoadingFromHistory?: boolean }) {

  const [isTypingComplete, setIsTypingComplete] = useState(false);

  // Parse the message immediately to check for images
  const { imageUrl, remainingText } = parseMarkdownImage(m.message);
  const isPlainImage = !imageUrl && isImageUrl(m.message);
  const hasImage = !!imageUrl || isPlainImage;
  const textToType = imageUrl ? remainingText : (hasImage ? null : m.message); // Text for typewriter is remainingText or full message

  // Determine if we should skip the typewriter effect for the textual part
  // Skip if loading from history, or if there's no text to type
  const skipTypewriter = isLoadingFromHistory || !textToType || (m.type && m.type !== "bot");

  // Reset completion state if the relevant text content changes
  useEffect(() => {
    if (!isLoadingFromHistory) {
      setIsTypingComplete(false);
    }
    // Reset only if the text content intended for typing changes
  }, [textToType, isLoadingFromHistory]); 

  // --- Rendering Logic --- 

  // Part 1: Render the image immediately if it exists
  const renderImage = () => {
    if (imageUrl) {
      return (
        <a href={imageUrl} target="_blank" rel="noopener noreferrer" className="block mb-2">
          <img 
            src={imageUrl} 
            alt="Bot image" 
            className="max-w-md h-auto rounded"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        </a>
      );
    } else if (isPlainImage) {
       return (
         <a href={m.message} target="_blank" rel="noopener noreferrer" className="block mb-2">
           <img 
             src={m.message} 
             alt="Bot image" 
             className="max-w-md h-auto rounded"
             onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
           />
         </a>
       );
    }
    return null;
  };

  // Part 2: Render the text part (with or without typewriter)
  const renderText = () => {
    if (!textToType) {
      return null; // No text to render
    }

    // If skipping typewriter or typing is complete, render text directly
    if (skipTypewriter || isTypingComplete) {
      return <div className={`whitespace-pre-wrap ${hasImage ? 'mt-2' : ''}`}>{textToType}</div>;
    }

    // Otherwise, render with typewriter effect
    const dynamicSpeed = Math.max(
      TYPEWRITER_MIN_SPEED, 
      TYPEWRITER_BASE_SPEED - Math.floor((textToType.length || 0) / 150)
    );
    
    return (
      <div className={`${hasImage ? 'mt-2' : ''}`}> {/* Add margin if there was an image */} 
        <TypewriterText 
          text={textToType} 
          speed={dynamicSpeed} 
          onComplete={() => setIsTypingComplete(true)} 
        />
      </div>
    );
  };

  // Combine image and text rendering
  return (
    <div className="bot-message-content">
      {renderImage()}
      {renderText()}
      {/* Action buttons (like Copy, Rebuild) are handled externally by ChatMessage */}
    </div>
  );
}

interface MessageProps {
  message: ChatMessage
  isWaiting?: boolean
  isLoadingFromHistory?: boolean
  agentIds?: number[] // Add this new prop for dynamic agent IDs
}

function ChatMessage(props: MessageProps) {
  const { isWaiting, isLoadingFromHistory, message: msg, agentIds = [] } = props;
  let { type, message, messages, needsRebuild, rebuild } = msg;
  messages = messages || [];
  const [copied, setCopied] = useState(false);
  const [isSingleLine, setIsSingleLine] = useState(true);
  const messageTextRef = useRef<HTMLDivElement>(null);
  const messageContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (type === "human" && message) {
      const hasNewlines = message.includes('\\n');
      if (!hasNewlines && messageTextRef.current) {
        const lineHeight = 23;
        setIsSingleLine(messageTextRef.current.clientHeight <= lineHeight * 1.2);
      } else {
        setIsSingleLine(!hasNewlines);
      }
    }
  }, [message, type]);

  const handleCopyText = () => {
    const { imageUrl, remainingText } = parseMarkdownImage(message);
    let textToCopy = message; // Default to copying the raw message

    if (imageUrl) {
      // If markdown image, decide what to copy (e.g., URL + text)
      textToCopy = imageUrl + (remainingText ? ` ${remainingText}` : '');
    } else if (isImageUrl(message)) {
      // If plain image URL, copy the URL
      textToCopy = message;
    } // Otherwise, textToCopy remains the original message text

    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  const isLastMessage = messages.length === 1 && messages[0].type === "human";

  if (type === "bot") {
    // Agent messages
    if (messages.length > 0) {
      // Use passed-in agentIds instead of KNOWN_AGENT_IDS
      const agentMessage = messages.find(m => agentIds.includes(m.id));
      if (agentMessage) {
        let answerContent: string | null = null;
        try {
          const parsedJson = JSON.parse(agentMessage.message);
          if (parsedJson && typeof parsedJson.answer === 'string') {
            answerContent = parsedJson.answer;
          }
        } catch (e) {
          console.warn("Agent message was not valid JSON for extracting answer:", agentMessage.message);
        }
        const messageForTypewriter = answerContent ? {
          ...agentMessage,
          message: answerContent,
        } : null;

        return (
          <>
            <div className="mt-4 w-full" dir="auto">
              <div className="p-3 border border-gray-200 rounded-lg">
                <div className="font-medium text-xs mb-1 pb-1 border-b">Agent Raw Output: {agentMessage.botName || `ID ${agentMessage.id}`}</div>
                <AgentJsonView data={agentMessage.message} />
              </div>
            </div>

            {messageForTypewriter && (
              <div className="mt-4 w-full" dir="auto">
                <div className="font-medium text-xs mb-2">Agent Answer:</div>
                <BotChatMessageWithTypewriter 
                  m={messageForTypewriter} 
                  isWaiting={isWaiting} 
                  isLoadingFromHistory={isLoadingFromHistory}
                />
              </div>
            )}
            
            {needsRebuild && !isWaiting && rebuild && (
              <div className="mt-2 w-full flex justify-start">
                <Button
                  className="bg-gray-700 hover:bg-gray-600 text-white"
                  onClick={rebuild}
                  disabled={isWaiting}
                  size="sm"
                >
                  <span className="mr-1">↻</span> Rebuild
                </Button>
              </div>
            )}
          </>
        );
      }
    }
    
    // Rest of the component remains the same
    // Multiple bot messages side-by-side
    if (messages.length > 1) {
      return (
        <div className="w-full mt-4" dir="auto">
          <div className="flex gap-4 w-full">
            {messages.map((m) => {
              const { imageUrl, remainingText } = parseMarkdownImage(m.message);
              const isPlainImage = !imageUrl && isImageUrl(m.message);

              return (
                <div
                  key={m.id}
                  className="flex-1 border border-gray-300 rounded-lg p-3 bot-message-content"
                  dir="auto"
                >
                  <div className="font-medium text-xs mb-2">{m.botName}</div>
                  {imageUrl ? (
                    <div>
                      <a href={imageUrl} target="_blank" rel="noopener noreferrer" className="block mb-2">
                        <img 
                          src={imageUrl} 
                          alt="Bot image" 
                          className="max-w-md h-auto rounded"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      </a>
                      {remainingText && <div className="mt-2 text-sm whitespace-pre-wrap">{remainingText}</div>}
                    </div>
                  ) : isPlainImage ? (
                     <a href={m.message} target="_blank" rel="noopener noreferrer" className="block mb-2">
                       <img 
                         src={m.message} 
                         alt="Bot image" 
                         className="max-w-md h-auto rounded"
                         onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                       />
                     </a>
                  ) : (
                    <BotChatMessageWithTypewriter 
                      m={m} 
                      isWaiting={isWaiting} 
                      rebuild={rebuild} 
                      isLoadingFromHistory={isLoadingFromHistory}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    
    // Single bot message
    if (messages.length === 1) {
      const single = messages[0];
      const { imageUrl, remainingText } = parseMarkdownImage(single.message);
      const isPlainImage = !imageUrl && isImageUrl(single.message);

      return (
        <div className="mt-4" dir="auto">
          <div className="p-3 bot-message-content">
            <div
              className="inline-block px-2 py-1 border border-gray-300 rounded text-xs font-medium mb-2"
              dir="auto"
            >
              {single.botName}
            </div>
            {imageUrl ? (
              <div>
                 <a href={imageUrl} target="_blank" rel="noopener noreferrer" className="block mb-2">
                  <img 
                    src={imageUrl} 
                    alt="Bot image" 
                    className="max-w-md h-auto rounded"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                 </a>
                 {remainingText && <div className="mt-2 text-sm whitespace-pre-wrap">{remainingText}</div>}
              </div>
            ) : isPlainImage ? (
               <a href={single.message} target="_blank" rel="noopener noreferrer" className="block mb-2">
                 <img 
                   src={single.message} 
                   alt="Bot image" 
                   className="max-w-md h-auto rounded"
                   onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                 />
               </a>
            ) : (
              <BotChatMessageWithTypewriter 
                m={single} 
                isWaiting={isWaiting} 
                rebuild={rebuild} 
                isLoadingFromHistory={isLoadingFromHistory}
              />
            )}
          </div>
        </div>
      );
    }
    
    // Fallback case: Bot message directly on the main message object
    const { imageUrl, remainingText } = parseMarkdownImage(message);
    const isPlainImage = !imageUrl && isImageUrl(message);

    return (
      <div className="w-full mt-4" dir="auto">
        <div className="border border-gray-300 rounded-lg p-3 bot-message-content" dir="auto" style={{ minWidth: "80px" }}>
           {imageUrl ? (
             <div>
               <a href={imageUrl} target="_blank" rel="noopener noreferrer" className="block mb-2">
                 <img 
                   src={imageUrl} 
                   alt="Bot image" 
                   className="max-w-md h-auto rounded"
                   onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                 />
               </a>
               {remainingText && <div className="mt-2 text-sm whitespace-pre-wrap">{remainingText}</div>}
             </div>
           ) : isPlainImage ? (
             <a href={message} target="_blank" rel="noopener noreferrer" className="block mb-2">
               <img 
                 src={message} 
                 alt="Bot image" 
                 className="max-w-md h-auto rounded"
                 onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
             </a>
           ) : (
            <div className="px-1 text-gray-700" style={{ fontFamily: 'Inter, sans-serif', lineHeight: 1.5, fontSize: '0.925rem' }}>
              <BotChatMessageWithTypewriter 
                m={{ message, type: "bot" }} 
                isWaiting={isWaiting} 
                rebuild={rebuild} 
                isLoadingFromHistory={isLoadingFromHistory}
              />
            </div>
           )}
        </div>
      </div>
    );
  }
  
  // Human messages remain unchanged
  return (
    <div className="w-full mt-4 message-fade-in" dir="auto" ref={messageContainerRef}>
      <div className="flex flex-col items-end">
        <div
          className={`bg-gray-100 text-black message-bubble shadow-sm ${isSingleLine ? 'single-line' : ''}`}
          dir="auto"
        >
          <div 
            ref={messageTextRef}
            className="break-words whitespace-pre-wrap" 
            style={{ fontFamily: 'Inter, sans-serif', lineHeight: 1.5, fontSize: '0.925rem' }}
          >
            {message}
          </div>
        </div>
        <div className="mt-1 pr-1 flex justify-end gap-2 text-gray-400">
          {copied ? 
            <Check className="cursor-pointer text-gray-400 hover:text-black transition-colors p-1 hover:bg-gray-100 rounded-md" size={24} /> :
            message ? <Copy className="cursor-pointer hover:text-black transition-colors p-1 hover:bg-gray-100 rounded-md" size={24} onClick={handleCopyText} /> : null
          }
          {!isWaiting && needsRebuild && (
            <Button
              className="bg-gray-700 hover:bg-gray-600 text-white"
              onClick={rebuild}
              disabled={isWaiting}
              size="sm"
            >
              <span className="mr-1">↻</span> Rebuild
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}