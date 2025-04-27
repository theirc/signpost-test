"use client"
const LOCAL_STORAGE_KEY = "chatHistory"

import { useEffect, useRef, useState } from 'react'
import { api } from '@/api/getBots'
import { app } from '@/lib/app'
import { MessageSquarePlus, AudioWaveform, ArrowUp, CirclePlus, Circle, Copy, Check, ThumbsUp, ThumbsDown, Flag, Code, Volume2 } from 'lucide-react'
import AgentJsonView from '@/bot/agentview'
import { Button } from '@/components/ui/button'
import { Comm } from '../bot/comm'
import { BotChatMessage } from '@/bot/botmessage'
import { ChatHistory, ChatSession } from '@/bot/history'
import { BotHistory } from '@/types/types.ai'
import type { ChatMessage, SourceReference, DocumentReference } from '@/types/types.ai'
import { SearchInput } from '@/bot/search'
import { useReactMediaRecorder } from "react-media-recorder"
import { agents } from "@/lib/agents"
import { availableSources } from "@/components/source_input/files-modal"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import "../index.css"
import { cn } from "@/lib/utils"
import { useChatContext } from '@/context/ChatContext'

const AGENT_ID_23 = 23;
const AGENT_ID_27 = 27;
const KNOWN_AGENT_IDS = [AGENT_ID_23, AGENT_ID_27];

