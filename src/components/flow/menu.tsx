import { Menubar, MenubarContent, MenubarItem, MenubarMenu, MenubarTrigger } from "@/components/ui/menubar"
import { workerRegistry } from "@/lib/agents/registry"
import { createModel } from "@/lib/data/model"
import { cloneDeep } from "lodash"
import { Bug, BugOff, Cog, EllipsisVertical, LoaderCircle, MessageCircle, Parentheses, Play, Save, Settings, Wrench, BrainCog, Zap, PanelTop, MessageCircleCode, Workflow } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Input, InputTextArea, Modal, Row, Select, useForm } from "../forms"
import { Separator } from "../ui/separator"
import { agents } from "@/lib/agents"
import { app } from "@/lib/app"
import { useTeamStore } from "@/lib/hooks/useTeam"
import { useForceUpdate } from "@/lib/utils"
import { redirect, useNavigate } from "react-router-dom"
import { Button } from "../ui/button"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "../ui/alert-dialog"
import { supabase } from "@/lib/agents/db"
import { usePermissions } from "@/lib/hooks/usePermissions"
import { Input as ShadcnInput } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DeploymentService } from "@/lib/services/deployment-service"
import { WebpageConfig } from "@/lib/services/webpage-generator"
import { WebpageViewer } from "@/components/webpage-viewer"

interface Props {
  update?: () => void
  onShowChat?: () => void
}


function DragableItem({ reg: { title, icon: Icon, description, type } }: { reg: WorkerRegistryItem }) {

  const onDragStart = (event: React.DragEvent<HTMLAnchorElement>, nodeType) => {
    event.dataTransfer.setData('nodeType', nodeType)
    event.dataTransfer.effectAllowed = 'move'
    // console.log("drag")
  }

  const onClick = (event: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    event.preventDefault()
  }

  return <a href={"#"} onDragStart={(event) => onDragStart(event, type)} onClick={onClick} draggable>
    <MenubarItem className="size-full flex cursor-move">
      <div className="hover:bg-gray-100 cursor-move flex gap-1 items-center select-none w-32 h-10 mr-1 px-2">
        {Icon && <Icon size={16} />}
        {title}
      </div>
      <div className="text-xs w-64">
        {description}
      </div>
    </MenubarItem>
  </a>

}

const model = createModel({
  fields: {
    openai: { type: 'string', title: 'OpenAI' },
    anthropic: { type: 'string', title: 'Anthropic' },
    zendesk: { type: 'string', title: 'Zendesk' },
  }
})

const agentModel = createModel({
  fields: {
    title: { type: 'string', title: 'Title' },
    description: { type: 'string', title: 'Description' },
    type: { type: 'string', title: 'Type', list: [{ value: "conversational", label: "Conversational" }, { value: "data", label: "Data" }] },
    debuguid: { type: 'string', title: 'Debug UID' },
  }
})

