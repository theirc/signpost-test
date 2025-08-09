import { useState, useEffect, useRef, useCallback } from "react"
import { app } from "@/lib/app"
import { toast } from "sonner"
import { useTeamStore } from "@/lib/hooks/useTeam"
import { LoaderCircle, Sparkles, Copy, Check } from "lucide-react"
import { ToMarkdown } from "../ui/tomarkdown"
import { Button } from "../ui/button"
import { ArrowUp, FileText, FileJson, Type } from 'lucide-react'
import Tesseract from 'tesseract.js'
import { JsonEditor } from 'json-edit-react'

interface ChatFlowProps {
  history?: ChatHistory
  onHistoryChange?: (history: ChatHistory) => void
}

export function ChatFlow({ history: propHistory, onHistoryChange }: ChatFlowProps) {

  const [history, setHistory] = useState<ChatHistory>(propHistory || [])
  const [input, setInput] = useState("")
  const [executing, setExecuting] = useState(false)
  const [ocrLoading, setOcrLoading] = useState<boolean>(false)
  const [isJsonInput, setIsJsonInput] = useState<boolean>(false)
  const [jsonError, setJsonError] = useState<string>("")
  const [isJsonEditorMode, setIsJsonEditorMode] = useState<boolean>(false)
  const [jsonData, setJsonData] = useState<any>({})
  const [copiedMessageId, setCopiedMessageId] = useState<number | null>(null)
  const { selectedTeam } = useTeamStore()
  const scrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const stateRef = useRef({})

  function extractFilenameAndUrl(text: string): { filename?: string; url?: string } {
    const match = /Generated file:\s+([^\s]+)\s+(blob:[^\s>]+)/.exec(text)
    if (match) return { filename: match[1], url: match[2] }
    const urlMatch = /(blob:[^\s>]+)/.exec(text)
    return { url: urlMatch?.[1] }
  }

  useEffect(() => {
    if (propHistory) {
      setHistory(propHistory)
    }
  }, [propHistory])

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [history, executing])

  const updateHistory = useCallback((newHistory: ChatHistory) => {
    setHistory(newHistory);
    onHistoryChange?.(newHistory);
  }, [onHistoryChange]);


  const validateJsonInput = (input: string) => {
    const trimmed = input.trim()
    if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || 
        (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
      try {
        JSON.parse(trimmed)
        setIsJsonInput(true)
        setJsonError("")
      } catch (e) {
        setIsJsonInput(true)
        setJsonError("Invalid JSON format")
      }
    } else {
      setIsJsonInput(false)
      setJsonError("")
    }
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    setInput(newValue)
    validateJsonInput(newValue)
    e.target.style.height = "auto"
    e.target.style.height = `${e.target.scrollHeight}px`
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !isJsonEditorMode) {
      e.preventDefault()
      submitText(input)
    }
  }

  const submitText = (v: string) => {
    if (!v.trim()) return
    if (isJsonInput && jsonError) return
    onSend(v)
    setInput("")
    setIsJsonInput(false)
    setJsonError("")
  }

  const submitJson = () => {
    try {
      const jsonString = JSON.stringify(jsonData, null, 2)
      if (jsonString === '{}' || jsonString === '[]') return
      onSend(jsonString)
      setJsonData({})
    } catch (error) {
      console.error('Error submitting JSON:', error)
    }
  }

  const toggleJsonEditorMode = () => {
    setIsJsonEditorMode(!isJsonEditorMode)
    if (!isJsonEditorMode) {
      // Switching to JSON editor mode
      if (input.trim()) {
        try {
          const parsed = JSON.parse(input)
          setJsonData(parsed)
        } catch (e) {
          setJsonData({})
        }
      }
      setInput("")
    } else {
      // Switching to text mode
      if (Object.keys(jsonData).length > 0) {
        setInput(JSON.stringify(jsonData, null, 2))
      }
      setJsonData({})
    }
    setIsJsonInput(false)
    setJsonError("")
  }

  const handleOcrFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setOcrLoading(true)
    try {
      const { data } = await Tesseract.recognize(file, 'eng', {
        logger: m => console.log('[OCR]', m),
      })
      const text = data.text.trim()
      onSend(text)
    } catch (err: any) {
      console.error("OCR error:", err)
      onSend(`❗️ OCR failed: ${err.message ?? err}`)
    } finally {
      setOcrLoading(false)
      e.target.value = ""  
    }
  }

  const handleCopyText = (messageId: number, content: string) => {
    navigator.clipboard.writeText(content).then(() => {
      setCopiedMessageId(messageId)
      setTimeout(() => setCopiedMessageId(null), 2000)
    })
  }

  function isJsonString(value: any): boolean {
    if (typeof value !== "string") return false
    const trimmed = value.trim()
    return (trimmed.startsWith('{') && trimmed.endsWith('}')) || 
           (trimmed.startsWith('[') && trimmed.endsWith(']'))
  }

  function LinkyText({ text }: { text: string }) {
    const parts: (string | { url: string, name?: string })[] = []
    const regex = /(Generated file:\s+[^\s]+\s+blob:[^\s>]+|blob:[^\s>]+|data:[^\s>]+)/g
    let lastIndex = 0
    let match
    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index))
      const seg = match[0]
      if (seg.startsWith('Generated file:')) {
        const { filename, url } = extractFilenameAndUrl(seg)
        if (url) parts.push({ url, name: filename })
      } else {
        parts.push({ url: seg })
      }
      lastIndex = regex.lastIndex
    }
    if (lastIndex < text.length) parts.push(text.slice(lastIndex))
    return (
      <div className="whitespace-pre-wrap break-words">
        {parts.map((part, i) => {
          if (typeof part === 'string') return <span key={i}>{part}</span>
          const label = part.name || part.url
          return (
            <a key={i} className="text-blue-600 hover:underline" href={part.url} target="_blank" rel="noopener noreferrer" download={part.name || undefined}>
              {label}
            </a>
          )
        })}
      </div>
    )
  }

  async function onSend(message?: string) {
    if (!message || !message.trim()) return
    const content = message.trim()
    const newHistory: ChatHistory = [...history, { role: "user" as const, content }]
    updateHistory(newHistory)
    setInput("")
    setExecuting(true)
    const response = await execute(content, newHistory.slice(0, -1))
    if (response) {
      const updatedHistory = [...newHistory, { role: "assistant" as const, content: response }]
      updateHistory(updatedHistory)
    }
    setExecuting(false)
  }

  async function execute(message: string, history: ChatHistory) {
    const { agent } = app
    const apikeys = await app.fetchAPIkeys(selectedTeam?.id)
    const state: any = stateRef.current

    const p: AgentParameters = {
      debug: true,
      input: {
        message,
        history,
      },
      apiKeys: apikeys,
      state
    }

    await agent.execute(p)

    // Helper: build markdown download link(s) for any file-like outputs
    const createDownloadLink = (fileObj: any): string | null => {
      try {
        if (!fileObj) return null
        const { filename, mimeType, buffer } = fileObj
        if (!filename || !buffer) return null
        let data: Uint8Array
        if (buffer instanceof Uint8Array) data = buffer
        else if (buffer?.data && Array.isArray(buffer.data)) data = new Uint8Array(buffer.data)
        else if (Array.isArray(buffer)) data = new Uint8Array(buffer)
        else if (buffer?.byteLength !== undefined) data = new Uint8Array(buffer)
        else return null
        const blob = new Blob([data], { type: mimeType || 'application/octet-stream' })
        const url = URL.createObjectURL(blob)
        // Note: blob URLs live for this session. They will be revoked on page unload.
        // Return a compact descriptor; we will render an anchor with filename in LinkyText
        return `Generated file: ${filename} ${url}`
      } catch (e) {
        console.error('Create download link failed:', e)
        return null
      }
    }

    const outForLinks: any = p.output || {}
    const linkCandidates: any[] = []
    if (outForLinks.response && typeof outForLinks.response === 'object') linkCandidates.push(outForLinks.response)
    if (outForLinks.output && typeof outForLinks.output === 'object') linkCandidates.push(outForLinks.output)
    for (const key of Object.keys(outForLinks)) {
      if (outForLinks[key] && typeof outForLinks[key] === 'object') linkCandidates.push(outForLinks[key])
    }
    const fileLinks: string[] = []
    for (const c of linkCandidates) {
      const link = createDownloadLink(c)
      if (link) fileLinks.push(link)
    }
    const fileLinksText = fileLinks.join('\n')

    stateRef.current = p.state

    if (p.error) {
      toast("Error", {
        description: <div className="text-red-500 font-semibold">{p.error}</div>,
        action: {
          label: "Ok",
          onClick: () => console.log("Ok"),
        },
      })
    }

    const outForMessage: any = p.output || {}
    const responseText = (typeof outForMessage.response === 'string' && outForMessage.response.trim()) ? outForMessage.response : ''
    const answerText = (typeof outForMessage.answer === 'string' && outForMessage.answer.trim()) ? outForMessage.answer : ''
    if (fileLinksText && (responseText || answerText)) {
      const finalMsg = `${responseText || answerText}\n\n${fileLinksText}`
      return finalMsg
    }
    if (fileLinksText) {
      return fileLinksText
    }
    if (responseText) return responseText
    if (answerText) return answerText
    if (outForMessage.response && typeof outForMessage.response === 'object') {
      if (outForMessage.response.filename) return `Generated file: ${outForMessage.response.filename}`
      try { return JSON.stringify(outForMessage.response) } catch { /* ignore */ }
    }
    if (outForMessage.output) {
      if (typeof outForMessage.output === 'string' && outForMessage.output.trim()) return outForMessage.output
      if (typeof outForMessage.output === 'object' && outForMessage.output?.filename) return `Generated file: ${outForMessage.output.filename}`
      try { return JSON.stringify(outForMessage.output) } catch { /* ignore */ }
    }
    const keys = Object.keys(outForMessage || {})
    for (const k of keys) {
      const v = outForMessage[k]
      if (typeof v === 'string' && v.trim()) return v
      if (v && typeof v === 'object' && v.filename) return `Generated file: ${v.filename}`
    }
    if (keys.length) {
      try { return JSON.stringify(outForMessage[keys[0]]) } catch { /* ignore */ }
    }
    return undefined
  }

  return <div className='border-l h-full border-r border-gray-200 flex flex-col resize-x'>
    <div className='grid grid-rows-[1fr_auto] flex-grow h-0 min-h-0'>
      <div ref={scrollRef} className="overflow-y-auto p-4 space-y-4 text-sm">
        {history.map((message, index) => {
          if (message.role === "user") {
            const isJsonMessage = isJsonString(message.content)
            return (
              <div key={index} className="w-full message-fade-in" dir="auto">
                <div className="flex flex-col items-end">
                  <div
                    className={`bg-blue-500 message-bubble shadow-sm text-white ${
                      !isJsonMessage && message.content.length < 50 ? 'single-line' : ''
                    }`}
                    dir="auto"
                  >
                    {isJsonMessage && (
                      <div className="bg-blue-600 px-2 py-1 text-xs text-blue-100 rounded-t-lg -m-3 mb-2 flex items-center justify-between">
                        <span>JSON Input</span>
                        <span className="bg-blue-700 px-1.5 py-0.5 rounded text-xs">JSON</span>
                      </div>
                    )}
                    <div
                      className="break-words whitespace-pre-wrap"
                      style={{ 
                        fontFamily: isJsonMessage ? 'Monaco, Consolas, monospace' : 'Inter, sans-serif', 
                        lineHeight: 1.5, 
                        fontSize: '0.925rem',
                        color: '#000000'
                      }}
                    >
                      {message.content}
                    </div>
                  </div>
                  <div className="mt-1 pr-1 flex justify-end gap-2 text-gray-400">
                    {copiedMessageId === index ? 
                      <Check className="cursor-pointer text-gray-400 hover:text-black transition-colors p-1 hover:bg-gray-100 rounded-md" size={20} /> :
                      <Copy className="cursor-pointer hover:text-black transition-colors p-1 hover:bg-gray-100 rounded-md" size={20} onClick={() => handleCopyText(index, message.content)} />
                    }
                  </div>
                </div>
              </div>
            )
          }
          
          return (
            <div key={index} className="w-full message-fade-in">
              <div className="flex">
                <div>
                  <Sparkles className="inline mr-2 mt-1 text-blue-500" size={16} />
                </div>
                <div className="flex-1">
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    {message.content.includes('blob:') || message.content.includes('data:')
                        ? <LinkyText text={message.content} />
                        : <ToMarkdown>{message.content}</ToMarkdown>
                      }
                  </div>
                  <div className="mt-1 pl-1 flex gap-2 text-gray-400">
                    {copiedMessageId === index ? 
                      <Check className="cursor-pointer text-gray-400 hover:text-black transition-colors p-1 hover:bg-gray-100 rounded-md" size={20} /> :
                      <Copy className="cursor-pointer hover:text-black transition-colors p-1 hover:bg-gray-100 rounded-md" size={20} onClick={() => handleCopyText(index, message.content)} />
                    }
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
      {!executing && <div className='p-2'>
        <div className="relative">
          <form
            onSubmit={e => { 
              e.preventDefault()
              if (isJsonEditorMode) {
                submitJson()
              } else {
                submitText(input)
              }
            }}
            className={`relative bg-white rounded-xl border overflow-hidden ${
              jsonError 
                ? 'border-red-400 shadow-[0_0_10px_rgba(239,68,68,0.3)]'
                : (isJsonInput || isJsonEditorMode)
                  ? 'border-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.3)]'
                  : !input.trim() && Object.keys(jsonData).length === 0
                    ? 'border-gray-200'
                    : 'border-gray-200 shadow-[4px_4px_20px_-4px_rgba(236,72,153,0.1),_-4px_4px_20px_-4px_rgba(124,58,237,0.1),_0_4px_20px_-4px_rgba(34,211,238,0.1)]'
            }`}
          >
            <div className="flex flex-col w-full">
              {(isJsonInput || isJsonEditorMode) && (
                <div className={`px-3 py-1 text-xs flex items-center justify-between ${
                  jsonError ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'
                }`}>
                  <span>{jsonError || (isJsonEditorMode ? 'JSON Editor Mode' : 'JSON input detected')}</span>
                  {!jsonError && (
                    <span className="text-xs bg-blue-100 px-1.5 py-0.5 rounded">JSON</span>
                  )}
                </div>
              )}
              
              {isJsonEditorMode ? (
                <div className="p-3 min-h-[200px] max-h-80 overflow-y-auto">
                  <JsonEditor
                    data={jsonData}
                    setData={setJsonData}
                    enableClipboard={false}
                    showErrorMessages={true}
                  />
                </div>
              ) : (
                <div className="px-2 py-3 max-h-80 overflow-y-auto">
                  <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={handleSearchChange}
                    onKeyDown={handleKeyDown}
                    placeholder={isJsonInput ? "Enter valid JSON object or array..." : "Type your message here."}
                    className="w-full outline-none resize-none py-1 px-1 text-sm min-h-[40px] text-black placeholder-gray-500"
                    style={{ 
                      fontFamily: isJsonInput ? 'Monaco, Consolas, monospace' : 'Inter, sans-serif',
                      color: '#000000'
                    }}
                  />
                </div>
              )}
              
              <div className="flex justify-between items-center p-2">
                <div className="flex items-center space-x-2">
                  <Button
                    type="button"
                    onClick={toggleJsonEditorMode}
                    variant={isJsonEditorMode ? 'default' : 'ghost'}
                    className="w-8 h-8"
                    title={isJsonEditorMode ? 'Switch to text mode' : 'Switch to JSON editor'}
                  >
                    {isJsonEditorMode ? <Type className='h-4 w-4' /> : <FileJson className='h-4 w-4 text-gray-400 hover:text-black'/>}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={executing}
                    variant='ghost'
                    className="w-8 h-8"
                  >
                    <FileText className='h-4 w-4 text-gray-400 hover:text-black'/>
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,application/pdf"
                    className="hidden"
                    onChange={handleOcrFile}
                  />
                  {ocrLoading && (
                    <span className="ml-2 text-xs text-gray-500">
                       Extracting…
                    </span>
                  )}
                </div>
                <div>
                  <Button
                    type="button"
                    onClick={() => {
                      if (isJsonEditorMode) {
                        submitJson()
                      } else {
                        submitText(input)
                      }
                    }}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-black text-white"
                    disabled={executing || (!input.trim() && Object.keys(jsonData).length === 0) || (isJsonInput && !!jsonError)}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>}
      {executing && <div className='flex items-center justify-center p-2 mb-2'>
        <LoaderCircle size={18} className="animate-spin" />
      </div>}
    </div>
  </div>
}
