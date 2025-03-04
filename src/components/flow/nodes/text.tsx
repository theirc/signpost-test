import { NodeHandlers } from "@/components/flow/handles"
import { Row, useForm } from "@/components/forms"
import { InputTextArea } from "@/components/forms/textarea"
import { workerRegistry } from "@/lib/agents/registry"
import { createModel } from "@/lib/data/model"
import { NodeProps } from '@xyflow/react'
import { Type } from "lucide-react"
import { NodeTitle } from '../title'
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

  const worker = useWorker(props.id)
  const { form } = useForm(model, { doNotReset: true })
  const m = model.fields

  form.onSubmit = data => {
    console.log(data)
  }

  return <NodeLayout resizable>
    <NodeTitle registry={text} worker={worker} />

    <div className="flex flex-col h-full pb-8">
      <div className="flex-grow nodrag p-2">
        <form.context>
          <Row className="h-full">
            <InputTextArea span={12} field={m.output} />
          </Row>
        </form.context>
      </div>
      <NodeHandlers worker={worker} />
    </div>

    {/* <div className="p-2 nodrag">
      <form.context>
        <InputTextArea field={model.fields.output} className="resize-none" />
      </form.context>
    </div> */}

    {/* <Modal form={form} title="Test">
      <Row>
        <InputTextArea span={12} field={m.output} />
      </Row>
    </Modal> */}

    {/* <Modal controller={modal} title="Test">
      <form.context>
        <Row>
          <InputTextArea span={12} field={model.fields.output} />
        </Row>
      </form.context>
      <Modal.Footer>
        <Button onClick={form.submit}>Save changes</Button>
      </Modal.Footer>
    </Modal> */}

    {/* <div className="w-full px-4 pt-4">
      <Button className="w-full" variant="outline" onClick={form.modal.show}>Add Field</Button>
    </div> */}


    {/* <NodeHandlers worker={worker} /> */}
  </NodeLayout>

}

