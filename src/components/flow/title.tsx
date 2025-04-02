import { useReactFlow } from '@xyflow/react'
import { EllipsisVertical, LoaderCircle, Settings, Trash2 } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu"
import { memo } from 'react'
import { useWorkerContext } from './hooks'
import { app } from '@/lib/app'

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

  if (currentWorker && currentWorker.id === worker.id) {
    // console.log("Title Worker: ", currentWorker.config.type)
    Icon = <LoaderCircle size={16} className="animate-spin mr-1 mt-[2px] text-gray-600" />
  }

  // console.log("Title Worker: ", app.agent.currentWorker?.config.type || "null", worker.config.type)

  return <div className='w-full p-1 pl-2 mb-1 bg-yellow-200 text-sm flex border-b-gray-200 border-b relative group'>
    {Icon}
    {/* <Icon size={16} className='mr-1 mt-[2px] text-gray-600' /> */}
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
      </DropdownMenuContent>
    </DropdownMenu>
  </div>

})


