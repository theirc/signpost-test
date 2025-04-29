import { Input, InputTextArea, Row, Select, Slider, useForm } from '@/components/forms'
import { workerRegistry } from '@/lib/agents/registry'
import { createModel } from '@/lib/data/model'
import { NodeProps, useNodeConnections } from '@xyflow/react'
import { MousePointerClick, Sparkles } from "lucide-react"
import { InlineHandles, WorkerLabeledHandle } from '../handles'
import { useWorker } from '../hooks'
import { MemoizedWorker } from '../memoizedworkers'
import { NodeLayout } from './node'
import { AllAIModels, OpenAIModels } from '@/lib/agents/modellist'
import { ConditionHandler } from '../condition'
const { documentSelector } = workerRegistry

documentSelector.icon = MousePointerClick

const model = createModel({
  fields: {
    prompt: { title: "Prompt", type: "string", },
    results: { title: "Results", type: "string", },
  }
})

function Parameters({ worker }: { worker: DocumentSelectorWorker }) {

  const { form, m, watch } = useForm(model, {
    values: {
      prompt: worker.fields.prompt.default,
      results: worker.parameters.results || 8,
    }
  })

  watch((value, { name }) => {
    if (name === "prompt") worker.fields.prompt.default = value.prompt
  })

  return <form.context>
    <div className='px-2 nodrag w-full flex-grow flex flex-col'>
      <Row className='flex-grow'>
        <InputTextArea field={m.prompt} rows={10} span={12} hideLabel className='min-h-10 h-full resize-none' />
      </Row>
      <Row className='flex-grow pt-2'>
        <Input field={m.results} span={12} className='h-full max-h-8 resize-none' />
      </Row>
    </div>
  </form.context>

}

export function DocumentSelectorNode(props: NodeProps) {
  const worker = useWorker<DocumentSelectorWorker>(props.id)

  return <NodeLayout worker={worker} resizable minHeight={450} className='flex flex-col' >

    <InlineHandles>
      <WorkerLabeledHandle handler={worker.fields.documents} />
      <WorkerLabeledHandle handler={worker.fields.output} />
    </InlineHandles>
    <WorkerLabeledHandle handler={worker.fields.input} />
    <WorkerLabeledHandle handler={worker.fields.prompt} />
    <MemoizedWorker worker={worker} name="parameters">
      <Parameters worker={worker} />
    </MemoizedWorker>
    <ConditionHandler />
  </NodeLayout>
}
