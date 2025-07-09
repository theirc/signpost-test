import { InlineHandles, NodeHandlers, WorkerLabeledHandle } from "@/components/flow/handles"
import { workerRegistry } from "@/lib/agents/registry"
import { NodeProps } from '@xyflow/react'
import { MessageSquare } from "lucide-react"
import { useWorker } from "../hooks"
import { NodeLayout } from './node'
import { ConditionHandler } from "../condition"
import { MemoizedWorker } from "../memoizedworkers"
import { createModel } from "@/lib/data/model"
import { Input, InputTextArea, Row, Select, useForm } from "@/components/forms"
import { AddFieldsForm } from "../addfields"
import { Switch } from "@/components/ui/switch"
import { useState } from "react"
import { AllAIModels } from '@/lib/agents/modellist'
const { promptAgent } = workerRegistry
promptAgent.icon = MessageSquare

const model = createModel({
  fields: {
    instructions: { title: "Instructions", type: "string", },
    model: { title: "Model", type: "string", list: AllAIModels },
    history: {
      title: "Chat History",
      type: "string",
      list: [
        { value: "none", label: "None" },
        { value: "full", label: "Full" },
        { value: "sumarized", label: "Summarized" }
      ]
    },
    maxHistory: { title: "Max Items", type: "number" },
    sumarizePrompt: { title: "Summarization Prompt", type: "string" },
    sumarizationModel: { title: "Summarization Model", type: "string", list: AllAIModels },
  }
})

function Parameters({ worker }: { worker: PromptAgentWorker }) {

  console.log(worker.parameters)


  const { form, m, watch } = useForm(model, {
    values: {
      instructions: worker.fields.instructions.default,
      model: worker.parameters.model,
      history: worker.parameters.history,
      maxHistory: worker.parameters.maxHistory,
      sumarizePrompt: worker.parameters.sumarizePrompt,
      sumarizationModel: worker.parameters.sumarizationModel,
    }
  })

  const [historyValue, setHistoryValue] = useState<HistoryMode>(
    (worker.parameters.history as HistoryMode) || "none"
  )

  watch((value, { name }) => {
    if (name === "instructions") worker.fields.instructions.default = value.instructions
    if (name === "model") worker.parameters.model = value.model
    if (name === "history") {
      const historyVal = value.history as HistoryMode
      worker.parameters.history = historyVal
      setHistoryValue(historyVal)
    }
    if (name === "maxHistory") worker.parameters.maxHistory = value.maxHistory
    if (name === "sumarizePrompt") worker.parameters.sumarizePrompt = value.sumarizePrompt
    if (name === "sumarizationModel") worker.parameters.sumarizationModel = value.sumarizationModel
  })

  return <form.context>
    <div className='px-2 nodrag w-full flex-grow flex flex-col'>
      <Row className='flex-grow'>
        <InputTextArea field={m.instructions} span={12} hideLabel className='min-h-10 h-full resize-none' />
      </Row>
      <Row className='py-2'>
        <Select field={m.model} span={12} />
      </Row>
      <Row className='py-2'>
        <Select field={m.history} span={12} />
      </Row>
      {historyValue === "sumarized" && (
        <>
          <Row className='py-2'>
            <Select field={m.sumarizationModel} span={12} />
          </Row>
          <Row className='py-2'>
            <Input field={m.maxHistory} span={12} type="number" />
          </Row>
          <Row className='py-2'>
            <InputTextArea field={m.sumarizePrompt} span={12} className='min-h-20 resize-none' rows={10} />
          </Row>
        </>
      )}
    </div>
  </form.context>

}


export function PromptAgentNode(props: NodeProps) {
  const worker = useWorker<PromptAgentWorker>(props.id)

  return <NodeLayout worker={worker} resizable className="flex flex-col h-full" minHeight={300} minWidth={350}>
    <InlineHandles>
      <WorkerLabeledHandle handler={worker.fields.input} />
      <WorkerLabeledHandle handler={worker.fields.output} />
    </InlineHandles>
    <InlineHandles>
      <WorkerLabeledHandle handler={worker.fields.history} />
      <WorkerLabeledHandle handler={worker.fields.handoff} />
    </InlineHandles>
    <InlineHandles>
      <WorkerLabeledHandle handler={worker.fields.instructions} />
      <WorkerLabeledHandle handler={worker.fields.tool} />
    </InlineHandles>
    <MemoizedWorker worker={worker}><Parameters worker={worker} /></MemoizedWorker>
    <NodeHandlers worker={worker} />
    <ConditionHandler />
    <AddFieldsForm direction="output" includePrompt ignoreTypes={["references", "doc", "chat", "json", "handoff"]} />
  </NodeLayout>

}
