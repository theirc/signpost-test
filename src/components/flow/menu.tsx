import { Menubar, MenubarContent, MenubarItem, MenubarMenu, MenubarTrigger } from "@/components/ui/menubar"
import { workerRegistry } from "@/lib/agents/registry"
import { createModel } from "@/lib/data/model"
import { cloneDeep } from "lodash"
import { Cog, EllipsisVertical, LoaderCircle, Play, Save, Settings } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Input, InputTextArea, Modal, Row, Select, useForm } from "../forms"
import { Separator } from "../ui/separator"
import { agents } from "@/lib/agents"
import { app } from "@/lib/app"
import { useTeamStore } from "@/lib/hooks/useTeam"
import { useForceUpdate } from "@/lib/utils"

interface Props {
  update?: () => void
}


function DragableItem({ reg: { title, icon: Icon, description, type } }: { reg: WorkerRegistryItem }) {

  const onDragStart = (event: React.DragEvent<HTMLAnchorElement>, nodeType) => {
    event.dataTransfer.setData('nodeType', nodeType)
    event.dataTransfer.effectAllowed = 'move'
    console.log("drag")
  }

  const onClick = (event: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    event.preventDefault()
  }

  return <a href={"#"} onDragStart={(event) => onDragStart(event, type)} onClick={onClick} draggable>
    <MenubarItem className="size-full flex cursor-move">
      <div className="hover:bg-gray-100 cursor-move flex gap-1 items-center select-none w-28 h-10 mr-1 px-2">
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
  }
})


export function Toolbar(props: Props) {


  const { selectedTeam } = useTeamStore()
  const update = useForceUpdate()
  const { form, m, watch } = useForm(model, {
    values: {
      title: app.agent.title,
      ...app.getAPIkeys(),
    }
  })

  const { form: agentForm, m: f } = useForm(agentModel, {
    values: {
      title: app.agent.title,
    }
  })

  const [saving, setSaving] = useState(false)


  form.onSubmit = async (data) => {
    const ak = app.getAPIkeys()
    ak.openai = data.openai
    ak.anthropic = data.anthropic
    ak.zendesk = data.zendesk
    app.saveAPIkeys(ak)
  }

  agentForm.onSubmit = async (data) => {
    app.agent.title = data.title
    app.agent.description = data.description
    app.agent.type = data.type as any
  }

  async function onSave() {
    if (saving) return
    setSaving(true)
    const clonedAgent = cloneDeep(app.agent)
    await agents.saveAgent(clonedAgent, selectedTeam.id)
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

    // if (!agent.hasInput()) {
    //   toast("Add an Input Worker to execute", { action: { label: "Ok", onClick: () => console.log("Ok"), }, })
    //   return
    // }

    const p: AgentParameters = {
      debug: true,
      uid: "ab8d4317-3276-420b-8e4b-f7d88f4f4e6f",
      input: {},
      apikeys: app.getAPIkeys(),
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

  function onSetAPIKey() {
    form.modal.show()
  }

  function onSetAgent() {
    agentForm.edit({
      title: app.agent.title,
      description: app.agent.description,
      type: app.agent.type
    })
  }

  return <>
    <div className="flex gap-3 mb-2 text-xs items-center" id="menuroot">
      <div className="flex flex-grow items-center p-2">
        <div className="text-sm" >
          <Settings size={18} className="inline mr-2 cursor-pointer" onClick={onSetAgent} />
          {app.agent.title}
        </div>
      </div>
      <Separator orientation="vertical" />
      <div className="rounded-sm hover:text-blue-400 cursor-pointer" onClick={() => onSave()}>
        {saving && <LoaderCircle size={18} className="animate-spin" />}
        {!saving && <Save size={18} />}
      </div>
      <Separator orientation="vertical" />
      <div className="rounded-sm hover:text-rose-600 text-indigo-500 cursor-pointer" title="Play" onClick={() => onPlay()}>
        <Play size={18} />
      </div>
      <Separator orientation="vertical" />
      <Menubar className="h-4 border-0">
        <MenubarMenu>
          <MenubarTrigger className="font-normal text-xs">I/O</MenubarTrigger>
          <MenubarContent>
            {Object.entries(workerRegistry).filter(([key, node]) => node.category == "io").map(([key, node]) => (<DragableItem key={key} reg={node} />))}
          </MenubarContent>
        </MenubarMenu>
        <MenubarMenu>
          <MenubarTrigger className="font-normal text-xs">Generators</MenubarTrigger>
          <MenubarContent>
            {Object.entries(workerRegistry).filter(([key, node]) => node.category == "generator").map(([key, node]) => (<DragableItem key={key} reg={node} />))}
          </MenubarContent>
        </MenubarMenu>
        <MenubarMenu>
          <MenubarTrigger className="font-normal text-xs">Tools</MenubarTrigger>
          <MenubarContent>
            {Object.entries(workerRegistry).filter(([key, node]) => node.category == "tool").map(([key, node]) => (<DragableItem key={key} reg={node} />))}
          </MenubarContent>
        </MenubarMenu>
        <MenubarMenu>
          <MenubarTrigger className="font-normal text-xs">Debug</MenubarTrigger>
          <MenubarContent>
            {Object.entries(workerRegistry).filter(([key, node]) => node.category == "debug").map(([key, node]) => (<DragableItem key={key} reg={node} />))}
          </MenubarContent>
        </MenubarMenu>
        <MenubarMenu>
          <MenubarTrigger className="font-normal text-xs"><EllipsisVertical size={18} className="cursor-pointer" /></MenubarTrigger>
          <MenubarContent>
            <MenubarItem className="text-xs" onClick={onSetAPIKey}>
              Set API Keys
            </MenubarItem>
            <MenubarItem className="text-xs" onClick={onChangeDisplayData}>
              {app.agent.displayData ? "Hide Debug Data" : "Show Debug Data"}
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
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
    </Modal>

    <Modal form={form} title="API Keys">
      <Row>
        <Input span={12} field={m.openai} required />
      </Row>
      <Row>
        <Input span={12} field={m.anthropic} required />
      </Row>
      <Row>
        <Input span={12} field={m.zendesk} required />
      </Row>
    </Modal>

  </>


}
