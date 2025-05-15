import { Input, InputTextArea, Row, Select, Slider, useForm } from '@/components/forms'
import { workerRegistry } from '@/lib/agents/registry'
import { createModel } from '@/lib/data/model'
import { NodeProps, useNodeConnections } from '@xyflow/react'
import { Languages, Sparkles } from "lucide-react"
import { InlineHandles, WorkerLabeledHandle } from '../handles'
import { useWorker } from '../hooks'
import { MemoizedWorker } from '../memoizedworkers'
import { NodeLayout } from './node'
import { AllAIModels, OpenAIModels } from '@/lib/agents/modellist'
import { ConditionHandler } from '../condition'
const { translate } = workerRegistry

translate.icon = Languages

const model = createModel({
  fields: {
    language: { title: "Language Code", type: "string", },
  }
})

function Parameters({ worker }: { worker: TranslateWorker }) {

  const { form, m, watch } = useForm(model, {
    values: {
      language: worker.fields.language.default,
    }
  })

  watch((value, { name }) => {
    if (name === "language") worker.fields.language.default = value.language
  })

  return <form.context>
    <div className='px-2 nodrag w-full flex-grow flex flex-col'>
      <Row className=''>
        <Input field={m.language} span={12} hideLabel />
      </Row>
    </div>
  </form.context>

}

export function TranslateNode(props: NodeProps) {
  const worker = useWorker<TranslateWorker>(props.id)

  return <NodeLayout worker={worker} resizable minHeight={400} className='flex flex-col' >

    <InlineHandles>
      <WorkerLabeledHandle handler={worker.fields.input} />
      <WorkerLabeledHandle handler={worker.fields.output} />
    </InlineHandles>
    <WorkerLabeledHandle handler={worker.fields.language} />
    <MemoizedWorker worker={worker} name="parameters">
      <Parameters worker={worker} />
    </MemoizedWorker>
    <ConditionHandler />
  </NodeLayout>
}
