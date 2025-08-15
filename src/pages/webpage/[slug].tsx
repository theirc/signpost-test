import { useEffect, useState, useRef, ChangeEvent } from 'react'
import { useParams } from 'react-router-dom'
import { DeploymentService } from '@/lib/services/deployment-service'
import { agents } from '@/lib/agents'
import { app } from '@/lib/app'
import { MessageSquarePlus, Send, Loader2, Copy, Check, ArrowUp, FileText, FileJson, Type, Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'

import { useTeamStore } from '@/lib/hooks/useTeam'
import { useUser } from '@/lib/hooks/useUser'
import type { AgentChatMessage } from '@/types/types.ai'
import Tesseract from 'tesseract.js'
import { JsonEditor } from 'json-edit-react'

interface DeploymentConfig {
  agentId: string
  agentTitle: string
  agentDescription?: string
  title: string
  description: string
  primaryColor: string
  secondaryColor: string
  logoUrl?: string
  theme: 'light' | 'dark' | 'auto'
}

interface WorkerExecution {
  timestamp: number
  worker: any
  state: any
}



// Message component matching playground styling
function ChatMessage({ message, isWaiting, onSendMessage }: { message: AgentChatMessage, isWaiting?: boolean, onSendMessage?: (message: string) => void }) {
  const [copied, setCopied] = useState(false)
  const isDarkMode = document.documentElement.classList.contains('dark')

  const handleCopyText = () => {
    const messageStr = typeof message.message === 'string' ? message.message : JSON.stringify(message.message)
    if (!messageStr) return
    navigator.clipboard.writeText(messageStr).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  // Parse text and extract buttons
  const parseMessageAndButtons = (text: string) => {
    // Remove <break> tags from the text
    const cleanText = text.replace(/<break>/g, '')
    
    const buttonRegex = /\[([^\]]+)\]/g
    const parts = cleanText.split(buttonRegex)
    const textElements: JSX.Element[] = []
    const buttons: JSX.Element[] = []
    
    for (let i = 0; i < parts.length; i++) {
      if (i % 2 === 0) {
        // Regular text
        if (parts[i]) {
          textElements.push(<span key={i}>{parts[i]}</span>)
        }
      } else {
        // Button text (odd indices are the button content)
        const buttonText = parts[i]
        buttons.push(
          <Button
            key={i}
            variant="outline"
            size="sm"
            className={`mx-1 ${
              isDarkMode 
                ? 'border-border text-foreground hover:bg-accent hover:text-accent-foreground' 
                : 'border-input text-foreground hover:bg-accent hover:text-accent-foreground'
            }`}
            onClick={() => onSendMessage?.(buttonText)}
          >
            {buttonText}
          </Button>
        )
      }
    }
    
    return { textElements, buttons }
  }

  if (message.type === 'human') {
    const messageContent = typeof message.message === 'string' ? message.message : JSON.stringify(message.message, null, 2)
    const isJsonMessage = messageContent.trim().startsWith('{') && messageContent.trim().endsWith('}')
    
    return (
      <div className="w-full mt-4 message-fade-in" dir="auto">
        <div className="flex flex-col items-end">
          <div className={`message-bubble shadow-sm ${
            isDarkMode 
              ? 'bg-primary/20 border border-primary/30 text-white' 
              : 'bg-gray-100 text-black'
          }`}>
            {isJsonMessage && (
              <div className="bg-primary/80 px-2 py-1 text-xs text-primary-foreground rounded-t-lg -m-3 mb-2 flex items-center justify-between">
                <span>JSON Input</span>
                <span className="bg-primary/60 px-1.5 py-0.5 rounded text-xs">JSON</span>
              </div>
            )}
            <div
              className={`break-words whitespace-pre-wrap user-message-text ${isDarkMode ? '!text-white' : '!text-black'}`}
              style={{ 
                fontFamily: isJsonMessage ? 'Monaco, Consolas, monospace' : 'Inter, sans-serif', 
                lineHeight: 1.5, 
                fontSize: '0.925rem'
              }}
            >
              {messageContent}
            </div>
          </div>
          <div className="mt-1 pr-1 flex justify-end gap-2 text-muted-foreground">
            {copied ? 
              <div title="Copied!">
                <Check className="cursor-pointer text-muted-foreground hover:text-foreground transition-colors p-1 hover:bg-accent rounded-md" size={24} />
              </div> :
              message.message ? 
              <div title="Copy Message" onClick={handleCopyText}>
                <Copy className="cursor-pointer hover:text-foreground transition-colors p-1 hover:bg-accent rounded-md" size={24} />
              </div> : null
            }
          </div>
        </div>
      </div>
    )
  }

  if (message.type === 'agent') {
    // Extract plain text from the response
    let responseText = ''
    if (typeof message.message === 'string') {
      responseText = message.message
    } else if (typeof message.message === 'object' && message.message !== null) {
      // If it's a JSON object, try to extract the "response" field
      const messageObj = message.message as any
      if ('response' in messageObj && typeof messageObj.response === 'string') {
        responseText = messageObj.response
      } else {
        // Fallback to stringifying if no response field
        responseText = JSON.stringify(message.message)
      }
    }

    const { textElements, buttons } = parseMessageAndButtons(responseText)
    
    return (
      <div className="mt-4 w-full space-y-3">
        {/* Message container */}
        <div className={`p-4 border border-border rounded-lg shadow-sm ${
          isDarkMode ? 'bg-muted' : 'bg-card'
        }`}>
          <div className="text-sm whitespace-pre-wrap leading-relaxed text-card-foreground">
            {textElements}
          </div>
        </div>
        
        {/* Buttons container */}
        {buttons.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {buttons}
          </div>
        )}
      </div>
    )
  }

  return null
}

