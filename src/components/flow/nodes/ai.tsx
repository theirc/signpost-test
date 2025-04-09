import { Input, InputTextArea, Row, Select, Slider, useForm } from '@/components/forms'
import { workerRegistry } from '@/lib/agents/registry'
import { createModel } from '@/lib/data/model'
import { NodeProps, useNodeConnections } from '@xyflow/react'
import { Sparkles } from "lucide-react"
import { InlineHandles, WorkerLabeledHandle } from '../handles'
import { useWorker } from '../hooks'
import { MemoizedWorker } from '../memoizedworkers'
import { NodeLayout } from './node'
import { AllAIModels, OpenAIModels } from '@/lib/agents/modellist'
import { ConditionHandler } from '../condition'
const { ai } = workerRegistry

ai.icon = Sparkles


const model = createModel({
  fields: {
    prompt: { title: "Prompt", type: "string", },
    model: { title: "Model", type: "string", list: AllAIModels },
    temperature: { title: "Temperature", type: "number" },
  }
})

function Parameters({ worker }: { worker: BotWorker }) {

  const { form, m, watch } = useForm(model, {
    values: {
      prompt: worker.fields.prompt.value,
      temperature: worker.parameters.temperature,
      model: worker.parameters.model,
    }
  })

  watch((value, { name }) => {
    if (name === "prompt") worker.fields.prompt.value = value.prompt
    if (name === "temperature") worker.parameters.temperature = value.temperature
    if (name === "model") worker.parameters.model = value.model
  })

  return <form.context>
    <div className='px-2 nodrag w-full flex-grow flex flex-col'>
      <Row className='flex-grow'>
        <InputTextArea field={m.prompt} span={12} hideLabel className='min-h-10 h-full resize-none' />
      </Row>
      <Row className='py-4'>
        <Select field={m.model} span={12} />
      </Row>
      <Row className='py-4'>
        <Input field={m.temperature} type="number" span={12} />
      </Row>
    </div>
  </form.context>

}

export function AINode(props: NodeProps) {
  const worker = useWorker<BotWorker>(props.id)



  return <NodeLayout worker={worker} resizable minHeight={340} className='flex flex-col' >

    <div className='flex flex-col h-full'>
      <InlineHandles>
        <WorkerLabeledHandle handler={worker.fields.input} />
        <WorkerLabeledHandle handler={worker.fields.answer} />
      </InlineHandles>
      <WorkerLabeledHandle handler={worker.fields.documents} />
      <WorkerLabeledHandle handler={worker.fields.prompt} />
      <MemoizedWorker worker={worker} name="parameters">
        <Parameters worker={worker} />
      </MemoizedWorker>
      <ConditionHandler />
    </div>
  </NodeLayout>

}