export const isImageUrl = (url: string | undefined | null): boolean => {
  if (!url) return false;
  // Basic check for http/https and common image extensions
  return /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i.test(url);
};

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
  const {
    bots,
    selectedBots,
    sidebarVisible,
    handleBotSelectionChange,
    loadingBots
  } = useChatContext();

  const [showFileDialog, setShowFileDialog] = useState(false)
  const [selectedSources, setSelectedSources] = useState<string[]>([])
  const [sources, setSources] = useState(availableSources)
  const [message, setMessage] = useState("")
  const [activeChat, setActiveChat] = useState<ChatSession | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoadingFromHistory, setIsLoadingFromHistory] = useState(false)
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const [localCompState, setLocalCompState] = useState({
    isSending: false,
    rebuilding: false,
    audioMode: false,
  });

  const prevSelectedBotsRef = useRef<number[]>();
  useEffect(() => {
    const currentSelectedBots = selectedBots;
    const previousSelectedBots = prevSelectedBotsRef.current;

    if (JSON.stringify(currentSelectedBots) !== JSON.stringify(previousSelectedBots)) {
       console.log("Chat component detected bot selection change from context:", currentSelectedBots);
       setMessages([]);
       setActiveChat(null);
    }

    prevSelectedBotsRef.current = currentSelectedBots;
  }, [selectedBots]);

  const handleResetChat = () => {
    setMessages([])
    setActiveChat(null)
    handleBotSelectionChange([]);
  }

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
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(chatHistory))
    } catch (error) {
      if (error instanceof DOMException && (error.name === 'QuotaExceededError' || error.code === 22)) {
        console.warn(`LocalStorage quota exceeded. Could not save chat history for key: ${LOCAL_STORAGE_KEY}`);
      } else {
        console.error("Error saving chat history to localStorage:", error);
      }
    }
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
        handleBotSelectionChange(chatSession.selectedBots.map(Number));
      } else if (chatSession.botName) {
    
        const botEntry = Object.entries(bots).find(
          ([_, bot]) => bot.name === chatSession.botName
        )

        if (botEntry) {
          const botId = Number(botEntry[0])
          handleBotSelectionChange([botId])
        }
      }
      
      setMessage(prev => prev + "")
      setIsLoadingFromHistory(false)
    }, 50)
  }

  const onSend = async (message?: string, audio?: any, tts?: boolean) => {
    if (selectedBots.length === 0) {
      console.warn("onSend prevented: No bot selected.");
      return;
    }

    console.log("onSend started", { message, audio });
    message ||= "where can i find english classes in athens?"
    if (!message && !audio) {
      console.log("onSend aborted: No message or audio.");
      return;
    }

    const selectedBotsConfig = selectedBots.map(b => ({
      label: bots[b].name,
      value: b,
      history: bots[b].history,
    }))
    console.log("Selected Bots Config:", selectedBotsConfig);

    const currentBotName = selectedBots.length > 0
      ? bots[selectedBots[0]].name
      : "Chat"

    const userMessage: ChatMessage = { type: "human", message }
    if (message) {
      setMessages(prev => [...prev, userMessage]) 
    }

    let currentActiveChat: ChatSession | null = activeChat;
    if (!currentActiveChat) {
      currentActiveChat = {
        id: new Date().toISOString(),
        botName: currentBotName,
        selectedBots: [...selectedBots], 
        messages: message ? [userMessage] : [],
        timestamp: new Date().toISOString(),
      }
      setActiveChat(currentActiveChat)
      setChatHistory(prev => [currentActiveChat!, ...prev]) 
    } else if (message) {
      currentActiveChat = {
        ...activeChat,
        messages: [...activeChat.messages, userMessage],
        selectedBots: [...selectedBots], 
      }
      setActiveChat(currentActiveChat)
    }

    if (!currentActiveChat) {
      console.error("onSend failed: currentActiveChat is null after setup.");
      return;
    }

    setLocalCompState(prev => ({ ...prev, isSending: true }))

    const selectedAgentId = selectedBots.find(id => KNOWN_AGENT_IDS.includes(id));
    const useAgent = selectedAgentId !== undefined;
    console.log("Agent Check:", { selectedAgentId, useAgent });
    
    let botResponseForHistory: ChatMessage

    if (useAgent && selectedAgentId) {
      console.log(`Attempting to use Agent ID: ${selectedAgentId}`);
      try {
        const agent = await agents.loadAgent(selectedAgentId);
        const formattedHistory = currentActiveChat.messages
          .map(msg => {
            if (msg.type === 'human') {
              return `User: ${msg.message}`;
            } else if (msg.type === 'bot') {
              let botContent = "[Bot message not found]";
              if (msg.messages && msg.messages.length > 0) {
                  const agentMsg = msg.messages.find(m => m.id === selectedAgentId);
                  botContent = agentMsg?.message || msg.messages[0]?.message || msg.message || "[Empty bot message]";
              } else if (msg.message) {
                  botContent = msg.message;
              }
              return `Assistant: ${botContent}`;
            }
            return null;
          })
          .filter(Boolean)
          .join('\\n\\n');

        const agentInput = { question: formattedHistory };
        const parameters: AgentParameters = { input: agentInput, apikeys: app.getAPIkeys() };
        
        console.log("Calling agent.execute with params:", parameters);
        await agent.execute(parameters);
        console.log("agent.execute finished. Params after:", parameters);
        
        setLocalCompState(prev => ({ ...prev, isSending: false })); 

        const raw = parameters.error ? `Agent error: ${parameters.error}` : parameters.output;
        const text = typeof raw === "string" ? raw : JSON.stringify(raw, null, 2)

        const rbot = bots[selectedAgentId]!;
        if (!rbot.history.some(h => h.isHuman && h.message === message))
          rbot.history.push({ isHuman: true, message });
        if (!rbot.history.some(h => !h.isHuman && h.message === text))
          rbot.history.push({ isHuman: false, message: text });

        botResponseForHistory = {
          type: "bot", message: text, messages: [{ id: selectedAgentId, botName: `Agent ${selectedAgentId}`, message: text, needsRebuild: false }], needsRebuild: false
        };
      } catch (err: unknown) {
        console.error("Agent execution failed:", err);
        let errorMsg = "Oops, something went wrong with the agent.";
        if (err && typeof err === "object") {
          const e = err as any;
          if (typeof e.message === "string") errorMsg = e.message;
          else if (typeof e.status === "number") errorMsg = `Agent server returned ${e.status}`;
        }
        botResponseForHistory = { type: "bot", message: errorMsg, messages: [{ id: selectedAgentId!, botName: `Agent ${selectedAgentId!}`, message: errorMsg, needsRebuild: false }], needsRebuild: false };
        setLocalCompState(prev => ({ ...prev, isSending: false }));
      }
    } else {
      console.log("Attempting to use standard Bot API");
      try {
        console.log("Calling api.askbot with config:", selectedBotsConfig);
        const response = message ? await api.askbot({ message }, tts, selectedBotsConfig) : await api.askbot({ audio }, tts, selectedBotsConfig)
        console.log("api.askbot finished. Response:", response);
        
        setLocalCompState(prev => ({ ...prev, isSending: false })); 

        if (!response.error) {
          for (const m of response.messages) {
            const rbot = bots[m.id]
            if (!rbot) continue
            if (!rbot.history.find(h => h.isHuman && h.message === message)) {
              rbot.history.push({ isHuman: true, message })
            }
            if (!m.needsRebuild && !m.error && !rbot.history.find(h => !h.isHuman && h.message === m.message)) {
              rbot.history.push({ isHuman: false, message: m.message })
            }
          }
        }

        response.rebuild = async () => {
          setLocalCompState(prev => ({ ...prev, isSending: true }))
          response.needsRebuild = false
          await onRebuild()
          setLocalCompState(prev => ({ ...prev, isSending: false }))
        }

        botResponseForHistory = { type: "bot", message: response.message || "", messages: response.messages || [], needsRebuild: response.needsRebuild || false, rebuild: response.rebuild }
      } catch (error) {
         console.error("Standard Bot API call failed:", error);
         botResponseForHistory = { type: "bot", message: "Failed to get response from bot.", messages: [], needsRebuild: false };
         setLocalCompState(prev => ({ ...prev, isSending: false }));
      }
    }

    console.log("Adding bot response to messages:", botResponseForHistory);
    setMessages(prev => [...prev, botResponseForHistory])

    const finalChatForHistory: ChatSession = {
      ...currentActiveChat, 
      messages: [...currentActiveChat.messages, botResponseForHistory],
      selectedBots: [...selectedBots], 
      timestamp: new Date().toISOString(),
    }
    setActiveChat(finalChatForHistory)
    setChatHistory(prev => prev.map(chat => 
      chat.id === finalChatForHistory.id ? finalChatForHistory : chat
    )) 
    console.log("onSend finished.");
  }

  const onRebuild = async () => {
    setLocalCompState(prev => ({ ...prev, isSending: true }))
    const selectedBotsConfig = selectedBots.map(b => ({ label: bots[b].name, value: b, history: bots[b].history }))
    const response = await api.askbot({ command: "rebuild", }, false, selectedBotsConfig)
    setMessages(prev => [...prev, response])
    setLocalCompState(prev => ({ ...prev, isSending: false }))
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
    setLocalCompState(prev => ({ ...prev, audioMode: !prev.audioMode }))
  }

  function onExitAudioMode() {
    setLocalCompState(prev => ({ ...prev, audioMode: false }))
    console.log("Exiting audio mode")
  }

  const hasSelectedBots = selectedBots.length > 0

  const scrollToBottom = () => {
    const container = chatContainerRef.current;
    if (container) {
      requestAnimationFrame(() => {
         container.scrollTop = container.scrollHeight; 
      });
    }
  };

  useEffect(() => {
    if (!localCompState.isSending && !isLoadingFromHistory) {
        scrollToBottom();
    }
  }, [messages, localCompState.isSending, isLoadingFromHistory]);

  const isSendingOrLoading = localCompState.isSending || isLoadingFromHistory;
  const noBotsSelected = selectedBots.length === 0;

  return (
    <div className="relative" style={{ height: "calc(100vh - 40px)" }}>
      <div className="flex h-full">
        <div className="flex-1 flex flex-col relative">
          {messages.length === 0 && !localCompState.audioMode ? (
            <div className="flex-1 flex flex-col items-center justify-center p-4">
              <h1 
                className="text-4xl font-bold text-center text-transparent bg-clip-text gradient-text-animation slide-reveal-greeting mb-8"
                style={{
                  backgroundImage: 'linear-gradient(to right, #6286F7, #EA5850)',
                }}
              >
                Hello, how can I help you?
              </h1>
              <div className="w-full max-w-2xl px-4">
                {(() => {
                  const isSendDisabled = localCompState.isSending || !hasSelectedBots;
                  const disabledBecauseNoBot = !hasSelectedBots && !localCompState.isSending;
                  return (
                    <SearchInput 
                      onSearch={onSend} 
                      disabled={isSendDisabled} 
                      openFileDialog={() => setShowFileDialog(true)}
                      audioMode={localCompState.audioMode}
                      onModeChanged={onModeChanged}
                    />
                  );
                })()}
                <p className="text-xs text-gray-500 text-center mt-2">
                  Signpost AI is experimental. Please validate results.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div 
                ref={chatContainerRef}
                className={cn(
                  "chat-messages-container flex-1",
                  "overflow-y-auto"
                )}
                style={{ paddingBottom: "180px" }}
              >
                <div className="p-4 space-y-4">
                  {!localCompState.audioMode ? (
                     <div className="flex flex-col space-y-6 w-full">
                       {messages.map((m, i) => {
                         // Determine if this message should animate
                         const shouldAnimate = i === messages.length - 1 && 
                                               m.type === 'bot' && 
                                               !isLoadingFromHistory;
                         return (
                            <ChatMessage 
                              key={m.id || i}
                              message={m} 
                              isWaiting={localCompState.isSending && i === messages.length -1}
                              isLoadingFromHistory={isLoadingFromHistory}
                              onTypewriterTick={scrollToBottom}
                              // Pass the calculated animation flag
                              isAnimating={shouldAnimate} 
                            />
                         );
                       })}
                       {localCompState.isSending && (
                         <div className="flex justify-start w-fit items-center gap-2">
                           <div className="flex gap-1">
                             <div className="w-1.5 h-1.5 rounded-full animate-typing-1 bg-gradient-to-r from-pink-500 to-violet-500"></div>
                             <div className="w-1.5 h-1.5 rounded-full animate-typing-2 bg-gradient-to-r from-violet-500 to-cyan-500"></div>
                             <div className="w-1.5 h-1.5 rounded-full animate-typing-3 bg-gradient-to-r from-cyan-500 to-pink-500"></div>
                           </div>
                           <span className="thinking-gradient-text text-sm">Thinking...</span>
                         </div>
                       )}
                     </div>
                   ) : (
                     hasSelectedBots && <Comm bot={selectedBots[0]} onExit={onExitAudioMode} />
                   )}
                 </div>
               </div>
              
              {!localCompState.audioMode && (
                <div className="bg-background pb-6 pt-2 px-4 sticky bottom-0 z-10">
                   {(() => {
                     const isSendDisabled = localCompState.isSending || !hasSelectedBots;
                     const disabledBecauseNoBot = !hasSelectedBots && !localCompState.isSending;
                     return (
                       <SearchInput 
                         onSearch={onSend} 
                         disabled={isSendDisabled}
                         openFileDialog={() => setShowFileDialog(true)}
                         audioMode={localCompState.audioMode}
                         onModeChanged={onModeChanged}
                       />
                     );
                   })()}
                    <p className="text-xs text-gray-500 text-center mt-2">
                     Signpost AI is experimental. Please validate results.
                   </p>
                 </div>
               )}
             </>
           )}
         </div>
        
        <div className={`flex flex-col transition-all duration-300 border-l ${
         sidebarVisible ? 'w-1/4' : 'w-0 overflow-hidden border-none'
          }`}>
          <div className="py-4 flex justify-between items-center bg-background px-4">
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
                onSelectBot={(botIds) => handleBotSelectionChange(botIds.map(Number))} 
                bots={bots}
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

const TYPEWRITER_BASE_SPEED = 8;
const TYPEWRITER_MIN_SPEED = 2;

function TypewriterText({ text, speed = TYPEWRITER_BASE_SPEED, onComplete, onTick }: { text: string; speed?: number; onComplete?: () => void; onTick?: () => void }) {
  const [displayedText, setDisplayedText] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const textElementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setDisplayedText("");
    setIsComplete(false);
    
    let index = 0;
    const timer = setInterval(() => {
      if (index < text.length) {
        setDisplayedText(text.substring(0, index + 1));
        onTick?.();
        index++;
      } else {
        clearInterval(timer);
        setIsComplete(true);
        onComplete?.(); 
      }
    }, speed);

    return () => clearInterval(timer);
  }, [text, speed, onComplete, onTick]);

  return (
    <div 
      ref={textElementRef}
      className={`whitespace-pre-wrap ${isComplete ? "typewriter-text-complete" : ""}`}
    >
      {isComplete ? text : displayedText} 
    </div>
  );
}

