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

  let Icon: any = worker.registry.icon ? <worker.registry.icon size={24} className='mr-2 mt-[2px] text-white' /> : <Settings size={24} className='mr-2 mt-[2px] text-white' />
  const handleDelete = () => deleteElements({ nodes: [{ id: worker?.config.id }] })
  const { currentWorker } = agent

  function onAddCondition() {
    worker.addHandler({ name: `condition_${worker.createHandlerId()}`, type: "unknown", title: "Condition", direction: "input", system: true, condition: true })
    agent.update()
  }

  if (currentWorker && currentWorker.id === worker.id) {
    Icon = <LoaderCircle size={24} className="animate-spin mr-2 mt-[2px] text-white" />
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

  //Fixed because we should avoid using pixel units for responsiveness and readability.
  // return <div className='w-full p-3 pl-4 mb-1 min-h-[56px] bg-[#6386F7] text-sm text-white flex items-center border-b-gray-200 border-b relative group'>
  return <div className='w-full p-1 pl-4 mb-1 bg-[#6386F7] text-sm text-white flex items-center border-b-gray-200 border-b relative group'>
    {Icon}
    <div className="flex-grow text-white text-xl font-dm-mono">{worker?.registry.title ?? "Title"}</div>
    <DropdownMenu>
      <DropdownMenuTrigger asChild className="cursor-pointer">
        <EllipsisVertical size={24} className="mt-[2px] text-white" />
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


