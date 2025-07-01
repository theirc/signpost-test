import { workerRegistry } from "@/lib/agents/registry"
import { NodeProps } from '@xyflow/react'
import { FileText } from "lucide-react"
import { AddFieldsForm } from "../addfields"
import { InlineHandles, NodeHandlers, WorkerLabeledHandle } from "../handles"
import { useWorker } from "../hooks"
import { NodeLayout } from './node'
import { ConditionHandler } from "../condition"
import { createModel } from "@/lib/data/model"
import { Row, InputTextArea, useForm } from "@/components/forms"
import { MemoizedWorker } from "../memoizedworkers"
const { template } = workerRegistry

template.icon = FileText

const model = createModel({
  fields: {
    template: { title: "Template", type: "string" },
  }
})

function Parameters({ worker }: { worker: TemplateWorker }) {

  const { form, m, watch } = useForm(model, {
    values: {
      template: worker.fields.template.default || "",
    }
  })

  watch((value, { name }) => {
    if (name === "template") worker.fields.template.default = value.template || ""
  })

  return <form.context>
    <div className="p-2 flex flex-col gap-2 w-full flex-grow">
      <Row className="flex-grow w-auto flex flex-col">
        <InputTextArea field={m.template} span={12} hideLabel placeholder="Enter your template text here..." className='min-h-10 resize-none h-full' controlClassName="flex-grow" />
      </Row>
    </div>
  </form.context>

}

export function TemplateNode(props: NodeProps) {
  const worker = useWorker<TemplateWorker>(props.id)
  return <NodeLayout worker={worker} resizable className="flex flex-col h-full" minHeight={240} minWidth={350}>
    <InlineHandles>
      <WorkerLabeledHandle handler={worker.fields.template} />
      <WorkerLabeledHandle handler={worker.fields.output} />
    </InlineHandles>
    <MemoizedWorker worker={worker} name="parameters">
      <Parameters worker={worker} />
    </MemoizedWorker>
    <NodeHandlers worker={worker} />
    <ConditionHandler />
    <AddFieldsForm direction="input" ignoreTypes={["references", "doc", "chat", "json", "handoff"]} />
  </NodeLayout >
}
