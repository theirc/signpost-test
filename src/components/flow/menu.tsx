import { Menubar, MenubarContent, MenubarItem, MenubarMenu, MenubarTrigger } from "@/components/ui/menubar"
import { workerRegistry } from "@/lib/agents/registry"
import { createModel } from "@/lib/data/model"
import { cloneDeep } from "lodash"
import { Bug, BugOff, Cog, EllipsisVertical, LoaderCircle, MessageCircle, Parentheses, Play, Save, Settings, Wrench, BrainCog } from "lucide-react"
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

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

  return <>
    <div className="relative">
      <div className="flex gap-6 items-center py-2" id="menuroot">
        <div className="flex items-center gap-3">
          {(canUpdate("agents") || canCreate("agents")) && <Button variant="outline" size="sm" className="rounded hover:bg-sidebar-accent hover:text-white" onClick={() => onPlay()}>
            <Play size={18} />
            Run
          </Button>}
          {(canUpdate("agents") || canCreate("agents")) && <Button variant="outline" size="sm" className="rounded hover:bg-sidebar-accent hover:text-white" onClick={() => onSave()}>
            {saving && <LoaderCircle size={18} className="animate-spin" />}
            {!saving && <Save size={18} />}
            Save
          </Button>}
          {(canUpdate("agents") || canCreate("agents")) && <Menubar className="!bg-transparent !border-none p-0 space-x-3 shadow-none h-4">
            <MenubarMenu>
              <MenubarTrigger asChild>
                <Button variant="outline" size="sm" className="rounded hover:bg-sidebar-accent hover:text-white">
                  <EllipsisVertical size={18} />
                </Button>
              </MenubarTrigger>
              <MenubarContent>
                <MenubarItem className="text-xs" onClick={onSetAgent}>
                  <Settings size={14} className="inline mr-1" onClick={onSetAgent} />
                  Settings
                </MenubarItem>
                <MenubarItem className="text-xs" onClick={onChangeDisplayData}>
                  <Bug size={14} className="inline mr-1" />
                  {app.agent.displayData ? "Hide Debug Data" : "Show Debug Data"}
                </MenubarItem>
              </MenubarContent>
            </MenubarMenu>
          </Menubar>}
          {(app.agent.isConversational) && <Button variant="outline" size="sm" className="rounded hover:bg-sidebar-accent hover:text-white" onClick={onShowChat}>
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
          <Button variant="destructive" className="rounded-sm">Reset State and History</Button>
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
  </>


}
