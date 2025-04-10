import { NodeHandlers, WorkerLabeledHandle } from "@/components/flow/handles"
import { Row, useForm } from "@/components/forms"
import { InputTextArea } from "@/components/forms/textarea"
import { workerRegistry } from "@/lib/agents/registry"
import { createModel } from "@/lib/data/model"
import { NodeProps } from '@xyflow/react'
import { Type } from "lucide-react"
import { useWorker } from "../hooks"
import { NodeLayout } from './node'
import { ConditionHandler } from "../condition"
const { text } = workerRegistry

text.icon = Type

const model = createModel({
  fields: {
    output: { title: "Content", type: "string", required: true },
  }
})

export function TextNode(props: NodeProps) {

  const worker = useWorker<TextWorker>(props.id)

  const { form, watch, m } = useForm(model, { doNotReset: true, values: { output: worker.parameters.text } })

  watch((value, { name, type }) => {
    if (name === "output") worker.parameters.text = value.output
  })

  return <NodeLayout worker={worker} resizable>

    <WorkerLabeledHandle handler={worker.fields.output} />
    <div className="flex flex-col size-full pb-12 ">
      <div className="flex-grow nodrag p-2">
        <form.context>
          <Row className="h-full">
            <InputTextArea span={12} field={m.output} hideLabel className='min-h-10 h-full resize-none' />
          </Row>
        </form.context>
      </div>
      <ConditionHandler />
    </div>


  </NodeLayout>

}