function DropdownButtons() {
  const { canCreate, canUpdate } = usePermissions()
  
  if (!canUpdate("agents") && !canCreate("agents")) return null
  
  return (
    <div className="absolute left-0 top-12 flex flex-col space-y-1 bg-slate-50 p-2 rounded-r-md">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-600 hover:text-slate-900 hover:bg-slate-100">
            <Parentheses size={16} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="right" align="start" className="w-80">
          {Object.entries(workerRegistry).filter(([key, node]) => node.category == "io").map(([key, node]) => (
            <DropdownMenuItem key={key} className="flex items-center gap-2 p-2">
              {node.icon && <node.icon size={16} />}
              <div>
                <div className="font-medium">{node.title}</div>
                <div className="text-xs text-muted-foreground">{node.description}</div>
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-600 hover:text-slate-900 hover:bg-slate-100">
            <BrainCog size={16} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="right" align="start" className="w-80">
          {Object.entries(workerRegistry).filter(([key, node]) => node.category == "generator").map(([key, node]) => (
            <DropdownMenuItem key={key} className="flex items-center gap-2 p-2">
              {node.icon && <node.icon size={16} />}
              <div>
                <div className="font-medium">{node.title}</div>
                <div className="text-xs text-muted-foreground">{node.description}</div>
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-600 hover:text-slate-900 hover:bg-slate-100">
            <Wrench size={16} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="right" align="start" className="w-80">
          {Object.entries(workerRegistry).filter(([key, node]) => node.category == "tool").map(([key, node]) => (
            <DropdownMenuItem key={key} className="flex items-center gap-2 p-2">
              {node.icon && <node.icon size={16} />}
              <div>
                <div className="font-medium">{node.title}</div>
                <div className="text-xs text-muted-foreground">{node.description}</div>
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-600 hover:text-slate-900 hover:bg-slate-100">
            <BugOff size={16} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="right" align="start" className="w-80">
          {Object.entries(workerRegistry).filter(([key, node]) => node.category == "debug").map(([key, node]) => (
            <DropdownMenuItem key={key} className="flex items-center gap-2 p-2">
              {node.icon && <node.icon size={16} />}
              <div>
                <div className="font-medium">{node.title}</div>
                <div className="text-xs text-muted-foreground">{node.description}</div>
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

export function Toolbar(props: Props) {
  const { selectedTeam } = useTeamStore()
  let navigate = useNavigate()
  const update = useForceUpdate()
  const { canCreate, canUpdate } = usePermissions()

  const { form: agentForm, m: f } = useForm(agentModel, {
    values: {
      title: app.agent.title,
    }
  })

  const [saving, setSaving] = useState(false)
  const [webpagePopoverOpen, setWebpagePopoverOpen] = useState(false)
  const [webpageViewerOpen, setWebpageViewerOpen] = useState(false)
  const [currentDeploymentUrl, setCurrentDeploymentUrl] = useState("")
  const [webpageConfig, setWebpageConfig] = useState<WebpageConfig>(() => {
    // Load saved config from localStorage for this specific agent
    if (typeof window !== 'undefined') {
      const agentId = String(app.agent.id || "")
      const saved = localStorage.getItem(`webpageConfig_${agentId}`)
      if (saved) {
        try {
          return JSON.parse(saved)
        } catch (e) {
          console.error('Failed to parse saved webpage config:', e)
        }
      }
    }
    return {
      title: "",
      description: "",
      primaryColor: "#3b82f6",
      secondaryColor: "#1e40af",
      logoUrl: "",
      customDomain: "",
      enableChat: true,
      enableAnalytics: false,
      theme: "light" as const,
      agentId: "",
      agentTitle: "",
      agentDescription: ""
    }
  })

  // Save config to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const agentId = String(app.agent.id || "")
      localStorage.setItem(`webpageConfig_${agentId}`, JSON.stringify(webpageConfig))
    }
  }, [webpageConfig, app.agent.id])

  agentForm.onSubmit = async (data) => {
    app.agent.title = data.title
    app.agent.description = data.description
    app.agent.type = data.type as any
    app.agent.debuguuid = data.debuguid || ""
  }

  async function onSave() {
    if (saving) return
    setSaving(true)

    const orgid = app.agent.id

    const clonedAgent = cloneDeep(app.agent)
    const saved = await agents.saveAgent(clonedAgent, selectedTeam.id)
    app.agent.id = saved.id

    if (!orgid) navigate("/agent/" + saved.id)

    toast("The flow was saved", {
      action: {
        label: "Ok",
        onClick: () => console.log("Ok"),
      },
    })
    setTimeout(() => {
      setSaving(false)
    }, 1000)
  }

  async function onPlay() {
    console.log("Play")

    const { agent } = app

    if (!agent.hasResponse()) {
      toast("Add a Response Worker to execute", { action: { label: "Ok", onClick: () => console.log("Ok"), }, })
      return
    }

    const apiKeys = await app.fetchAPIkeys(selectedTeam?.id)

    const p: AgentParameters = {
      debug: true,
      input: {},
      apiKeys: apiKeys,
    }

    await agent.execute(p)

    if (p.error) {
      toast("Error", {
        description: <div className="text-red-500 font-semibold">{p.error}</div>,
        action: {
          label: "Ok",
          onClick: () => console.log("Ok"),
        },
      })
    }

    console.log("Result: ", p.output)
  }

  function onChangeDisplayData() {
    app.agent.displayData = !app.agent.displayData
    app.agent.update()
    update()
  }

  function onSetAgent() {
    agentForm.edit({
      title: app.agent.title,
      description: app.agent.description,
      type: app.agent.type,
      debuguid: app.agent.debuguuid || "",
    })
  }

  async function onResetState() {
    if (!app.agent.debuguuid) return
    agentForm.modal.hide()
    await supabase.from("states").delete().eq("id", app.agent.debuguuid)
    await supabase.from("history").delete().eq("uid", app.agent.debuguuid)
  }

  function onShowChat() {
    if (props.onShowChat) props.onShowChat()
  }

  function handleDeploy(type: string) {
    switch (type) {
      case "public-webpage":
        // Load agent-specific config or initialize with defaults
        const agentId = String(app.agent.id || "")
        const savedConfig = localStorage.getItem(`webpageConfig_${agentId}`)
        let existingConfig: WebpageConfig | null = null
        
        if (savedConfig) {
          try {
            existingConfig = JSON.parse(savedConfig)
          } catch (e) {
            console.error('Failed to parse saved config:', e)
          }
        }
        
        setWebpageConfig({
          title: existingConfig?.title || app.agent.title || "My Agent",
          description: existingConfig?.description || app.agent.description || "A powerful AI agent",
          primaryColor: existingConfig?.primaryColor || "#3b82f6",
          secondaryColor: existingConfig?.secondaryColor || "#1e40af",
          logoUrl: existingConfig?.logoUrl || "",
          customDomain: existingConfig?.customDomain || "",
          enableChat: existingConfig?.enableChat !== undefined ? existingConfig.enableChat : true,
          enableAnalytics: existingConfig?.enableAnalytics !== undefined ? existingConfig.enableAnalytics : false,
          theme: existingConfig?.theme || "light" as const,
          agentId: agentId,
          agentTitle: app.agent.title || "",
          agentDescription: app.agent.description || ""
        })
        setWebpagePopoverOpen(true)
        break
      case "communication-channel":
        toast.info("Deploying to Communication Channel...", {
          description: "This feature is coming soon!"
        })
        break
      case "integration":
        toast.info("Deploying as Integration...", {
          description: "This feature is coming soon!"
        })
        break
      default:
        toast.error("Unknown deployment type")
    }
  }



  return <>
    <div className="relative">
      <div className="flex gap-6 items-center py-2" id="menuroot">
        <div className="flex items-center gap-3">
          {(canUpdate("agents") || canCreate("agents")) && <Button variant="highlight" size="sm" className="rounded hover:opacity-90" onClick={() => onPlay()} title="Run Agent">
            <Play size={18} />
            Run
          </Button>}
          {(canUpdate("agents") || canCreate("agents")) && <Button variant="outline" size="sm" className="rounded hover:bg-sidebar-accent hover:text-white" onClick={() => onSave()} title="Save Agent">
            {saving && <LoaderCircle size={18} className="animate-spin" />}
            {!saving && <Save size={18} />}
            Save
          </Button>}
          {(canUpdate("agents") || canCreate("agents")) && <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="rounded hover:bg-sidebar-accent hover:text-white" title="Deploy Agent">
                <Zap size={18} />
                Deploy
              </Button>
            </DropdownMenuTrigger>
                        <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleDeploy("public-webpage")} title="Deploy as Public Webpage">
                <div className="flex items-center gap-2">
                  <PanelTop className="w-4 h-4 text-blue-500" />
                  Webpage
                </div>
              </DropdownMenuItem>
                
              
              <DropdownMenuItem onClick={() => handleDeploy("communication-channel")} title="Deploy to Communication Channel">
                <div className="flex items-center gap-2">
                  <MessageCircleCode className="w-4 h-4 text-green-500" />
                  Channel
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDeploy("integration")} title="Deploy as Integration">
                <div className="flex items-center gap-2">
                  <Workflow className="w-4 h-4 text-purple-500" />
                  Integration
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>}
          {(canUpdate("agents") || canCreate("agents")) && <Menubar className="!bg-transparent !border-none p-0 space-x-3 shadow-none h-4">
            <MenubarMenu>
              <MenubarTrigger asChild>
                <Button variant="outline" size="sm" className="rounded hover:bg-sidebar-accent hover:text-white" title="Agent Settings">
                  <Settings size={18} />
                </Button>
              </MenubarTrigger>
              <MenubarContent>
                <MenubarItem onClick={onSetAgent} title="Configure Agent Settings">
                  <div className="flex items-center gap-2">
                    <Settings size={16} />
                    Settings
                  </div>
                </MenubarItem>
                <MenubarItem onClick={onChangeDisplayData} title={app.agent.displayData ? "Hide Debug Data" : "Show Debug Data"}>
                  <div className="flex items-center gap-2">
                    <Bug size={16} />
                    {app.agent.displayData ? "Hide Debug Data" : "Show Debug Data"}
                  </div>
                </MenubarItem>
              </MenubarContent>
            </MenubarMenu>
          </Menubar>}
          {(app.agent.isConversational) && <Button variant="outline" size="sm" className="rounded hover:bg-sidebar-accent hover:text-white" onClick={onShowChat} title="Open Chat">
            <MessageCircle size={16} />
          </Button>}
        </div>
      </div>
    </div>

    <Modal form={agentForm} title="Agent Configuration">
      <Row>
        <Input span={12} field={f.title} required />
      </Row>
      <Row>
        <InputTextArea rows={10} span={12} field={f.description} />
      </Row>
      <Row>
        <Select span={12} field={f.type} required />
      </Row>
      <Row>
        <Input span={12} field={f.debuguid} />
      </Row>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" className="rounded-sm" title="Reset Agent State and History">Reset State and History</Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the Agent state.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onResetState} >Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Modal>

    <Dialog open={webpagePopoverOpen} onOpenChange={setWebpagePopoverOpen}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Public Webpage Configuration</DialogTitle>
          <DialogDescription>
            Configure your agent's public webpage with custom branding and settings.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div>
            <label className="text-sm font-medium">Page Title</label>
            <ShadcnInput
              value={webpageConfig.title}
              onChange={(e) => setWebpageConfig({...webpageConfig, title: e.target.value})}
              placeholder="My AI Agent"
              className="mt-1"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium">Description</label>
            <textarea
              value={webpageConfig.description}
              onChange={(e) => setWebpageConfig({...webpageConfig, description: e.target.value})}
              placeholder="Describe your agent..."
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm resize-none"
              rows={3}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Primary Color</label>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="color"
                  value={webpageConfig.primaryColor}
                  onChange={(e) => setWebpageConfig({...webpageConfig, primaryColor: e.target.value})}
                  className="w-8 h-8 border rounded cursor-pointer"
                />
                <ShadcnInput
                  value={webpageConfig.primaryColor}
                  onChange={(e) => setWebpageConfig({...webpageConfig, primaryColor: e.target.value})}
                  className="text-xs"
                />
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium">Secondary Color</label>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="color"
                  value={webpageConfig.secondaryColor}
                  onChange={(e) => setWebpageConfig({...webpageConfig, secondaryColor: e.target.value})}
                  className="w-8 h-8 border rounded cursor-pointer"
                />
                <ShadcnInput
                  value={webpageConfig.secondaryColor}
                  onChange={(e) => setWebpageConfig({...webpageConfig, secondaryColor: e.target.value})}
                  className="text-xs"
                />
              </div>
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium">Logo</label>
            <div className="mt-1">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    console.log('File selected:', file.name, file.size, file.type)
                    
                    // Validate file type
                    if (!file.type.startsWith('image/')) {
                      alert('Please select an image file')
                      return
                    }
                    
                    // Check file size (max 5MB)
                    if (file.size > 5 * 1024 * 1024) {
                      alert('File size must be less than 5MB')
                      return
                    }
                    
                    const reader = new FileReader()
                    reader.onload = (event) => {
                      const result = event.target?.result as string
                      console.log('Logo converted to base64, length:', result.length)
                      console.log('Base64 starts with:', result.substring(0, 50))
                      
                      if (result && result.startsWith('data:image/')) {
                        setWebpageConfig({...webpageConfig, logoUrl: result})
                        console.log('Logo URL set successfully')
                        console.log('Updated webpageConfig.logoUrl:', result.substring(0, 100))
                      } else {
                        console.error('Invalid base64 conversion result')
                        alert('Failed to convert image to base64')
                      }
                    }
                    
                    reader.onerror = () => {
                      console.error('FileReader error:', reader.error)
                      alert('Failed to read image file')
                    }
                    
                    reader.readAsDataURL(file)
                  }
                }}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>
            {webpageConfig.logoUrl && (
              <div className="mt-2">
                <img 
                  src={webpageConfig.logoUrl} 
                  alt="Logo Preview" 
                  className="w-8 h-8 rounded object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              </div>
            )}
          </div>
          
          <div>
            <label className="text-sm font-medium">Custom Domain (Optional)</label>
            <ShadcnInput
              value={webpageConfig.customDomain}
              onChange={(e) => setWebpageConfig({...webpageConfig, customDomain: e.target.value})}
              placeholder="myagent.com"
              className="mt-1"
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Enable Chat Interface</label>
              <input
                type="checkbox"
                checked={webpageConfig.enableChat}
                onChange={(e) => setWebpageConfig({...webpageConfig, enableChat: e.target.checked})}
                className="rounded"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Enable Analytics</label>
              <input
                type="checkbox"
                checked={webpageConfig.enableAnalytics}
                onChange={(e) => setWebpageConfig({...webpageConfig, enableAnalytics: e.target.checked})}
                className="rounded"
              />
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium">Theme</label>
            <select
              value={webpageConfig.theme}
              onChange={(e) => setWebpageConfig({...webpageConfig, theme: e.target.value as 'light' | 'dark' | 'auto'})}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="auto">Auto</option>
            </select>
          </div>
          
          <div className="border-t pt-3">
            <label className="text-sm font-medium mb-2 block">Preview</label>
            <div 
              className={`border rounded-lg overflow-hidden ${webpageConfig.theme === 'dark' ? 'dark' : ''}`}
              style={{
                backgroundColor: webpageConfig.theme === 'dark' ? '#1f2937' : '#ffffff',
                color: webpageConfig.theme === 'dark' ? '#f9fafb' : '#111827'
              }}
            >
              {/* Header */}
              <div className="py-4 border-b flex justify-between items-center"
                   style={{
                     backgroundColor: webpageConfig.theme === 'dark' ? '#1f2937' : '#ffffff',
                     borderColor: webpageConfig.theme === 'dark' ? '#374151' : '#e5e7eb'
                   }}>
                <div className="flex items-center gap-3 px-4">
                  {webpageConfig.logoUrl && (
                    <img 
                      src={webpageConfig.logoUrl} 
                      alt="Logo" 
                      className="w-8 h-8 rounded object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  )}
                  <h2 className="text-xl font-semibold tracking-tight"
                      style={{ color: webpageConfig.theme === 'dark' ? '#f9fafb' : '#111827' }}>
                    {webpageConfig.title || "My AI Agent"}
                  </h2>
                </div>
                <div className="flex items-center gap-2 px-4">
                  <div className="w-8 h-8 rounded border flex items-center justify-center"
                       style={{ 
                         borderColor: webpageConfig.theme === 'dark' ? '#374151' : '#d1d5db',
                         color: webpageConfig.theme === 'dark' ? '#f9fafb' : '#6b7280'
                       }}>
                    🌙
                  </div>
                  <div className="w-8 h-8 rounded border flex items-center justify-center"
                       style={{ 
                         borderColor: webpageConfig.theme === 'dark' ? '#374151' : '#d1d5db',
                         color: webpageConfig.theme === 'dark' ? '#f9fafb' : '#6b7280'
                       }}>
                    ➕
                  </div>
                </div>
              </div>
              
              {/* Main Content */}
              <div className="flex-1 min-h-[200px] flex items-center justify-center"
                   style={{ backgroundColor: webpageConfig.theme === 'dark' ? '#1f2937' : '#ffffff' }}>
                <h1 className="text-4xl font-bold text-center"
                    style={{ 
                      background: `linear-gradient(to right, ${webpageConfig.primaryColor}, ${webpageConfig.secondaryColor})`,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text'
                    }}>
                  Hello, how can I help you?
                </h1>
              </div>
              
              {/* Input Area */}
              <div className="p-4 border-t"
                   style={{ 
                     backgroundColor: webpageConfig.theme === 'dark' ? '#1f2937' : '#ffffff',
                     borderColor: webpageConfig.theme === 'dark' ? '#374151' : '#e5e7eb'
                   }}>
                <div className="max-w-4xl mx-auto">
                  <div className="border rounded-xl p-3"
                       style={{ 
                         borderColor: webpageConfig.theme === 'dark' ? '#374151' : '#d1d5db',
                         backgroundColor: webpageConfig.theme === 'dark' ? '#111827' : '#ffffff'
                       }}>
                    <div className="px-2 py-3">
                      <textarea 
                        placeholder="Type your message here."
                        className="w-full outline-none resize-none text-sm min-h-[40px]"
                        style={{ 
                          color: webpageConfig.theme === 'dark' ? '#f9fafb' : '#111827',
                          backgroundColor: 'transparent'
                        }}
                        disabled
                      />
                    </div>
                    <div className="flex justify-between items-center p-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-10 h-10 flex items-center justify-center rounded-lg"
                             style={{ color: webpageConfig.theme === 'dark' ? '#9ca3af' : '#6b7280' }}>
                          📄
                        </div>
                        <div className="w-10 h-10 flex items-center justify-center rounded-lg"
                             style={{ color: webpageConfig.theme === 'dark' ? '#9ca3af' : '#6b7280' }}>
                          📋
                        </div>
                      </div>
                      <div>
                        <div className="w-10 h-10 flex items-center justify-center rounded-full"
                             style={{ 
                               backgroundColor: webpageConfig.theme === 'dark' ? '#374151' : '#6b7280',
                               color: webpageConfig.theme === 'dark' ? '#f9fafb' : '#ffffff'
                             }}>
                          ↑
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-center mt-2"
                     style={{ color: webpageConfig.theme === 'dark' ? '#9ca3af' : '#6b7280' }}>
                    Signpost AI is experimental. Please validate results. Supports both text and JSON input.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline"
            onClick={() => {
              setWebpageConfig({
                title: app.agent.title || "My Agent",
                description: app.agent.description || "A powerful AI agent",
                primaryColor: "#3b82f6",
                secondaryColor: "#1e40af",
                logoUrl: webpageConfig.logoUrl, // Preserve the logo
                customDomain: "",
                enableChat: true,
                enableAnalytics: false,
                theme: "light" as const,
                agentId: String(app.agent.id || ""),
                agentTitle: app.agent.title || "",
                agentDescription: app.agent.description || ""
              })
            }}
          >
            Reset
          </Button>
          <Button 
            onClick={async () => {
              if (!webpageConfig.title.trim()) {
                toast.error("Please enter a page title")
                return
              }
              
              try {
                console.log('Deploying with config:', webpageConfig)
                console.log('Logo URL in deployment:', webpageConfig.logoUrl)
                console.log('Logo URL type:', typeof webpageConfig.logoUrl)
                console.log('Logo URL length:', webpageConfig.logoUrl?.length)
                console.log('Logo URL starts with:', webpageConfig.logoUrl?.substring(0, 50))
                console.log('Is base64 data URL:', webpageConfig.logoUrl?.startsWith('data:image/'))
                
                if (webpageConfig.logoUrl && !webpageConfig.logoUrl.startsWith('data:image/')) {
                  console.error('Invalid logo URL format:', webpageConfig.logoUrl)
                }
                
                const deployment = await DeploymentService.deployWebpage(webpageConfig)
                
                setCurrentDeploymentUrl(deployment.deploymentUrl)
                setWebpageViewerOpen(true)
                setWebpagePopoverOpen(false)
                
                const fullUrl = window.location.origin + deployment.deploymentUrl
                toast.success("Webpage deployed!", {
                  description: `Your agent is now live at ${fullUrl}`,
                  action: {
                    label: "View Site",
                    onClick: () => setWebpageViewerOpen(true)
                  }
                })
              } catch (error) {
                toast.error("Deployment failed", {
                  description: error instanceof Error ? error.message : "Unknown error occurred"
                })
              }
            }}
            style={{ backgroundColor: webpageConfig.primaryColor }}
            disabled={!webpageConfig.title.trim()}
          >
            Deploy Webpage
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <WebpageViewer
      deploymentUrl={currentDeploymentUrl}
      open={webpageViewerOpen}
      onOpenChange={setWebpageViewerOpen}
    />
  </>


}
