import { workerRegistry } from "@/lib/agents/registry"
import { NodeProps } from '@xyflow/react'
import { Database, ListTree } from "lucide-react"
import { AddFieldsForm } from "../addfields"
import { InlineHandles, NodeHandlers, WorkerLabeledHandle } from "../handles"
import { useWorker } from "../hooks"
import { NodeLayout } from './node'
import { ConditionHandler } from "../condition"
import { app } from "@/lib/app"
const { state } = workerRegistry

state.icon = Database

export function StateNode(props: NodeProps) {
  const worker = useWorker<StateWorker>(props.id)

  const ch = worker.getConnectedHandler(worker.fields.input, app.agent)
  worker.fields.output.type = ch?.type ?? "unknown"

  return <NodeLayout worker={worker}>
    <InlineHandles>
      <WorkerLabeledHandle handler={worker.fields.input} />
      <WorkerLabeledHandle handler={worker.fields.output} />
    </InlineHandles>
  </NodeLayout >
}
