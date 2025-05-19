"use client"

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Copy, Check } from 'lucide-react'
import AgentJsonView from '@/bot/agentview'
import { BotChatMessage } from '@/bot/botmessage'
import type { ChatMessage as ChatMessageType } from '@/types/types.ai'

// Helper function to ensure any value is converted to a string
const ensureString = (value: any): string => {
  if (value === null || value === undefined) {
    return "";
  }
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch (e) {
      console.warn('Failed to stringify object:', e);
      return String(value);
    }
  }
  return String(value);
};

export const isImageUrl = (url: string | undefined | null): boolean => {
  if (!url) return false;
  // Basic check for http/https and common image extensions
  return /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i.test(url);
};

export const parseMarkdownImage = (text: any): { imageUrl: string | null; remainingText: string | null } => {
  // Ensure text is a string
  const textStr = ensureString(text);
  
  if (!textStr) return { imageUrl: null, remainingText: null };
  
  const markdownRegex = /^!?\[.*?\]\((.+?)\)\s*(.*)$/s; 
  const match = textStr.match(markdownRegex);

  if (match && match[1]) {
    const imageUrl = match[1];
    const remainingText = match[2] ? match[2].trim() : null;
    if (isImageUrl(imageUrl)) { 
      return { imageUrl, remainingText };
    }
  }
  
  return { imageUrl: null, remainingText: null };
};

interface AgentResponse {
  answer?: string;
  [key: string]: any;
}

export interface MessageProps {
  message: ChatMessageType;
  isWaiting?: boolean;
  isLoadingFromHistory?: boolean;
  agentIds?: number[]; 
}