function BotChatMessageWithTypewriter({ m, isWaiting, rebuild, isLoadingFromHistory, onTypewriterTick, isAnimating }: { 
  m: any, 
  isWaiting?: boolean, 
  rebuild?: () => void, 
  isLoadingFromHistory?: boolean, 
  onTypewriterTick?: () => void, 
  isAnimating?: boolean 
}) {
  const [isTypingComplete, setIsTypingComplete] = useState(!isAnimating);
  const { imageUrl, remainingText } = parseMarkdownImage(m.message);
  const isPlainImage = !imageUrl && isImageUrl(m.message);
  const hasImage = !!imageUrl || isPlainImage;
  const textToType = imageUrl ? remainingText : (hasImage ? null : m.message);
  const skipTypewriter = !isAnimating || !textToType;

  useEffect(() => {
    if (isAnimating) {
      setIsTypingComplete(false);
    }
  }, [textToType, isAnimating]);

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

  const renderText = () => {
    if (!textToType) {
      return null;
    }
    if (skipTypewriter || isTypingComplete) {
      return <div className={`whitespace-pre-wrap ${hasImage ? 'mt-2' : ''}`}>{textToType}</div>;
    }
    const dynamicSpeed = Math.max(
      TYPEWRITER_MIN_SPEED, 
      TYPEWRITER_BASE_SPEED - Math.floor((textToType.length || 0) / 150)
    );
    return (
      <div className={`${hasImage ? 'mt-2' : ''}`}> 
        <TypewriterText 
          text={textToType} 
          speed={dynamicSpeed} 
          onComplete={() => setIsTypingComplete(true)} 
          onTick={onTypewriterTick}
        />
      </div>
    );
  };

  return (
    <div className="bot-message-content-wrapper"> 
      {renderImage()}
      {renderText()}
    </div>
  );
}

