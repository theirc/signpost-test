import { Input, InputTextArea, Row, Select, Slider, useForm } from '@/components/forms'
import { workerRegistry } from '@/lib/agents/registry'
import { createModel } from '@/lib/data/model'
import { NodeProps } from '@xyflow/react'
import { Sparkles } from "lucide-react"
import { InlineHandles, WorkerLabeledHandle } from '../handles'
import { useWorker } from '../hooks'
import { MemoizedWorker } from '../memoizedworkers'
import { NodeLayout } from './node'
const { ai } = workerRegistry

ai.icon = Sparkles

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

function Parameters({ worker }: { worker: BotWorker }) {
  const { form, m, watch } = useForm(model, {
    values: {
      prompt: worker.fields.prompt.value,
      temperature: worker.parameters.temperature
    }
  })

  watch((value, { name }) => {
    if (name === "prompt") worker.fields.prompt.value = value.prompt
    if (name === "temperature") worker.parameters.temperature = value.temperature
  })

  return <form.context>
    <div className='p-2 -mt-2 nodrag w-full flex-grow'>
      <Row className='h-full'>
        <InputTextArea field={m.prompt} span={12} hideLabel className='h-full' />
      </Row>
    </div>
    <Row className='pb-8 px-2'>
      <Input field={m.temperature} type="number" span={12} />
    </Row>
  </form.context>

}

export function AINode(props: NodeProps) {
  const worker = useWorker<BotWorker>(props.id)

  return <NodeLayout worker={worker} resizable minHeight={250}>

    <div className='flex flex-col h-full'>
      <InlineHandles>
        <WorkerLabeledHandle handler={worker.fields.input} />
        <WorkerLabeledHandle handler={worker.fields.answer} />
      </InlineHandles>
      <WorkerLabeledHandle handler={worker.fields.prompt} />
      <MemoizedWorker worker={worker}>
        <Parameters worker={worker} />
      </MemoizedWorker>
    </div>
  </NodeLayout>

}
