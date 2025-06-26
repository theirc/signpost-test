import { InlineHandles, NodeHandlers, WorkerLabeledHandle } from "@/components/flow/handles"
import { Input, InputTextArea, Row, Select, useForm } from "@/components/forms"
import { workerRegistry } from "@/lib/agents/registry"
import { createModel } from "@/lib/data/model"
import { NodeProps } from '@xyflow/react'
import { ArrowRightLeft } from "lucide-react"
import { useWorker } from "../hooks"
import { MemoizedWorker } from "../memoizedworkers"
import { NodeLayout } from './node'
import { AllAIModels } from '@/lib/agents/modellist'
const { handoffAgent } = workerRegistry
handoffAgent.icon = ArrowRightLeft

const model = createModel({
  fields: {
    instructions: { title: "Instructions", type: "string", },
    handoffInstructions: { title: "Handoff Description", type: "string", },
    model: { title: "Model", type: "string", list: AllAIModels },
  }
})

function Parameters({ worker }: { worker: HandoffAgentWorker }) {

  const { form, m, watch } = useForm(model, {
    values: {
      instructions: worker.fields.instructions.default,
      model: worker.parameters.model,
    }
  })

  watch((value, { name }) => {
    if (name === "instructions") worker.fields.instructions.default = value.instructions
    if (name === "model") worker.parameters.model = value.model
  })

  return <form.context>
    <div className='px-2 nodrag w-full flex-grow flex flex-col'>
      <Row className='flex-grow'>
        <InputTextArea field={m.instructions} span={12} hideLabel className='min-h-10 h-full resize-none' />
      </Row>
      <Row className='py-2'>
        <Select field={m.model} span={12} />
      </Row>
    </div>
  </form.context>

}

function HandOffParameters({ worker }: { worker: HandoffAgentWorker }) {

  const { form, m, watch } = useForm(model, {
    values: {
      handoffInstructions: worker.parameters.handoffDescription,
    }
  })

  watch((value, { name }) => {
    if (name === "handoffInstructions") worker.parameters.handoffDescription = value.handoffInstructions
  })

  return <form.context>
    <div className='px-2 pt-2 nodrag w-full'>
      <Row className='flex-grow'>
        <Input field={m.handoffInstructions} span={12} />
      </Row>
    </div>
  </form.context>

}


export function HandoffAgentNode(props: NodeProps) {

  const worker = useWorker<HandoffAgentWorker>(props.id)

  return <NodeLayout worker={worker} resizable className="flex flex-col h-full" minHeight={300} minWidth={350}>
    <InlineHandles>
      <WorkerLabeledHandle handler={worker.fields.handoff} />
      <WorkerLabeledHandle handler={worker.fields.tool} />
    </InlineHandles>
    <WorkerLabeledHandle handler={worker.fields.instructions} />
    <MemoizedWorker worker={worker}><Parameters worker={worker} /></MemoizedWorker>
    <MemoizedWorker worker={worker}><HandOffParameters worker={worker} /></MemoizedWorker>
    <NodeHandlers worker={worker} />
  </NodeLayout>

}
