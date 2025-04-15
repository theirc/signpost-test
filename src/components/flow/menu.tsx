import { Menubar, MenubarContent, MenubarItem, MenubarMenu, MenubarTrigger } from "@/components/ui/menubar"
import { workerRegistry } from "@/lib/agents/registry"
import { createModel } from "@/lib/data/model"
import { cloneDeep } from "lodash"
import { EllipsisVertical, LoaderCircle, Play, Save } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Input, Modal, Row, useForm } from "../forms"
import { Separator } from "../ui/separator"


import { agents } from "@/lib/agents"
import { app } from "@/lib/app"

async function executeAgent() {

  //Load the agent by id
  const agent = await agents.loadAgent(23)

  //create the Agent parameters
  const parameters: AgentParameters = {
    //Put your input content here
    input: {
      question: "What is malaria?"
    },
    apikeys: app.getAPIkeys(), //this loads the API keys to execute the AI workers. Use the menu to set it
  }

  //Execute the agent
  await agent.execute(parameters)


  //Check if there is an error
  if (parameters.error) {
    //Check the error returned by the agent if any
  }

  console.log("Result: ", parameters.output) //The result of the agent

}


interface Props {
  update?: () => void
}


function MenuDragger(props: { icon: any, title: string, type: string }) {

  const onDragStart = (event: React.DragEvent<HTMLAnchorElement>, nodeType) => {
    event.dataTransfer.setData('nodeType', nodeType)
    event.dataTransfer.effectAllowed = 'move'
    console.log("drag")
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
      <Separator orientation="vertical" />
      {/* {Object.entries(workerRegistry).map(([key, node]) => (
        <MenuDragger title={node.title} type={key} icon={node.icon} key={key} />
      ))}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <EllipsisVertical size={18} className="cursor-pointer" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onClick={onSetAPIKey} >
            <Key />
            <span>Set API Keys</span>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <MenuDragger title="Schema" type={"schema"} icon={null} />
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu> */}

      <Menubar className="h-4 border-0 hi">
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
          </MenubarContent>
        </MenubarMenu>

      </Menubar>

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
