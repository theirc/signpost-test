import { useReactFlow } from '@xyflow/react'
import { EllipsisVertical, Settings, Trash2 } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu"
import { memo } from 'react'

interface Props {
  registry: WorkerRegistryItem
  worker: AIWorker
}

export const NodeTitle = memo(({ registry, worker }: Props & React.ComponentProps<"div">) => {
  const Icon = registry.icon || Settings
  const { deleteElements } = useReactFlow()

  const handleDelete = () => deleteElements({ nodes: [{ id: worker.config.id }] })

  return <div className='w-full p-1 pl-2 bg-yellow-200 text-sm flex border-b-gray-200 border-b relative group'>
    <Icon size={16} className='mr-1 mt-[2px] text-gray-600' />
    <div className="flex-grow">{registry.title || "Title"}</div>
    {/* <Button variant="ghost" size="icon" className="absolute top-[2px] right-1 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6" onClick={handleDelete}>
      <Trash2 className="h-4 w-4" />
    </Button> */}
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


