import { InlineHandles, NodeHandlers, WorkerLabeledHandle } from "@/components/flow/handles"
import { Row, useForm } from "@/components/forms"
import { InputTextArea } from "@/components/forms/textarea"
import { workerRegistry } from "@/lib/agents/registry"
import { createModel } from "@/lib/data/model"
import { NodeProps, useNodeConnections } from '@xyflow/react'
import { Eye, FlaskConical, Type } from "lucide-react"
import { useWorker } from "../hooks"
import { NodeLayout } from './node'
import { app } from "@/lib/app"
const { mock } = workerRegistry
mock.icon = FlaskConical

const model = createModel({
  fields: {
    output: { type: "string" },
  }
})

export function MockNode(props: NodeProps) {

  const worker = useWorker<MockWorker>(props.id)
  useNodeConnections({ id: props.id })
  const { form, watch, m } = useForm(model, { doNotReset: true, values: { output: worker.fields.output.default } })

  watch((value, { name, type }) => {
    if (name === "output") worker.fields.output.default = value.output
  })

  const ch = worker.getConnectedHandler(worker.fields.input, app.agent)

  let content = <h3 className="flex justify-center font-semibold my-4 text-red-600">Connect the Input Node</h3>

  if (ch) {
    worker.fields.output.type = ch.type
    content = <div className="flex my-4 px-2 size-full pb-20 flex-col">
      <form.context>
        <Row className=" flex-grow">
          <InputTextArea span={12} field={m.output} hideLabel className='min-h-10 h-full resize-none' />
        </Row>
      </form.context>
    </div>
  } else {
    worker.fields.output.type = "unknown"
  }

  return <NodeLayout worker={worker} resizable>
    <InlineHandles>
      <WorkerLabeledHandle handler={worker.fields.input} />
      <WorkerLabeledHandle handler={worker.fields.output} />
    </InlineHandles>
    {content}
  </NodeLayout>

}

