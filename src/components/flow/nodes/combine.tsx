import { workerRegistry } from '@/lib/agents/registry'
import { NodeProps } from '@xyflow/react'
import { Combine, CreditCard, GitFork, Keyboard, MousePointerClick, Settings, User } from "lucide-react"
import { NodeHandlers, WorkerLabeledHandle } from '../handles'
import { useWorker } from '../hooks'
import { NodeLayout } from './node'
import { DropdownMenu, DropdownMenuItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuTrigger, DropdownMenuGroup } from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select'
const { combine } = workerRegistry

export function CombineNode(props: NodeProps) {
  const worker = useWorker(props.id) as CombineWorker

  function onSelected(e) {
    worker.parameters.mode = e
    console.log(worker)
  }

  return <NodeLayout worker={worker}>
    <WorkerLabeledHandle handler={worker.fields.input1} />
    <WorkerLabeledHandle handler={worker.fields.input2} />

    <NodeHandlers worker={worker} />
    <WorkerLabeledHandle handler={worker.fields.result} />

    <div className='w-full flex'>
      <Select onValueChange={onSelected} defaultValue={worker.parameters.mode}>
        <SelectTrigger className="mx-2">
          <SelectValue placeholder="Select action" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="nonempty">Select non Enpty</SelectItem>
          <SelectItem value="concat">Concatenate</SelectItem>
        </SelectContent>
      </Select>
    </div>
  </NodeLayout >
}

combine.icon = Combine