// Input component matching playground styling
function SearchInput({ onSearch, disabled }: { onSearch: (message: string) => void, disabled: boolean }) {
  const [value, setValue] = useState<string>("")
  const [ocrLoading, setOcrLoading] = useState<boolean>(false)
  const [isJsonInput, setIsJsonInput] = useState<boolean>(false)
  const [jsonError, setJsonError] = useState<string>("")
  const [isJsonEditorMode, setIsJsonEditorMode] = useState<boolean>(false)
  const [jsonData, setJsonData] = useState<any>({})

  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

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
    setValue(newValue)
    validateJsonInput(newValue)
    e.target.style.height = "auto"
    e.target.style.height = `${e.target.scrollHeight}px`
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !isJsonEditorMode) {
      e.preventDefault()
      submitText(value)
    }
  }

  const submitText = (v: string) => {
    if (!v.trim()) return
    if (isJsonInput && jsonError) return
    onSearch(v)
    setValue("")
    setIsJsonInput(false)
    setJsonError("")
  }

  const submitJson = () => {
    try {
      const jsonString = JSON.stringify(jsonData, null, 2)
      if (jsonString === '{}' || jsonString === '[]') return
      onSearch(jsonString)
      setJsonData({})
    } catch (error) {
      console.error('Error submitting JSON:', error)
    }
  }

  const toggleJsonEditorMode = () => {
    setIsJsonEditorMode(!isJsonEditorMode)
    if (!isJsonEditorMode) {
      // Switching to JSON editor mode
      if (value.trim()) {
        try {
          const parsed = JSON.parse(value)
          setJsonData(parsed)
        } catch (e) {
          setJsonData({})
        }
      }
      setValue("")
    } else {
      // Switching to text mode
      if (Object.keys(jsonData).length > 0) {
        setValue(JSON.stringify(jsonData, null, 2))
      }
      setJsonData({})
    }
    setIsJsonInput(false)
    setJsonError("")
  }

  const handleOcrFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setOcrLoading(true)
    try {
      const { data } = await Tesseract.recognize(file, 'eng', {
        logger: m => console.log('[OCR]', m),
      })
      const text = data.text.trim()
      onSearch(text)
    } catch (err: any) {
      console.error("OCR error:", err)
      onSearch(`❗️ OCR failed: ${err.message ?? err}`)
    } finally {
      setOcrLoading(false)
      e.target.value = ""  
    }
  }

  return (
    <div className="w-full">
      <div className="relative">
        <form
          onSubmit={e => { 
            e.preventDefault()
            if (isJsonEditorMode) {
              submitJson()
            } else {
              submitText(value)
            }
          }}
          className={`relative bg-card rounded-xl border overflow-hidden ${
            jsonError 
              ? 'border-destructive shadow-[0_0_10px_rgba(239,68,68,0.3)]'
              : (isJsonInput || isJsonEditorMode)
                ? 'border-primary shadow-[0_0_10px_rgba(59,130,246,0.3)]'
                : !value.trim() && Object.keys(jsonData).length === 0
                  ? 'border-input pulse-input-shadow'
                  : 'border-input shadow-[4px_4px_20px_-4px_rgba(236,72,153,0.1),_-4px_4px_20px_-4px_rgba(124,58,237,0.1),_0_4px_20px_-4px_rgba(34,211,238,0.1)]'
          }`}
        >
          <div className="flex flex-col w-full">
            {(isJsonInput || isJsonEditorMode) && (
              <div className={`px-3 py-1 text-xs flex items-center justify-between ${
                jsonError ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'
              }`}>
                <span>{jsonError || (isJsonEditorMode ? 'JSON Editor Mode' : 'JSON input detected')}</span>
                {!jsonError && (
                  <span className="text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded">JSON</span>
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
                  value={value}
                  onChange={handleSearchChange}
                  onKeyDown={handleKeyDown}
                  placeholder={isJsonInput ? "Enter valid JSON object or array..." : "Type your message here."}
                  className="w-full outline-none resize-none py-1 px-1 text-sm min-h-[40px] bg-card text-card-foreground placeholder:text-muted-foreground"
                  style={{ fontFamily: isJsonInput ? 'Monaco, Consolas, monospace' : 'Inter, sans-serif' }}
                  disabled={disabled}
                />
              </div>
            )}
            
                          <div className="flex justify-between items-center p-2">
                <div className="flex items-center space-x-2">
                  <Button
                    type="button"
                    onClick={toggleJsonEditorMode}
                    variant={isJsonEditorMode ? 'default' : 'ghost'}
                    className="w-10 h-10"
                    title={isJsonEditorMode ? 'Switch to text mode' : 'Switch to JSON editor'}
                  >
                    {isJsonEditorMode ? <Type className='h-6 w-6' /> : <FileJson className='h-6 w-6 text-muted-foreground hover:text-foreground'/>}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={disabled}
                    variant='ghost'
                    className="w-10 h-10"
                    title="Upload File (Image/PDF)"
                  >
                    <FileText className='h-6 w-6 text-muted-foreground hover:text-foreground'/>
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,application/pdf"
                    className="hidden"
                    onChange={handleOcrFile}
                  />
                  {ocrLoading && (
                    <span className="ml-2 text-sm text-muted-foreground">
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
                        submitText(value)
                      }
                    }}
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-foreground text-background hover:bg-foreground/90"
                    disabled={disabled || (!value.trim() && Object.keys(jsonData).length === 0) || (isJsonInput && !!jsonError)}
                    title="Send Message"
                  >
                    <ArrowUp className="h-5 w-5" />
                  </Button>
                </div>
              </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function DeployedAgentPlayground() {
  const { slug } = useParams()
  const [config, setConfig] = useState<DeploymentConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [messages, setMessages] = useState<AgentChatMessage[]>([])
  const [isSending, setIsSending] = useState(false)
  const [apiKeys, setApiKeys] = useState<any>({})
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { selectedTeam } = useTeamStore()
  const { data: user } = useUser()
  const [workerExecutions, setWorkerExecutions] = useState<WorkerExecution[]>([])
  const [heroColors, setHeroColors] = useState({ primary: '#3b82f6', secondary: '#1e40af' })
  const [isDarkMode, setIsDarkMode] = useState(false)

  useEffect(() => {
    if (slug) {
      loadDeployment()
    }
  }, [slug])

  // Theme toggle functionality
  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode)
  }

  const loadDeployment = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Get the deployment URL based on the slug
      const deploymentUrl = `/webpage/${slug}`
      const content = await DeploymentService.getDeploymentHTML(deploymentUrl)
      
      if (content) {
        // Extract config from the HTML content or localStorage
        const deployments = JSON.parse(localStorage.getItem('deployments') || '[]')
        const deployment = deployments.find((d: any) => d.deploymentUrl === deploymentUrl)
        
        if (deployment) {
          console.log('Found deployment:', deployment)
          console.log('Deployment config:', deployment.config)
          console.log('Logo URL in config:', deployment.config.logoUrl)
          setConfig(deployment.config)
          setHeroColors({
            primary: deployment.config.primaryColor,
            secondary: deployment.config.secondaryColor
          })
          // Load API keys for the team
          const keys = await app.fetchAPIkeys(selectedTeam?.id)
          setApiKeys(keys || {})
        } else {
          setError('Deployment configuration not found')
        }
      } else {
        setError('Webpage not found')
      }
    } catch (err) {
      console.error('Failed to load deployment:', err)
      setError('Failed to load deployment')
    } finally {
      setLoading(false)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  async function addLog(p: { worker: any; state: any }, id: string) {
    const handles = p.worker?.handlersArray?.map((h: any) => ({ [h.name]: h.value })) || []
    const logData = {
      team_id: selectedTeam?.id,
      agent: config?.agentId,
      worker: p.worker.config.type,
      state: p.state,
      handles,
      execution: id
    }
    // Note: This would need to be connected to your actual logging system
    console.log('Log data:', logData)
  }

  function onWorkerExecuted(p: { worker: any; state: any }, id: string) {
    console.log(
      `[Worker Executed] type="${p.worker.config.type}", state=`,
      p.state
    )
    addLog(p, id)
    const execution: WorkerExecution = {
      timestamp: Date.now(),
      worker: p.worker,
      state: p.state
    }

    setWorkerExecutions(prev => [...prev, execution])
  }

  const handleSendMessage = async (message: string) => {
    if (!message.trim() || !config?.agentId) return
    
    setIsSending(true)
    setWorkerExecutions([])

    const userMsg: AgentChatMessage = { 
      type: "human", 
      message: message
    }
    const updatedMessages = [...messages, userMsg]
    setMessages(updatedMessages)

    try {
      // Load the agent
      const { selectedTeam } = useTeamStore()
      if (!selectedTeam?.id) {
        throw new Error("No team selected")
      }
      
      const worker = await agents.loadAgent(Number(config.agentId), selectedTeam.id)
      
      if (!worker) {
        throw new Error(`Agent ${config.agentId} not found or not accessible for current team`)
      }
      
      // Convert messages to ChatHistory format for conversational agents
      const chatHistory = updatedMessages.map(msg => {
        if (msg.type === "human") {
          return {
            role: "user",
            content: typeof msg.message === "string" ? msg.message : JSON.stringify(msg.message)
          };
        } else {
          return {
            role: "assistant", 
            content: typeof msg.message === "string" ? msg.message : JSON.stringify(msg.message)
          };
        }
      });

      const logId = crypto.randomUUID()
      const isConversationalAgent = worker.isConversational;
      
      let parameters: any;
      
      if (isConversationalAgent) {
        parameters = {
          input: {
            message: message,
            history: chatHistory.slice(0, -1)
          },
          apiKeys: apiKeys,
          state: {
            agent: {},
            workers: {}
          },
          uid: crypto.randomUUID(),
          logWriter: (p: any) => onWorkerExecuted(p, logId),
        };
      } else {
        const conversationHistory = updatedMessages.map(msg => {
          const sender = (msg.type === "human") ? "User" : "Bot";
          let messageContent = "";

          if (msg.type === "human") {
            messageContent = typeof msg.message === "string" ? msg.message : JSON.stringify(msg.message);
          } else if (msg.type === "agent") {
            messageContent = typeof msg.message === "string" ? msg.message : JSON.stringify(msg.message);
          }

          return sender + ": " + messageContent;
        }).join("\n");

        parameters = {
          input: {
            question: message,
            conversation_history: conversationHistory,
            uid: crypto.randomUUID()
          },
          apiKeys: apiKeys,
          state: {
            agent: {},
            workers: {}
          },
          uid: crypto.randomUUID(),
          logWriter: (p: any) => onWorkerExecuted(p, logId),
        };
      }

      await worker.execute(parameters);

      const reply: AgentChatMessage = {
        type: "agent",
        message: parameters.output,
        messages: [{
          id: Number(config.agentId),
          agentName: config.agentTitle,
          message: parameters.output,
          needsRebuild: false
        }],
        needsRebuild: false,
      }

      setMessages([...updatedMessages, reply])
    } catch (error) {
      console.error('Error executing agent:', error)
      const errorMsg: AgentChatMessage = {
        type: "agent",
        message: "Sorry, I encountered an error while processing your request. Please try again.",
        messages: [],
        needsRebuild: false,
      }
      setMessages([...updatedMessages, errorMsg])
    } finally {
      setIsSending(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading agent...</p>
        </div>
      </div>
    )
  }

  if (error || !config) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Agent Not Found</h1>
          <p className="text-gray-600 mb-4">{error || 'Configuration not found'}</p>
          <p className="text-sm text-gray-500">
            The agent you're looking for doesn't exist or has been removed.
          </p>
        </div>
      </div>
    )
  }

    return (
    <div className={`h-screen flex flex-col ${isDarkMode ? 'dark' : ''}`}>
      <div className="flex flex-1 min-h-0">
        <div className="flex-1 flex flex-col">
          {/* Header matching playground styling */}
          <div className="py-4 border-b flex justify-between items-center bg-background border-border flex-shrink-0">
            <div className="max-w-4xl mx-auto w-full px-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              {config.logoUrl ? (
                <img 
                  src={config.logoUrl} 
                  alt="Logo" 
                  className="w-8 h-8 rounded object-cover"
                  onError={(e) => {
                    console.error('Logo failed to load:', config.logoUrl)
                    e.currentTarget.style.display = 'none'
                  }}
                  onLoad={() => {
                    console.log('Logo loaded successfully')
                  }}
                />
              ) : (
                <span className="text-xs text-red-500">No logo URL found</span>
              )}
              <h2 className="text-xl font-semibold tracking-tight text-foreground">{config.title}</h2>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={toggleTheme}
                size="sm"
                variant="outline"
                className="flex items-center gap-1 hover:bg-accent hover:text-accent-foreground border-border text-foreground"
                title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>
              <Button
                onClick={() => setMessages([])}
                size="sm"
                variant="outline"
                className="flex items-center gap-1 hover:bg-accent hover:text-accent-foreground border-border text-foreground"
                title="New Chat"
              >
                <MessageSquarePlus className="h-5 w-5" />
              </Button>
            </div>
            </div>
          </div>

          {/* Chat Area matching playground styling */}
          <div
            className="flex-1 overflow-y-auto min-h-0 bg-background"
          >
            <div className="max-w-4xl mx-auto w-full px-4 space-y-4">
              <div className="flex flex-col space-y-6 w-full">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full min-h-[65vh]">
                    <h1
                      className="text-4xl font-bold text-center text-transparent bg-clip-text gradient-text-animation slide-reveal-greeting"
                      style={{
                        backgroundImage: `linear-gradient(to right, ${heroColors.primary}, ${heroColors.secondary})`,
                      }}
                    >
                      Hello, how can I help you?
                    </h1>
                  </div>
                ) : (
                  messages.map((m, i) => (
                    <ChatMessage
                      key={i}
                      message={m}
                      isWaiting={isSending && i === messages.length - 1}
                      onSendMessage={handleSendMessage}
                    />
                  ))
                )}
                {isSending && (
                  <div className="flex justify-start w-fit">
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 rounded-full animate-typing-1 bg-gradient-to-r from-pink-500 to-violet-500"></div>
                      <div className="w-1.5 h-1.5 rounded-full animate-typing-2 bg-gradient-to-r from-violet-500 to-cyan-500"></div>
                      <div className="w-1.5 h-1.5 rounded-full animate-typing-3 bg-gradient-to-r from-cyan-500 to-pink-500"></div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>
          </div>

          {/* Input Area matching playground styling */}
          <div className="bg-background pb-4 pt-2 px-4 flex-shrink-0 border-t border-border">
            <div className="max-w-4xl mx-auto">
              <SearchInput
                onSearch={handleSendMessage}
                disabled={isSending}
              />
              <p className="text-xs text-muted-foreground text-center mt-2">
                Signpost AI is experimental. Please validate results. Supports both text and JSON input.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 