interface MessageProps {
  message: ChatMessage
  isWaiting?: boolean
  isLoadingFromHistory?: boolean
  onTypewriterTick?: () => void
  isAnimating?: boolean
}

function ChatMessage(props: MessageProps) {
  const { isWaiting, isLoadingFromHistory, message: msg, onTypewriterTick, isAnimating } = props;
  let { type, message, messages, needsRebuild, rebuild, docs } = msg;
  messages = messages || [];
  const [copied, setCopied] = useState(false);
  const [isSingleLine, setIsSingleLine] = useState(true);
  const messageTextRef = useRef<HTMLDivElement>(null);
  const messageContainerRef = useRef<HTMLDivElement>(null);
  const [isSourceDialogOpen, setIsSourceDialogOpen] = useState(false); 
  const [currentDialogSources, setCurrentDialogSources] = useState<DocumentReference[]>([]);
  const [dialogTitle, setDialogTitle] = useState("Sources");

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
      textToCopy = imageUrl + (remainingText ? ` ${remainingText}` : '');
    } else if (isImageUrl(message)) {
      textToCopy = message;
    }

    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  const handleCopyCode = (contentToCopy: string | undefined | null) => {
    let code = '';
    if (typeof contentToCopy === 'string') {
      const codeBlockRegex = /```[\\w-]*\\n([\\s\\S]*?)\\n```/g;
      let match;
      while ((match = codeBlockRegex.exec(contentToCopy)) !== null) {
        code += match[1] + '\\n';
      }
      if (code) {
        navigator.clipboard.writeText(code.trim()).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        });
      } else {
        // Fallback: copy the whole message if no code blocks found
        navigator.clipboard.writeText(contentToCopy).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        });
      }
    }
  };

  const handleTextToSpeech = (contentToSpeak: string | undefined | null) => {
    if ('speechSynthesis' in window && typeof contentToSpeak === 'string') {
      // Clean up markdown/code blocks for better speech
      const cleanedText = contentToSpeak
        .replace(/```[\\w-]*\\n[\\s\\S]*?\\n```/g, ' code block ') // Replace code blocks
        .replace(/!?\\[.*?\\]\\(.*?\\)/g, ' image ') // Replace markdown images
        .replace(/\\*\\*/g, '') // Remove bold/italic markers
        .replace(/`/g, '') // Remove inline code backticks
        .replace(/#+\\s/g, ''); // Remove markdown headers

      const utterance = new SpeechSynthesisUtterance(cleanedText);
      speechSynthesis.speak(utterance);
    } else {
      console.warn("Text-to-speech not supported in this browser.");
    }
  };

  // Modified renderSourceLinks
  const renderSourceLinks = (sourceDocs: DocumentReference[] | undefined) => {
    if (!sourceDocs || sourceDocs.length === 0) return null;

    const handleButtonClick = (doc: DocumentReference) => {
      setCurrentDialogSources([doc]);
      setDialogTitle(`Source: ${doc.metadata?.title || doc.metadata?.source || 'Details'}`);
      setIsSourceDialogOpen(true);
    };

    return (
      <div className="mt-3 pt-3 border-t border-muted/50 flex flex-wrap items-center gap-1.5">
        {sourceDocs.map((doc, index) => {
          let buttonText = 'Unknown Source';
          if (doc.metadata?.title) {
            buttonText = doc.metadata.title;
          } else if (doc.metadata?.source) {
            try {
              const url = new URL(doc.metadata.source);
              let hostname = url.hostname.replace(/^(www\.)|(staging\.)/i, '');
              buttonText = hostname; 
            } catch (e) { 
              buttonText = doc.metadata.source; 
            }
          }

          return (
            <Button 
              key={`${doc.metadata?.source || 'doc'}-${index}`}
              variant="outline" 
              size="sm"
              onClick={() => handleButtonClick(doc)}
              className="h-auto text-xs py-0.5 px-2 whitespace-nowrap bg-gray-700 text-white hover:bg-gray-600 border-gray-600"
            >
              {buttonText}
            </Button>
          );
        })}
      </div>
    );
  };

  // Define renderBotMessage INSIDE ChatMessage to access props and state
  const renderBotMessage = () => {
    // Agent message logic
    if (msg.messages && msg.messages.length > 0) { 
      const agentMessage = msg.messages.find(m => KNOWN_AGENT_IDS.includes(m.id));
      if (agentMessage) {
        let answerContent: string | null = null;
        try {
          const parsedJson = JSON.parse(agentMessage.message);
          if (parsedJson && typeof parsedJson.answer === 'string') {
            answerContent = parsedJson.answer;
          }
        } catch (e) {}
        const messageForTypewriter = answerContent ? {
          ...agentMessage,
          message: answerContent,
        } : null;
        const rawAgentMsgHasCode = typeof agentMessage.message === 'string' && agentMessage.message.includes('```');
        const answerHasCode = typeof answerContent === 'string' && answerContent.includes('```');

        return (
          <div className="mt-4 w-full" dir="auto">
            <div className="p-3 rounded-lg bg-background">
              <div className="font-medium text-xs mb-1 pb-1 border-b">Agent Raw Output: {agentMessage.botName || `ID ${agentMessage.id}`}</div>
              <AgentJsonView data={agentMessage.message} />
            </div>
            {messageForTypewriter && (
              <div className="mt-2">
                <div className="font-medium text-xs mb-2">Agent Answer:</div>
                <div className="rounded-lg p-3 bg-background">
                  <BotChatMessageWithTypewriter
                    m={messageForTypewriter}
                    isWaiting={isWaiting}
                    isLoadingFromHistory={isLoadingFromHistory} 
                    onTypewriterTick={onTypewriterTick} 
                    isAnimating={isAnimating}
                  />
                  {renderSourceLinks(agentMessage.docs)} 
                </div>
              </div>
            )}
            {!messageForTypewriter && renderSourceLinks(agentMessage.docs)}
            <div className="flex items-center gap-1 mt-2">
                <Button variant="ghost" size="icon" className="h-6 w-6 p-1 text-gray-400 hover:text-black hover:bg-gray-100 rounded-md" title="Thumbs Up"><ThumbsUp className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className="h-6 w-6 p-1 text-gray-400 hover:text-black hover:bg-gray-100 rounded-md" title="Thumbs Down"><ThumbsDown className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className="h-6 w-6 p-1 text-gray-400 hover:text-black hover:bg-gray-100 rounded-md" title="Flag"><Flag className="h-4 w-4" /></Button>
                {(rawAgentMsgHasCode || answerHasCode) && (
                  <Button variant="ghost" size="icon" className="h-6 w-6 p-1 text-gray-400 hover:text-black hover:bg-gray-100 rounded-md" onClick={() => handleCopyCode(answerContent || agentMessage.message)} title={copied ? "Copied!" : "Copy Code"}>
                    {copied ? <Check className="h-4 w-4 text-green-500" /> : <Code className="h-4 w-4" />}
                  </Button>
                )}
                {answerContent && (
                  <Button variant="ghost" size="icon" className="h-6 w-6 p-1 text-gray-400 hover:text-black hover:bg-gray-100 rounded-md" onClick={() => handleTextToSpeech(answerContent)} title="Read Aloud"><Volume2 className="h-4 w-4" /></Button>
                )}
                 <Button variant="ghost" size="icon" className="h-6 w-6 p-1 text-gray-400 hover:text-black hover:bg-gray-100 rounded-md" onClick={() => {
                   navigator.clipboard.writeText(answerContent || agentMessage.message).then(() => {
                     setCopied(true);
                     setTimeout(() => setCopied(false), 2000);
                   });
                 }} title={copied ? "Copied!" : "Copy"}>
                   {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                 </Button>
            </div>
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
          </div>
        );
      }
    }
    // Multiple bot messages logic
    if (msg.messages && msg.messages.length > 1) { 
      const combinedMessage = msg.messages.map(m => m.message).join('\\n\\n');
      const hasCode = typeof combinedMessage === 'string' && combinedMessage.includes('```');
      return (
        <div className="w-full mt-4" dir="auto">
          <div className="flex gap-4 w-full">
            {msg.messages.map((m) => { // Use msg.messages
              const { imageUrl, remainingText } = parseMarkdownImage(m.message);
              const isPlainImage = !imageUrl && isImageUrl(m.message);
              return (
                <div
                  key={m.id}
                  className="flex-1 rounded-lg p-3 bot-message-content bg-background flex flex-col"
                  dir="auto"
                >
                  <div className="font-medium text-xs mb-2">{m.botName}</div>
                  <div className="flex-grow">
                    {imageUrl || isPlainImage ? (
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
                    ) : (
                      <BotChatMessageWithTypewriter
                        m={m}
                        isWaiting={isWaiting}
                        rebuild={rebuild}
                        isLoadingFromHistory={isLoadingFromHistory}
                        onTypewriterTick={onTypewriterTick}
                        isAnimating={isAnimating}
                      />
                    )}
                  </div>
                  {renderSourceLinks(m.docs)} 
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-1 mt-2">
              <Button variant="ghost" size="icon" className="h-6 w-6 p-1 text-gray-400 hover:text-black hover:bg-gray-100 rounded-md" title="Thumbs Up"><ThumbsUp className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" className="h-6 w-6 p-1 text-gray-400 hover:text-black hover:bg-gray-100 rounded-md" title="Thumbs Down"><ThumbsDown className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" className="h-6 w-6 p-1 text-gray-400 hover:text-black hover:bg-gray-100 rounded-md" title="Flag"><Flag className="h-4 w-4" /></Button>
              {hasCode && (
                <Button variant="ghost" size="icon" className="h-6 w-6 p-1 text-gray-400 hover:text-black hover:bg-gray-100 rounded-md" onClick={() => handleCopyCode(combinedMessage)} title={copied ? "Copied!" : "Copy Code"}>
                  {copied ? <Check className="h-4 w-4 text-green-500" /> : <Code className="h-4 w-4" />}
                </Button>
              )}
              <Button variant="ghost" size="icon" className="h-6 w-6 p-1 text-gray-400 hover:text-black hover:bg-gray-100 rounded-md" onClick={() => handleTextToSpeech(combinedMessage)} title="Read Aloud"><Volume2 className="h-4 w-4" /></Button>
               <Button variant="ghost" size="icon" className="h-6 w-6 p-1 text-gray-400 hover:text-black hover:bg-gray-100 rounded-md" onClick={() => {
                 navigator.clipboard.writeText(combinedMessage).then(() => {
                   setCopied(true);
                   setTimeout(() => setCopied(false), 2000);
                 });
               }} title={copied ? "Copied!" : "Copy"}>
                 {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
               </Button>
          </div>
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
        </div>
      );
    }
    // Single bot message logic
    if (msg.messages && msg.messages.length === 1) { 
      const single = msg.messages[0];
      const { imageUrl, remainingText } = parseMarkdownImage(single.message);
      const isPlainImage = !imageUrl && isImageUrl(single.message);
      const hasCode = typeof single.message === 'string' && single.message.includes('```');
      return (
        <div className="mt-4 w-full" dir="auto">
          <div className="p-3 bot-message-content rounded-lg bg-background" dir="auto">
            <div
              className="inline-block px-2 py-1 border border-gray-300 rounded text-xs font-medium mb-2"
              dir="auto"
            >
              {single.botName}
            </div>
            <div className="message-content-area">
              {imageUrl || isPlainImage ? (
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
              ) : (
                <BotChatMessageWithTypewriter
                  m={single} 
                  isWaiting={isWaiting}
                  rebuild={rebuild}
                  isLoadingFromHistory={isLoadingFromHistory}
                  onTypewriterTick={onTypewriterTick}
                  isAnimating={isAnimating}
                />
              )}
            </div>
            {renderSourceLinks(single.docs)} 
          </div>
           <div className="flex items-center gap-1 mt-2">
              <Button variant="ghost" size="icon" className="h-6 w-6 p-1 text-gray-400 hover:text-black hover:bg-gray-100 rounded-md" title="Thumbs Up"><ThumbsUp className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" className="h-6 w-6 p-1 text-gray-400 hover:text-black hover:bg-gray-100 rounded-md" title="Thumbs Down"><ThumbsDown className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" className="h-6 w-6 p-1 text-gray-400 hover:text-black hover:bg-gray-100 rounded-md" title="Flag"><Flag className="h-4 w-4" /></Button>
              {hasCode && (
                <Button variant="ghost" size="icon" className="h-6 w-6 p-1 text-gray-400 hover:text-black hover:bg-gray-100 rounded-md" onClick={() => handleCopyCode(single.message)} title={copied ? "Copied!" : "Copy Code"}>
                  {copied ? <Check className="h-4 w-4 text-green-500" /> : <Code className="h-4 w-4" />}
                </Button>
              )}
              {typeof single.message === 'string' && !isPlainImage && (
                  <Button variant="ghost" size="icon" className="h-6 w-6 p-1 text-gray-400 hover:text-black hover:bg-gray-100 rounded-md" onClick={() => handleTextToSpeech(single.message)} title="Read Aloud"><Volume2 className="h-4 w-4" /></Button>
              )}
              <Button variant="ghost" size="icon" className="h-6 w-6 p-1 text-gray-400 hover:text-black hover:bg-gray-100 rounded-md" onClick={() => {
                 const textToCopy = imageUrl ? (imageUrl + (remainingText ? ` ${remainingText}` : '')) : single.message;
                 navigator.clipboard.writeText(textToCopy).then(() => {
                   setCopied(true);
                   setTimeout(() => setCopied(false), 2000);
                 });
               }} title={copied ? "Copied!" : "Copy"}>
                 {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
               </Button>
           </div>
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
        </div>
      );
    }
    // Fallback logic
    const { imageUrl, remainingText } = parseMarkdownImage(msg.message);
    const isPlainImage = !imageUrl && isImageUrl(msg.message);
    const hasCode = typeof msg.message === 'string' && msg.message.includes('```');
    const fallbackMessageObject = { message: msg.message, type: "bot" };
    return (
      <div className="w-full mt-4" dir="auto">
         <div className="rounded-lg p-3 bot-message-content bg-background" dir="auto" style={{ minWidth: "80px" }}>
            <div className="message-content-area">
              {imageUrl || isPlainImage ? (
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
              ) : (
                <div className="px-1" style={{ fontFamily: 'Inter, sans-serif', lineHeight: 1.5, fontSize: '0.925rem' }}>
                  <BotChatMessageWithTypewriter
                    m={fallbackMessageObject} 
                    isWaiting={isWaiting}
                    rebuild={rebuild}
                    isLoadingFromHistory={isLoadingFromHistory}
                    onTypewriterTick={onTypewriterTick}
                    isAnimating={isAnimating}
                  />
                </div>
              )}
            </div>
            {renderSourceLinks(msg.docs)} 
         </div>
         
         <div className="flex items-center gap-1 mt-2">
             <Button variant="ghost" size="icon" className="h-6 w-6 p-1 text-gray-400 hover:text-black hover:bg-gray-100 rounded-md" title="Thumbs Up"><ThumbsUp className="h-4 w-4" /></Button>
             <Button variant="ghost" size="icon" className="h-6 w-6 p-1 text-gray-400 hover:text-black hover:bg-gray-100 rounded-md" title="Thumbs Down"><ThumbsDown className="h-4 w-4" /></Button>
             <Button variant="ghost" size="icon" className="h-6 w-6 p-1 text-gray-400 hover:text-black hover:bg-gray-100 rounded-md" title="Flag"><Flag className="h-4 w-4" /></Button>
             {hasCode && (
               <Button variant="ghost" size="icon" className="h-6 w-6 p-1 text-gray-400 hover:text-black hover:bg-gray-100 rounded-md" onClick={() => handleCopyCode(msg.message)} title={copied ? "Copied!" : "Copy Code"}>
                 {copied ? <Check className="h-4 w-4 text-green-500" /> : <Code className="h-4 w-4" />}
               </Button>
             )}
             {typeof msg.message === 'string' && !isPlainImage && (
               <Button variant="ghost" size="icon" className="h-6 w-6 p-1 text-gray-400 hover:text-black hover:bg-gray-100 rounded-md" onClick={() => handleTextToSpeech(msg.message)} title="Read Aloud"><Volume2 className="h-4 w-4" /></Button>
             )}
              <Button variant="ghost" size="icon" className="h-6 w-6 p-1 text-gray-400 hover:text-black hover:bg-gray-100 rounded-md" onClick={() => {
                const textToCopy = imageUrl ? (imageUrl + (remainingText ? ` ${remainingText}` : '')) : msg.message;
                navigator.clipboard.writeText(textToCopy).then(() => {
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                });
              }} title={copied ? "Copied!" : "Copy"}>
                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
         </div>

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
       </div>
    );
  };

  // Main return statement for ChatMessage
  return (
    <>
      {type === 'human' ? (
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
            </div>
          </div>
        </div>
      ) : (
         renderBotMessage()
      )}

      <Dialog open={isSourceDialogOpen} onOpenChange={setIsSourceDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
          </DialogHeader>
          <div className="mt-4 flex flex-col gap-3">
            {currentDialogSources.map((doc, index) => (
              <a 
                href={doc.metadata.source} 
                key={`${doc.metadata.source}-${index}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline truncate block p-2 bg-muted/50 rounded-md"
                title={doc.metadata.source}
              >
                {doc.metadata.title || doc.metadata.source}
              </a>
            ))}
            {currentDialogSources.length === 0 && (
               <p className="text-sm text-muted-foreground">No source links found for this group.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}