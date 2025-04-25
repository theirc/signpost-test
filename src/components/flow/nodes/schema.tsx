import { workerRegistry } from "@/lib/agents/registry"
import { NodeProps } from '@xyflow/react'
import { ListTree } from "lucide-react"
import { AddFieldsForm } from "../addfields"
import { InlineHandles, NodeHandlers, WorkerLabeledHandle } from "../handles"
import { useWorker } from "../hooks"
import { NodeLayout } from './node'
import { ConditionHandler } from "../condition"
const { schema } = workerRegistry

schema.icon = ListTree

export function SchemaNode(props: NodeProps) {
  const worker = useWorker<SchemaWorker>(props.id)
  return <NodeLayout worker={worker}>
    <InlineHandles>
      <WorkerLabeledHandle handler={worker.fields.input} />
      <WorkerLabeledHandle handler={worker.fields.json} />
    </InlineHandles>

    <NodeHandlers worker={worker} />
    <ConditionHandler />
    <AddFieldsForm direction="output" includePrompt ignoreTypes={["references", "doc", "chat", "json"]} />
  </NodeLayout >
}


