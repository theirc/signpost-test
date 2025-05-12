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
  const handles = Object.values(worker.handles).filter(h => !h.system)

  return <NodeLayout worker={worker}>
    <WorkerLabeledHandle handler={worker.fields.json} />
    {Array.from({ length: Math.ceil(handles.length / 2) }).map((_, index) => {
      const leftHandleIndex = index * 2
      const rightHandleIndex = index * 2 + 1
      return <InlineHandles key={`inline-handles-${index}`}>
        {handles[leftHandleIndex] && <WorkerLabeledHandle key={handles[leftHandleIndex].id} handler={handles[leftHandleIndex]} />}
        {handles[rightHandleIndex] && <WorkerLabeledHandle key={handles[rightHandleIndex].id} handler={handles[rightHandleIndex]} />}
      </InlineHandles>
    })}
    <AddFieldsForm direction="both" ignoreTypes={["references", "doc", "chat", "json"]} />
  </NodeLayout >
}
