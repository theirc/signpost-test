import { workerRegistry } from "@/lib/agents/registry"
import { NodeProps } from '@xyflow/react'
import { ListTree } from "lucide-react"
import { AddFieldsForm } from "../addfields"
import { NodeHandlers, WorkerLabeledHandle } from "../handles"
import { useWorker } from "../hooks"
import { NodeLayout } from './node'
import { ConditionHandler } from "../condition"
const { schema } = workerRegistry

schema.icon = ListTree

export function SchemaNode(props: NodeProps) {
  const worker = useWorker(props.id)
  return <NodeLayout worker={worker}>
    <WorkerLabeledHandle handler={worker.fields.input} />
    <NodeHandlers worker={worker} />
    <ConditionHandler />
    <AddFieldsForm direction="output" includePrompt />
  </NodeLayout >
}


