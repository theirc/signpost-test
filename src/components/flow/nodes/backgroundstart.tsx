import { NodeHandlers, WorkerHandle } from "@/components/flow/handles"
import { app } from "@/lib/app"
import { NodeProps, XYPosition } from '@xyflow/react'
import { GitFork, Split } from "lucide-react"
import { useMemo } from "react"
import { NodeLayout } from './node'
import { NodeTitle } from '../title'
import { useWorker } from "../hooks"
import { workerRegistry } from "@/lib/agents/registry"
const { background } = workerRegistry


background.icon = (props: any) => <Split {...props} className="rotate-90" />

export function BackgroundNode(props: NodeProps) {

  const worker = useWorker(props.id)

  return <NodeLayout>
    <NodeTitle registry={background} worker={worker} />
    <NodeHandlers worker={worker} />
  </NodeLayout>

}

