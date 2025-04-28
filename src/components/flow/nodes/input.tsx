import { NodeHandlers, WorkerLabeledHandle } from "@/components/flow/handles"
import { workerRegistry } from "@/lib/agents/registry"
import { NodeProps } from '@xyflow/react'
import { Cable } from "lucide-react"
import { AddFieldsForm } from "../addfields"
import { useWorker } from "../hooks"
import { NodeLayout } from './node'
const { request } = workerRegistry
request.icon = Cable

export function RequestNode(props: NodeProps) {
  const worker = useWorker(props.id)
  return <NodeLayout worker={worker}>
    <NodeHandlers worker={worker} />
    <AddFieldsForm direction="output" ignoreTypes={["references"]} />
  </NodeLayout >
}





