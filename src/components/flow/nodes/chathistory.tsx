import { InlineHandles, NodeHandlers, WorkerLabeledHandle } from "@/components/flow/handles"
import { workerRegistry } from "@/lib/agents/registry"
import { NodeProps } from '@xyflow/react'
import { History } from "lucide-react"
import { useWorker } from "../hooks"
import { NodeLayout } from './node'
import { ConditionHandler } from "../condition"
import { MemoizedWorker } from "../memoizedworkers"
import { createModel } from "@/lib/data/model"
import { Input, InputTextArea, Row, Select, useForm } from "@/components/forms"
import { AddFieldsForm } from "../addfields"
import { useState } from "react"
import { AllAIModels } from '@/lib/agents/modellist'

const { chatHistory } = workerRegistry
chatHistory.icon = History

const model = createModel({
  fields: {
    history: { title: "Chat History", type: "string", list: [{ value: "full", label: "Full" }, { value: "sumarized", label: "Summarized" }] },
    keepLatest: { title: "Keep Latest", type: "number" },
    sumarizeWhen: { title: "Summarize When Reach", type: "number" },
    sumarizePrompt: { title: "Summarization Prompt", type: "string" },
    sumarizationModel: { title: "Summarization Model", type: "string", list: AllAIModels },
  }
})

function Parameters({ worker }: { worker: ChatHistoryWorker }) {

  const { form, m, watch } = useForm(model, {
    values: {
      history: worker.parameters.history,
      keepLatest: worker.parameters.keepLatest,
      sumarizeWhen: worker.parameters.sumarizeWhen,
      sumarizePrompt: worker.parameters.sumarizePrompt,
      sumarizationModel: worker.parameters.sumarizationModel,
    }
  })

  const [historyValue, setHistoryValue] = useState<HistoryMode>(
    (worker.parameters.history as HistoryMode) || "none"
  )

  watch((value, { name }) => {
    if (name === "history") {
      const historyVal = value.history as HistoryMode
      worker.parameters.history = historyVal
      setHistoryValue(historyVal)
    }
    if (name === "keepLatest") worker.parameters.keepLatest = value.keepLatest
    if (name === "sumarizeWhen") worker.parameters.sumarizeWhen = value.sumarizeWhen
    if (name === "sumarizePrompt") worker.parameters.sumarizePrompt = value.sumarizePrompt
    if (name === "sumarizationModel") worker.parameters.sumarizationModel = value.sumarizationModel
  })

  return <form.context>
    <div className='px-2 nodrag w-full flex-grow flex flex-col gap-2'>
      <Row>
        <Select field={m.history} span={12} />
      </Row>
      {historyValue === "sumarized" && (
        <>
          <Row>
            <Select field={m.sumarizationModel} span={12} />
          </Row>
          <Row>
            <Input field={m.keepLatest} span={12} type="number" />
          </Row>
          <Row>
            <Input field={m.sumarizeWhen} span={12} type="number" />
          </Row>
          <Row className='flex-grow'>
            <InputTextArea field={m.sumarizePrompt} span={12} hideLabel className='min-h-10 h-full resize-none' />
          </Row>
        </>
      )}
    </div>
  </form.context>

}

export function ChatHistoryNode(props: NodeProps) {
  const worker = useWorker<ChatHistoryWorker>(props.id)

  return <NodeLayout worker={worker} resizable className="flex flex-col h-full" minHeight={200} minWidth={300}>
    <WorkerLabeledHandle handler={worker.fields.output} />
    <MemoizedWorker worker={worker}><Parameters worker={worker} /></MemoizedWorker>
    <NodeHandlers worker={worker} />
    <ConditionHandler />
  </NodeLayout>
}
