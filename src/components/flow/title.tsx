import { useReactFlow } from '@xyflow/react'
import { EllipsisVertical, LoaderCircle, Settings, Trash2, CircleXIcon, HelpCircle } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu"
import { memo } from 'react'
import { useWorkerContext } from './hooks'
import { app } from '@/lib/app'
import { HoverCard, HoverCardContent, HoverCardTrigger, } from "@/components/ui/hover-card"
import { Arrow } from "@radix-ui/react-hover-card"

interface Props {
  registry?: WorkerRegistryItem
  worker?: AIWorker
}

export const NodeTitle = memo((props: Props & React.ComponentProps<"div">) => {

  const { worker } = useWorkerContext()
  const { agent } = app
  const { deleteElements } = useReactFlow()

  let Icon: any = worker.registry.icon ? <worker.registry.icon size={16} className='mr-1 mt-[2px] text-gray-600' /> : <Settings size={16} className='mr-1 mt-[2px] text-gray-600' />
  const handleDelete = () => deleteElements({ nodes: [{ id: worker?.config.id }] })
  const { currentWorker } = agent

  function onAddCondition() {
    worker.addHandler({ name: `condition_${worker.createHandlerId()}`, type: "unknown", title: "Condition", direction: "input", system: true, condition: true })
    agent.update()
  }

  if (currentWorker && currentWorker.id === worker.id) {
    Icon = <LoaderCircle size={16} className="animate-spin mr-1 mt-[2px] text-gray-600" />
  }

  if (worker.error) {
    Icon = <HoverCard openDelay={200}>
      <HoverCardTrigger>
        <CircleXIcon size={16} strokeWidth={4} className="mt-[2px] mr-1 text-red-500" />
      </HoverCardTrigger>
      <HoverCardContent side='top' className='overflow-auto border-red-500'>
        <Arrow />
        {worker.error}
      </HoverCardContent>
    </HoverCard>
  }

  return <div className='w-full p-1 pl-2 mb-1 bg-[#FAE264] text-sm flex border-b-gray-200 border-b relative group'>
    {Icon}
    <div className="flex-grow">{worker?.registry.title ?? "Title"}</div>
    <DropdownMenu>
      <DropdownMenuTrigger asChild className="cursor-pointer">
        <EllipsisVertical size={16} className="mt-[2px]" />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={handleDelete}>
          <Trash2 />
          Delete
        </DropdownMenuItem>
        {worker.conditionable && <DropdownMenuItem onClick={onAddCondition}>
          <HelpCircle />
          Add Condition
        </DropdownMenuItem>}
      </DropdownMenuContent>
    </DropdownMenu>
  </div>

})


