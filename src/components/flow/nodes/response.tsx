import { app } from '@/lib/app'
import { NodeProps, XYPosition } from '@xyflow/react'
import { Brain, Forward } from "lucide-react"
import { NodeHandlers } from '../handles'
import { useWorker } from '../hooks'
import { NodeLayout } from './node'
import { NodeTitle } from '../title'
import { workerRegistry } from '@/lib/agents/registry'
import { AddFieldsForm } from '../addfields'
const { response } = workerRegistry

response.icon = Forward

export function ResponseNode(props: NodeProps) {

  const worker = useWorker(props.id)

  return <NodeLayout worker={worker} >
    <NodeHandlers worker={worker} />
    <AddFieldsForm direction="input" ignoreTypes={["enum", "handoff"]} />
  </NodeLayout >

}
