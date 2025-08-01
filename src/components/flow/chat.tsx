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
  input?: string
  onInputChange?: (input: string) => void
  executing?: boolean
  onExecutingChange?: (executing: boolean) => void
  ocrLoading?: boolean
  onOcrLoadingChange?: (loading: boolean) => void
  isJsonInput?: boolean
  onIsJsonInputChange?: (isJson: boolean) => void
  jsonError?: string
  onJsonErrorChange?: (error: string) => void
  isJsonEditorMode?: boolean
  onIsJsonEditorModeChange?: (mode: boolean) => void
  jsonData?: any
  onJsonDataChange?: (data: any) => void
  copiedMessageId?: number | null
  onCopiedMessageIdChange?: (id: number | null) => void
}

export function ChatFlow(props?: ChatFlowProps) {

  const [history, setHistory] = useState<ChatHistory>(props?.history || [])
  const [input, setInput] = useState(props?.input || "")
  const [executing, setExecuting] = useState(props?.executing || false)
  const [ocrLoading, setOcrLoading] = useState<boolean>(props?.ocrLoading || false)
  const [isJsonInput, setIsJsonInput] = useState<boolean>(props?.isJsonInput || false)
  const [jsonError, setJsonError] = useState<string>(props?.jsonError || "")
  const [isJsonEditorMode, setIsJsonEditorMode] = useState<boolean>(props?.isJsonEditorMode || false)
  const [jsonData, setJsonData] = useState<any>(props?.jsonData || {})
  const [copiedMessageId, setCopiedMessageId] = useState<number | null>(props?.copiedMessageId || null)
  const { selectedTeam } = useTeamStore()
  const scrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const stateRef = useRef({})
  const inputRef = useRef<string>(props?.input || "")

  // Update local state when props change
  useEffect(() => {
    if (props?.history !== undefined) setHistory(props.history)
    if (props?.input !== undefined) setInput(props.input)
    if (props?.executing !== undefined) setExecuting(props.executing)
    if (props?.ocrLoading !== undefined) setOcrLoading(props.ocrLoading)
    if (props?.isJsonInput !== undefined) setIsJsonInput(props.isJsonInput)
    if (props?.jsonError !== undefined) setJsonError(props.jsonError)
    if (props?.isJsonEditorMode !== undefined) setIsJsonEditorMode(props.isJsonEditorMode)
    if (props?.jsonData !== undefined) setJsonData(props.jsonData)
    if (props?.copiedMessageId !== undefined) setCopiedMessageId(props.copiedMessageId)
  }, [props])

  // Notify parent of state changes
  const updateHistory = useCallback((newHistory: ChatHistory) => {
    setHistory(newHistory)
    props?.onHistoryChange?.(newHistory)
  }, [props?.onHistoryChange])

  const updateInput = useCallback((newInput: string) => {
    setInput(newInput)
    props?.onInputChange?.(newInput)
  }, [props?.onInputChange])

  const updateExecuting = useCallback((newExecuting: boolean) => {
    setExecuting(newExecuting)
    props?.onExecutingChange?.(newExecuting)
  }, [props?.onExecutingChange])

  const updateOcrLoading = useCallback((newLoading: boolean) => {
    setOcrLoading(newLoading)
    props?.onOcrLoadingChange?.(newLoading)
  }, [props?.onOcrLoadingChange])

  const updateIsJsonInput = useCallback((newIsJson: boolean) => {
    setIsJsonInput(newIsJson)
    props?.onIsJsonInputChange?.(newIsJson)
  }, [props?.onIsJsonInputChange])

  const updateJsonError = useCallback((newError: string) => {
    setJsonError(newError)
    props?.onJsonErrorChange?.(newError)
  }, [props?.onJsonErrorChange])

  const updateIsJsonEditorMode = useCallback((newMode: boolean) => {
    setIsJsonEditorMode(newMode)
    props?.onIsJsonEditorModeChange?.(newMode)
  }, [props?.onIsJsonEditorModeChange])

  const updateJsonData = useCallback((newData: any) => {
    setJsonData(newData)
    props?.onJsonDataChange?.(newData)
  }, [props?.onJsonDataChange])

  const updateCopiedMessageId = useCallback((newId: number | null) => {
    setCopiedMessageId(newId)
    props?.onCopiedMessageIdChange?.(newId)
  }, [props?.onCopiedMessageIdChange])

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [history, executing])

  // Sync input state to parent when component unmounts or input changes significantly
  useEffect(() => {
    return () => {
      if (props?.onInputChange && inputRef.current !== props?.input) {
        updateInput(inputRef.current)
      }
    }
  }, [props?.onInputChange])

  const validateJsonInput = (input: string) => {
    const trimmed = input.trim()
    if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || 
        (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
      try {
        JSON.parse(trimmed)
        updateIsJsonInput(true)
        updateJsonError("")
      } catch (e) {
        updateIsJsonInput(true)
        updateJsonError("Invalid JSON format")
      }
    } else {
      updateIsJsonInput(false)
      updateJsonError("")
    }
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    setInput(newValue)
    inputRef.current = newValue
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
    onSend(v, '', false)
    setInput("")
    inputRef.current = ""
    if (props?.onInputChange) {
      updateInput("")
    }
    updateIsJsonInput(false)
    updateJsonError("")
  }

  const submitJson = () => {
    try {
      const jsonString = JSON.stringify(jsonData, null, 2)
      if (jsonString === '{}' || jsonString === '[]') return
      onSend(jsonString, '', false)
      updateJsonData({})
    } catch (error) {
      console.error('Error submitting JSON:', error)
    }
  }

  const toggleJsonEditorMode = () => {
    updateIsJsonEditorMode(!isJsonEditorMode)
    if (!isJsonEditorMode) {
      // Switching to JSON editor mode
      if (input.trim()) {
        try {
          const parsed = JSON.parse(input)
          updateJsonData(parsed)
        } catch (e) {
          updateJsonData({})
        }
      }
      updateInput("")
    } else {
      // Switching to text mode
      if (Object.keys(jsonData).length > 0) {
        updateInput(JSON.stringify(jsonData, null, 2))
      }
      updateJsonData({})
    }
    updateIsJsonInput(false)
    updateJsonError("")
  }

  const handleOcrFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    updateOcrLoading(true)
    try {
      const { data } = await Tesseract.recognize(file, 'eng', {
        logger: m => console.log('[OCR]', m),
      })
      const text = data.text.trim()
      onSend(text, undefined, false)
    } catch (err: any) {
      console.error("OCR error:", err)
      onSend(`❗️ OCR failed: ${err.message ?? err}`)
    } finally {
      updateOcrLoading(false)
      e.target.value = ""  
    }
  }

  const handleCopyText = (messageId: number, content: string) => {
    navigator.clipboard.writeText(content).then(() => {
      updateCopiedMessageId(messageId)
      setTimeout(() => updateCopiedMessageId(null), 2000)
    })
  }

  const isJsonString = (value: any): boolean => {
    if (typeof value !== "string") return false
    const trimmed = value.trim()
    return (trimmed.startsWith('{') && trimmed.endsWith('}')) || 
           (trimmed.startsWith('[') && trimmed.endsWith(']'))
  }

  async function onSend(message?: string, audio?: any, tts?: boolean) {
    if (!message || !message.trim()) return
    const content = message.trim()
    const newHistory = [...history, { role: "user" as const, content }]
    updateHistory(newHistory)
    updateInput("")
    updateExecuting(true)
    const response = await execute(content)
    if (response) {
      const updatedHistory = [...newHistory, { role: "assistant" as const, content: response }]
      updateHistory(updatedHistory)
    }
    updateExecuting(false)
  }

  async function execute(message: string) {
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

    return p.output.response
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
                    <ToMarkdown>{message.content}</ToMarkdown>
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
