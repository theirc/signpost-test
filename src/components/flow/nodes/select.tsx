import { workerRegistry } from '@/lib/agents/registry'
import { NodeProps } from '@xyflow/react'
import { GitFork, MousePointerClick } from "lucide-react"
import { NodeHandlers } from '../handles'
import { useWorker } from '../hooks'
import { NodeLayout } from './node'
import { NodeTitle } from '../title'
const { select } = workerRegistry

export function SelecthNode(props: NodeProps) {
  const worker = useWorker(props.id)
  return <NodeLayout>
    <NodeTitle registry={select} worker={worker} />
    <NodeHandlers worker={worker} />
  </NodeLayout >
}

select.icon = MousePointerClick

