import { workerRegistry } from '@/lib/agents/registry'
import { NodeProps } from '@xyflow/react'
import { Speech } from "lucide-react"
import { InlineHandles, WorkerLabeledHandle } from '../handles'
import { useWorker } from '../hooks'
import { NodeLayout } from './node'
import { createModel } from '@/lib/data/model'
import { Row, Select, useForm } from '@/components/forms'
import { MemoizedWorker } from '../memoizedworkers'
const { stt } = workerRegistry

const list = [
  { label: "Whisper", value: "whisper-1" },
]

const model = createModel({
  fields: {
    engine: { title: "Engine", type: "string", list },
  }
})

function Parameters({ worker }: { worker: STTWorker }) {

  const { form, m, watch } = useForm(model, {
    values: {
      mode: worker.parameters.engine,
    }
  })

  watch((value, { name }) => {
    if (name === "engine") worker.parameters.engine = value.engine as any
  })

  return <form.context>
    <div className='px-2 nodrag w-full flex-grow flex flex-col'>
      <Row className='py-4'>
        <Select field={m.engine} span={12} />
      </Row>
    </div>
  </form.context>

}


export function STTNode(props: NodeProps) {
  const worker = useWorker(props.id) as STTWorker


  const { form, m, watch } = useForm(model, {
    values: {
      mode: worker.parameters.engine
    }
  })

  watch((value, { name }) => {
    if (name === "engine") worker.parameters.engine = value.engine as any
  })



  return <NodeLayout worker={worker}>
    <InlineHandles>
      <WorkerLabeledHandle handler={worker.fields.input} />
      <WorkerLabeledHandle handler={worker.fields.output} />
    </InlineHandles>

    <div className='w-full flex'>
      <MemoizedWorker worker={worker}>
        <Parameters worker={worker} />
      </MemoizedWorker>
    </div>

  </NodeLayout >
}

stt.icon = Speech

