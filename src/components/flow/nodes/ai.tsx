import { workerRegistry } from '@/lib/agents/registry'
import { NodeProps, Position } from '@xyflow/react'
import { Brain } from "lucide-react"
import { NodeHandlers, WorkerHandle } from '../handles'
import { useWorker } from '../hooks'
import { NodeTitle } from '../title'
import { NodeLayout } from './node'
import { createModel } from '@/lib/data/model'
import { InputTextArea, Row, Select, Slider, useForm } from '@/components/forms'
import { memo, useRef } from 'react'
import { MemoizedWorker } from '../memoizedworkers'
const { ai } = workerRegistry

ai.icon = Brain

const list: FieldList = [
  { value: "openai", label: "OpenAI" },
]

const model = createModel({
  fields: {
    prompt: { title: "Prompt", type: "string", },
    model: { title: "Model", type: "string", list },
    temperature: { title: "Temperature", type: "number" },
  }
})



function Content({ worker }: { worker: BotWorker }) {

  const { form, m } = useForm(model)

  form.onSubmit = data => {
    console.log(data)
  }

  return <div className='p-2 nodrag w-full'>
    <form.context>
      <Row>
        <Select field={m.model} span={12} />
        <Slider field={m.temperature} defaultValue={[50]} max={100} step={1} span={12} />
      </Row>
    </form.context>
  </div>

}



export function AINode(props: NodeProps) {
  const worker = useWorker<BotWorker>(props.id)
  return <NodeLayout>
    <NodeTitle registry={ai} worker={worker} />
    <MemoizedWorker worker={worker}>
      <Content worker={worker} />
    </MemoizedWorker>
    <NodeHandlers worker={worker} />
  </NodeLayout>
}
