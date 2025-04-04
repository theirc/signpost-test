import { workerRegistry } from "@/lib/agents/registry"
import { ChevronLast, EllipsisVertical, Key, LoaderCircle, Play, Save, Square, StepForward, StopCircle, StopCircleIcon, User } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "../ui/dropdown-menu"
import { Separator } from "../ui/separator"
import { toast } from "sonner"
import { agents } from "@/lib/data"
import { app } from "@/lib/app"
import { createModel } from "@/lib/data/model"
import { Input, Modal, Row, useForm } from "../forms"
import { useEffect, useState } from "react"
import { title } from "process"
import { cloneDeep } from "lodash"
import axios from "axios"

interface Props {
  update?: () => void
}


function MenuDragger(props: { icon: any, title: string, type: string }) {

  const onDragStart = (event: React.DragEvent<HTMLAnchorElement>, nodeType) => {
    event.dataTransfer.setData('nodeType', nodeType)
    event.dataTransfer.effectAllowed = 'move'
  }

  const onClick = (event: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    event.preventDefault()
  }

  return <a href={"#"} onDragStart={(event) => onDragStart(event, props.type)} onClick={onClick} draggable>
    <div className="hover:bg-gray-100  rounded-sm  cursor-move flex gap-1 items-center select-none">
      {props.icon && <props.icon size={16} />}
      {props.title}
    </div>
  </a>

}

const model = createModel({
  fields: {
    title: { type: 'string', title: 'Title' },
    openai: { type: 'string', title: 'OpenAI' },
    anthropic: { type: 'string', title: 'Anthropic' },
  }
}
)

export function Toolbar(props: Props) {


  const { form, m, watch } = useForm(model, {
    values: {
      title: app.agent.title,
      ...app.getAPIkeys(),
    }
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const subscription = watch((value, { name, type }) => {
      console.log(value, name, type)
      if (name == "title") app.agent.title = value.title || ""
    })
    return () => subscription.unsubscribe()
  }, [watch])

  form.onSubmit = async (data) => {
    const ak = app.getAPIkeys()
    ak.openai = data.openai
    ak.anthropic = data.anthropic
    app.saveAPIkeys(ak)
  }


  async function onSave() {
    if (saving) return
    setSaving(true)
    const clonedAgent = cloneDeep(app.agent)
    await agents.saveAgent(clonedAgent)
    toast("The flow was saved", {
      // description: "Not Implemented!",
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

    const apiKey = localStorage.getItem("openai-api-key")

    if (!apiKey) {
      toast("Please set an OpenAI API Key", { action: { label: "Ok", onClick: () => console.log("Ok"), }, })
      return
    }


    if (!agent.hasResponse()) {
      toast("Add a Response Worker to execute", { action: { label: "Ok", onClick: () => console.log("Ok"), }, })
      return
    }

    if (!agent.hasInput()) {
      toast("Add an Input Worker to execute", { action: { label: "Ok", onClick: () => console.log("Ok"), }, })
      return
    }

    const p: AgentParameters = {
      debug: true,
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

  function onSetAPIKey() {
    form.modal.show()
  }

  return <>
    <div className="flex gap-3 mb-2 text-xs items-center">
      <div className="flex flex-grow">
        <form.context>
          <Input className="h-3 px-1 p-3 pr-2 border-gray-100 hover:border-gray-300 text w-full" field={m.title} hideLabel maxLength={24} />
        </form.context>
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
      {/* <div className="rounded-sm hover:text-rose-600  text-indigo-500 cursor-pointer" title="Step">
      <StepForward size={18} />
    </div> */}
      {/* <div className="rounded-sm hover:text-rose-600 text-indigo-500 cursor-pointer" title="Stop">
      <Square size={18} />
    </div> */}
      <Separator orientation="vertical" />
      {Object.entries(workerRegistry).map(([key, node]) => (
        <MenuDragger title={node.title} type={key} icon={node.icon} key={key} />
      ))}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <EllipsisVertical size={18} className="cursor-pointer" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onClick={onSetAPIKey}>
            <Key />
            <span>Set API Keys</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Workers</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <User />
            <span>More</span>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <User />
            <span>Workers</span>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <User />
            <span>Here</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>

    <Modal form={form} title="API Keys">
      <Row>
        <Input span={12} field={m.openai} required />
      </Row>
      <Row>
        <Input span={12} field={m.anthropic} required />
      </Row>
    </Modal>


  </>




}
