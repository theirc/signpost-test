import { workerRegistry } from "@/lib/agents/registry"
import { NodeProps } from '@xyflow/react'
import { Database, ListTree } from "lucide-react"
import { AddFieldsForm } from "../addfields"
import { InlineHandles, NodeHandlers, WorkerLabeledHandle } from "../handles"
import { useWorker } from "../hooks"
import { NodeLayout } from './node'
import { ConditionHandler } from "../condition"
const { state } = workerRegistry

state.icon = Database

export function StateNode(props: NodeProps) {
  const worker = useWorker<StateWorker>(props.id)
  return <NodeLayout worker={worker}>
    <NodeHandlers worker={worker} />
    <AddFieldsForm direction="both" ignoreTypes={["references", "doc", "chat", "json"]} />
  </NodeLayout >
}