export default function ChatMessageComponent(props: MessageProps) {
  const { isWaiting, isLoadingFromHistory, message: msg, agentIds = [] } = props;
  let { type, message, messages, needsRebuild, rebuild } = msg;
  messages = messages || [];
  const [copied, setCopied] = useState(false);
  const [isSingleLine, setIsSingleLine] = useState(true);
  const messageTextRef = useRef<HTMLDivElement>(null);
  const messageContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (type === "human" && message) {
      const messageStr = ensureString(message);
      
      const hasNewlines = messageStr.includes('\\n');
      if (!hasNewlines && messageTextRef.current) {
        const lineHeight = 23;
        setIsSingleLine(messageTextRef.current.clientHeight <= lineHeight * 1.2);
      } else {
        setIsSingleLine(!hasNewlines);
      }
    }
  }, [message, type]);

  const handleCopyText = () => {
    const messageStr = ensureString(message);
    
    const { imageUrl, remainingText } = parseMarkdownImage(messageStr);
    let textToCopy = messageStr; 

    if (imageUrl) {
      textToCopy = imageUrl + (remainingText ? ` ${remainingText}` : '');
    } else if (isImageUrl(messageStr)) {
      textToCopy = messageStr;
    }

    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  if (type === "bot") {
    if (messages.length > 0) {
      const agentMessage = messages.find(m => agentIds.includes(m.id));
      
      if (agentMessage) {
        let answerContent: string | null = null;
        
        try {
          if (typeof agentMessage.message === 'string') {
            try {
              const parsedJson = JSON.parse(agentMessage.message) as AgentResponse;
              if (parsedJson && parsedJson.answer !== undefined) {
                answerContent = ensureString(parsedJson.answer);
              } else {
                answerContent = agentMessage.message;
              }
            } catch (e) {
              answerContent = agentMessage.message;
            }
          } 
          else if (typeof agentMessage.message === 'object') {
            const messageObj = agentMessage.message as AgentResponse;
            if (messageObj && messageObj.answer !== undefined) {
              answerContent = ensureString(messageObj.answer);
            } else {
              answerContent = ensureString(messageObj);
            }
          } else {
            answerContent = ensureString(agentMessage.message);
          }
        } catch (e) {
          console.warn("Agent message processing error:", e);
          answerContent = ensureString(agentMessage.message);
        }
        
        const messageForDisplay = {
          ...agentMessage,
          isAnswer: true,
        } 
  

        return (
          <>
            <div className="mt-4 w-full" dir="auto">
              <div className="p-3 border border-gray-200 rounded-lg">
                <div className="font-medium text-xs mb-1 pb-1 border-b">Agent Raw Output: {agentMessage.botName || `ID ${agentMessage.id}`}</div>
                <AgentJsonView data={agentMessage.message} />
              </div>
            </div>

            {messageForDisplay && (
              <div className="mt-4 w-full" dir="auto">
                <div className="font-medium text-xs mb-2">Agent Answer:</div>
                <BotChatMessage 
                  m={messageForDisplay} 
                  isWaiting={isWaiting} 
                  rebuild={rebuild} 
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
    
    if (messages.length > 1) {
      return (
        <div className="w-full mt-4" dir="auto">
          <div className="flex gap-4 w-full">
            {messages.map((m) => {
              const { imageUrl, remainingText } = parseMarkdownImage(ensureString(m.message));
              const isPlainImage = !imageUrl && isImageUrl(ensureString(m.message));

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
                     <a href={ensureString(m.message)} target="_blank" rel="noopener noreferrer" className="block mb-2">
                       <img 
                         src={ensureString(m.message)} 
                         alt="Bot image" 
                         className="max-w-md h-auto rounded"
                         onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                       />
                     </a>
                  ) : (
                    <BotChatMessage 
                      m={m} 
                      isWaiting={isWaiting} 
                      rebuild={rebuild}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    
    if (messages.length === 1) {
      const single = messages[0];
      const { imageUrl, remainingText } = parseMarkdownImage(ensureString(single.message));
      const isPlainImage = !imageUrl && isImageUrl(ensureString(single.message));

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
               <a href={ensureString(single.message)} target="_blank" rel="noopener noreferrer" className="block mb-2">
                 <img 
                   src={ensureString(single.message)} 
                   alt="Bot image" 
                   className="max-w-md h-auto rounded"
                   onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                 />
               </a>
            ) : (
              <BotChatMessage 
                m={single} 
                isWaiting={isWaiting} 
                rebuild={rebuild}
              />
            )}
          </div>
        </div>
      );
    }
    
    const { imageUrl, remainingText } = parseMarkdownImage(ensureString(message));
    const isPlainImage = !imageUrl && isImageUrl(ensureString(message));

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
             <a href={ensureString(message)} target="_blank" rel="noopener noreferrer" className="block mb-2">
               <img 
                 src={ensureString(message)} 
                 alt="Bot image" 
                 className="max-w-md h-auto rounded"
                 onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
             </a>
           ) : (
            <div className="px-1 text-gray-700" style={{ fontFamily: 'Inter, sans-serif', lineHeight: 1.5, fontSize: '0.925rem' }}>
              <BotChatMessage 
                m={{ message: ensureString(message), type: "bot" }} 
                isWaiting={isWaiting} 
                rebuild={rebuild}
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
            {ensureString(message)}
          </div>
        </div>
        <div className="mt-1 pr-1 flex justify-end gap-2 text-gray-400">
          {copied ? 
            <Check className="cursor-pointer text-gray-400 hover:text-black transition-colors p-1 hover:bg-gray-100 rounded-md" size={24} /> :
            message ? <Copy className="cursor-pointer hover:text-black transition-colors p-1 hover:bg-gray-100 rounded-md" size={24} onClick={handleCopyText} /> : null
          }
          {/* {!isWaiting && needsRebuild && (
            <Button
              className="bg-gray-700 hover:bg-gray-600 text-white"
              onClick={rebuild}
              disabled={isWaiting}
              size="sm"
            >
              <span className="mr-1">↻</span> Rebuild
            </Button>
          )} */}
        </div>
      </div>
    </div>
  );
}