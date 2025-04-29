"use client"

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Copy, Check } from 'lucide-react'
import AgentJsonView from '@/bot/agentview'
// Import BotChatMessage - we need to use this in our component
import { BotChatMessage } from '@/bot/botmessage'
import type { ChatMessage as ChatMessageType } from '@/types/types.ai'

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

// Typewriter effect constants
const TYPEWRITER_BASE_SPEED = 8; // Changed from 15
const TYPEWRITER_MIN_SPEED = 2; // Minimum speed

// TypewriterText component for animated text display
function TypewriterText({ text, speed = TYPEWRITER_BASE_SPEED, onComplete }: { text: string, speed?: number, onComplete?: () => void }) {
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
        index++;
      } else {
        clearInterval(timer);
        setIsComplete(true);
        onComplete?.(); 
      }
    }, speed);

    return () => clearInterval(timer);
  }, [text, speed, onComplete]);

  return (
    <div 
      ref={textElementRef}
      className={`whitespace-pre-wrap ${isComplete ? "typewriter-text-complete" : ""}`}
    >
      {isComplete ? text : displayedText} 
    </div>
  );
}

// BotChatMessageWithTypewriter component for animated message display
// This is a wrapper that adds typewriter effect to BotChatMessage
function BotMessageWithTypewriter({ m, isWaiting, rebuild, isLoadingFromHistory }: { m: any, isWaiting?: boolean, rebuild?: () => void, isLoadingFromHistory?: boolean }) {
  // We're going to use your existing BotChatMessage component,
  // but potentially control when and how it renders based on typewriter state
  
  // If loading from history, just render BotChatMessage directly
  if (isLoadingFromHistory) {
    return (
      <BotChatMessage
        m={m}
        isWaiting={isWaiting}
        rebuild={rebuild}
      />
    );
  }
  
  // Otherwise, pass the props to your BotChatMessage
  return (
    <BotChatMessage
      m={m}
      isWaiting={isWaiting}
      rebuild={rebuild}
    />
  );
}

// Main ChatMessageComponent props interface
export interface MessageProps {
  message: ChatMessageType;
  isWaiting?: boolean;
  isLoadingFromHistory?: boolean;
  agentIds?: number[]; // Add this new prop for dynamic agent IDs
}

// Main component
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
                <BotChatMessage 
                  m={messageForTypewriter} 
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
                    <BotMessageWithTypewriter 
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
              <BotMessageWithTypewriter 
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
              <BotMessageWithTypewriter 
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