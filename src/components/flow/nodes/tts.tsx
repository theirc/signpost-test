import { workerRegistry } from '@/lib/agents/registry'
import { NodeProps } from '@xyflow/react'
import { Speech } from "lucide-react"
import { InlineHandles, WorkerLabeledHandle } from '../handles'
import { useWorker } from '../hooks'
import { NodeLayout } from './node'
const { tts } = workerRegistry

export function TTSNode(props: NodeProps) {
  const worker = useWorker(props.id) as TTSWorker

  return <NodeLayout worker={worker}>
    <InlineHandles>
      <WorkerLabeledHandle handler={worker.fields.input} />
      <WorkerLabeledHandle handler={worker.fields.output} />
    </InlineHandles>
  </NodeLayout >
}

tts.icon = Speech

