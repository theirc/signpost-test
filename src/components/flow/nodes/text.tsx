import { NodeHandlers, WorkerLabeledHandle } from "@/components/flow/handles"
import { Row, useForm } from "@/components/forms"
import { InputTextArea } from "@/components/forms/textarea"
import { workerRegistry } from "@/lib/agents/registry"
import { createModel } from "@/lib/data/model"
import { NodeProps } from '@xyflow/react'
import { Type } from "lucide-react"
import { useWorker } from "../hooks"
import { NodeLayout } from './node'
const { text } = workerRegistry

text.icon = Type

const model = createModel({
  fields: {
    output: { title: "Content", type: "string", required: true },
  }
})

export function TextNode(props: NodeProps) {

  const worker = useWorker<TextWorker>(props.id)

  const { form, watch, m } = useForm(model, { doNotReset: true, values: { output: worker.fields.output.value } })

  watch((value, { name, type }) => {
    if (name === "output") worker.fields.output.value = value.output
  })

  return <NodeLayout worker={worker} resizable>

    <div className="flex flex-col h-full pb-4">
      <WorkerLabeledHandle handler={worker.fields.output} />
      <div className="flex-grow nodrag p-2">
        <form.context>
          <Row className="h-full">
            <InputTextArea span={12} field={m.output} hideLabel />
          </Row>
        </form.context>
      </div>
    </div>


  </NodeLayout>

}

