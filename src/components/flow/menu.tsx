import { workerRegistry } from "@/lib/agents/registry"
import { ChevronLast, EllipsisVertical, Play, Save, Square, StepForward, StopCircle, StopCircleIcon, User } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "../ui/dropdown-menu"
import { Separator } from "../ui/separator"

interface Props {
  onSave?(): void
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

export function Toolbar(props: Props) {

  return <div className="flex gap-3 -mb-2 text-xs">
    <div className="rounded-sm hover:text-blue-400 cursor-pointer" onClick={() => props?.onSave()}>
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
  </div>




}
