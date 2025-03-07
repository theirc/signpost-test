import { workerRegistry } from "@/lib/agents/registry"
import { ChevronLast, EllipsisVertical, Play, Save, Square, StepForward, StopCircle, StopCircleIcon, User } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "../ui/dropdown-menu"
import { Separator } from "../ui/separator"
import { toast } from "sonner"
import { agents } from "@/lib/data"
import { app } from "@/lib/app"
import { createModel } from "@/lib/data/model"
import { Input, Row, useForm } from "../forms"
import { useEffect } from "react"
import { title } from "process"

interface Props {
  // onSave?(): void
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
  }
}
)

export function Toolbar(props: Props) {

  const { form, m, watch } = useForm(model, { defaultValues: { title: app.agent.title } })

  useEffect(() => {
    const subscription = watch((value, { name, type }) => {
      console.log(value, name, type)
      if (name == "title") {
        app.agent.title = value.title || ""
      }
    })
    return () => subscription.unsubscribe()
  }, [watch])

  async function onSave() {
    await agents.saveAgent(app.agent)
    toast("The flow was saved", {
      // description: "Not Implemented!",
      action: {
        label: "Ok",
        onClick: () => console.log("Ok"),
      },
    })
  }

  return <div className="flex gap-3 mb-2 text-xs">
    <div className="rounded-sm hover:text-blue-400 cursor-pointer" onClick={() => onSave()}>
      <Save size={18} />
    </div>
    <Separator orientation="vertical" />
    <div className="rounded-sm hover:text-rose-600 text-indigo-500 cursor-pointer" title="Play">
      <Play size={18} />
    </div>
    <div className="rounded-sm hover:text-rose-600  text-indigo-500 cursor-pointer" title="Step">
      <StepForward size={18} />
    </div>
    <div className="rounded-sm hover:text-rose-600 text-indigo-500 cursor-pointer" title="Stop">
      <Square size={18} />
    </div>
    <Separator orientation="vertical" />
    {Object.entries(workerRegistry).map(([key, node]) => (
      <MenuDragger title={node.title} type={key} icon={node.icon} key={key} />
    ))}
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <EllipsisVertical size={18} className="cursor-pointer" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
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
    <div className="flex-grow" />
    <div className="flex items-center">
      <div>TITLE:</div>
      <div className="">
        <form.context>
          <Input className="ml-1 h-3 px-1 border-transparent hover:border-gray-300" field={m.title} hideLabel maxLength={24} />
        </form.context>
      </div>
    </div>
  </div>




}
