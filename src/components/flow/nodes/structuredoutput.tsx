import { workerRegistry } from "@/lib/agents/registry"
import { NodeProps } from '@xyflow/react'
import { ListTree } from "lucide-react"
import { AddFieldsForm } from "../addfields"
import { InlineHandles, NodeHandlers, WorkerLabeledHandle } from "../handles"
import { useWorker } from "../hooks"
import { NodeLayout } from './node'
import { ConditionHandler } from "../condition"
import { createModel } from "@/lib/data/model"
import { AllAIModels, OpenAIModels } from "@/lib/agents/modellist"
import { InputTextArea, Row, Select, useForm } from "@/components/forms"
import { MemoizedWorker } from "../memoizedworkers"
const { structured } = workerRegistry

structured.icon = ListTree



const model = createModel({
  fields: {
    instructions: { title: "Instructions", type: "string", },
    model: { title: "Model", type: "string", list: AllAIModels },
  }
})


function Parameters({ worker }: { worker: StructuredOutputWorker }) {

  const { form, m, watch } = useForm(model, {
    values: {
      instructions: worker.parameters.instructions,
      model: worker.parameters.model || "openai/gpt-4o",
    }
  })

  watch((value, { name }) => {
    if (name === "instructions") worker.parameters.instructions = value.instructions
    if (name === "model") worker.parameters.model = value.model || "openai/gpt-4o"
  })

  return <form.context>
    <div className='px-2 nodrag w-full flex-grow flex flex-col'>
      <Row className='py-2'>
        <Select field={m.model} span={12} />
      </Row>
      <Row className='flex-grow'>
        <InputTextArea field={m.instructions} span={12} className='min-h-10 h-full resize-none' />
      </Row>
    </div>
  </form.context>

}


export function StructuredOutputNode(props: NodeProps) {
  const worker = useWorker<StructuredOutputWorker>(props.id)
  return <NodeLayout worker={worker} resizable className="flex flex-col h-full" minHeight={300} minWidth={350}>
    <InlineHandles>
      <WorkerLabeledHandle handler={worker.fields.input} />
      <WorkerLabeledHandle handler={worker.fields.JSON} />
    </InlineHandles>
    <WorkerLabeledHandle handler={worker.fields.history} />

    <NodeHandlers worker={worker} />
    <MemoizedWorker worker={worker} name="parameters">
      <Parameters worker={worker} />
    </MemoizedWorker>
    <ConditionHandler />
    <AddFieldsForm direction="output" includePrompt ignoreTypes={["references", "doc", "chat", "json", "handoff"]} />
  </NodeLayout>
}
