import { useReactFlow } from '@xyflow/react'
import { EllipsisVertical, LoaderCircle, Settings, Trash2, CircleXIcon, HelpCircle } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu"
import { memo } from 'react'
import { useWorkerContext } from './hooks'
import { app } from '@/lib/app'
import { HoverCard, HoverCardContent, HoverCardTrigger, } from "@/components/ui/hover-card"
import { Arrow } from "@radix-ui/react-hover-card"
import { workerRegistry } from '@/lib/agents/registry'
import React from 'react'

// Function to generate header background colors based on worker type
const getHeaderBackgroundColor = (workerType: string) => {
  const worker = workerRegistry[workerType]
  if (!worker) return 'bg-blue-100' // Default fallback
  
  // Find the index of this worker in its category (same logic as dropdown)
  const categoryEntries = Object.entries(workerRegistry).filter(([key, node]) => node.category === worker.category)
  const index = categoryEntries.findIndex(([key, _]) => key === workerType)
  
  const backgroundColors = [
    'bg-purple-100', // Light purple
    'bg-orange-100', // Light orange
    'bg-pink-100',   // Light pink
    'bg-blue-100',   // Light blue
    'bg-green-100',  // Light green
    'bg-red-100',    // Light red
    'bg-indigo-100', // Light indigo
    'bg-teal-100',   // Light teal
    'bg-yellow-100', // Light yellow
    'bg-cyan-100',   // Light cyan
    'bg-emerald-100', // Light emerald
    'bg-violet-100', // Light violet
  ]
  return backgroundColors[index % backgroundColors.length]
}

// Function to generate header text colors based on worker type
const getHeaderTextColor = (workerType: string) => {
  const worker = workerRegistry[workerType]
  if (!worker) return 'text-blue-600' // Default fallback
  
  // Find the index of this worker in its category (same logic as dropdown)
  const categoryEntries = Object.entries(workerRegistry).filter(([key, node]) => node.category === worker.category)
  const index = categoryEntries.findIndex(([key, _]) => key === workerType)
  
  const textColors = [
    'text-purple-600', // Purple
    'text-orange-600', // Orange
    'text-pink-600',   // Pink
    'text-blue-600',   // Blue
    'text-green-600',  // Green
    'text-red-600',    // Red
    'text-indigo-600', // Indigo
    'text-teal-600',   // Teal
    'text-yellow-600', // Yellow
    'text-cyan-600',   // Cyan
    'text-emerald-600', // Emerald
    'text-violet-600', // Violet
  ]
  return textColors[index % textColors.length]
}

interface Props {
  registry?: WorkerRegistryItem
  worker?: AIWorker
}

export const NodeTitle = memo((props: Props & React.ComponentProps<"div">) => {

  const { worker } = useWorkerContext()
  const { agent } = app
  const { deleteElements } = useReactFlow()

  // Get dynamic colors based on worker type
  const headerBgColor = getHeaderBackgroundColor(worker.config.type)
  const headerTextColor = getHeaderTextColor(worker.config.type)
  
  // Debug logging
  console.log(`Worker type: ${worker.config.type}, Category: ${worker.registry.category}, Background: ${headerBgColor}, Text: ${headerTextColor}`)
  
  // Additional debugging for Search specifically
  if (worker.config.type === 'search') {
    const categoryEntries = Object.entries(workerRegistry).filter(([key, node]) => node.category === worker.registry.category)
    const index = categoryEntries.findIndex(([key, _]) => key === worker.config.type)
    console.log(`Search worker - Category: ${worker.registry.category}, Index in category: ${index}, Total in category: ${categoryEntries.length}`)
  }

  // Force agent update to trigger re-render
  React.useEffect(() => {
    agent.update()
  }, [headerBgColor, headerTextColor])

  let Icon: any = worker.registry.icon ? <worker.registry.icon size={24} className={`mr-2 mt-[2px] ${headerTextColor}`} /> : <Settings size={24} className={`mr-2 mt-[2px] ${headerTextColor}`} />
  const handleDelete = () => deleteElements({ nodes: [{ id: worker?.config.id }] })
  const { currentWorker } = agent

  function onAddCondition() {
    worker.addHandler({ name: `condition_${worker.createHandlerId()}`, type: "unknown", title: "Condition", direction: "input", system: true, condition: true })
    agent.update()
  }

  if (currentWorker && currentWorker.id === worker.id) {
    Icon = <LoaderCircle size={24} className={`animate-spin mr-2 mt-[2px] ${headerTextColor}`} />
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
  return <div 
    key={`${worker.config.type}-${headerBgColor}-${headerTextColor}-${Date.now()}`}
    className={`w-full p-1 pl-4 mb-1 ${headerBgColor} text-sm ${headerTextColor} flex items-center border-b-gray-200 border-b relative group`}
  >
    {Icon}
    <div className={`flex-grow ${headerTextColor} text-xl font-dm-mono`}>{worker?.registry.title ?? "Title"}</div>
    <DropdownMenu>
      <DropdownMenuTrigger asChild className="cursor-pointer">
        <EllipsisVertical size={24} className={`mt-[2px] ${headerTextColor}`} />
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


