"use client"

import { useEffect, useRef, useState } from 'react'
import { Copy, Check } from 'lucide-react';
import AgentJsonView from '@/pages/playground/agentview'
import type { ChatMessage } from '@/types/types.ai'

export interface MessageProps {
  message: ChatMessage
  isWaiting?: boolean
  isLoadingFromHistory?: boolean
}

const ensureString = (value: any): string => {
  if (value == null) return ''
  if (typeof value === 'string') return value;
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value)
    } catch {
      return String(value)
    }
  }
  return String(value)
};

export default function ChatMessageComponent({ 
  message: msg, 
  isWaiting = false,
  isLoadingFromHistory = false 
}: MessageProps) {
  const [copied, setCopied] = useState(false)
  const [isSingleLine, setIsSingleLine] = useState(true)
  const messageTextRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (msg.type === 'human') {
      const text = ensureString(msg.message)
      const hasNewlines = text.includes('\n')
      if (!hasNewlines && messageTextRef.current) {
        const lineHeight = 23;
        setIsSingleLine(messageTextRef.current.clientHeight <= lineHeight * 1.2)
      } else {
        setIsSingleLine(!hasNewlines)
      }
    }
  }, [msg])

  const handleCopyText = () => {
    const messageStr = ensureString(msg.message);
    if (!messageStr) return
    navigator.clipboard.writeText(messageStr).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

if (msg.type === 'bot') {
  const agentInfo = msg.messages && msg.messages[0];
    const agentName = agentInfo?.botName || `ID ${agentInfo?.id}` || 'Agent'

    return (
    <div className="mt-4 w-full">
        <div className="p-3 border border-gray-200 rounded-lg">
          <div className="font-medium text-xs mb-1 pb-1 border-b">
            {agentName}
          </div>
          <AgentJsonView data={msg.message} />
        </div>
      </div>
    )
  }

if (msg.type === 'human') {
  return (
    <div className="w-full mt-4 message-fade-in" dir="auto">
      <div className="flex flex-col items-end">
        <div
          className={`bg-blue-500 message-bubble shadow-sm ${
            isSingleLine ? 'single-line' : ''
          }`}
          dir="auto"
        >
          <div
            ref={messageTextRef}
            className="break-words whitespace-pre-wrap"
            style={{ fontFamily: 'Inter, sans-serif', lineHeight: 1.5, fontSize: '0.925rem' }}
          >
            {ensureString(msg.message)}
          </div>
        </div>
        <div className="mt-1 pr-1 flex justify-end gap-2 text-gray-400">
          {copied ? 
            <Check className="cursor-pointer text-gray-400 hover:text-black transition-colors p-1 hover:bg-gray-100 rounded-md" size={24} /> :
            msg.message ? <Copy className="cursor-pointer hover:text-black transition-colors p-1 hover:bg-gray-100 rounded-md" size={24} onClick={handleCopyText} /> : null
          }
        </div>
      </div>
    </div>
  )
}

  return (
    <div className="mt-4 w-full p-3 bg-red-100 text-red-800 rounded-lg">
      Unknown message type: {msg.type}
    </div>
  )
}
