import { NodeHandlers } from "@/components/flow/handles"
import { Input, Modal, Row, Select, useForm } from "@/components/forms"
import { workerRegistry } from "@/lib/agents/registry"
import { NodeProps, useUpdateNodeInternals } from '@xyflow/react'
import { Cable } from "lucide-react"
import { NodeTitle } from '../title'
import { AddFields } from "../addfields"
import { useWorker } from "../hooks"
import { NodeLayout } from './node'
import { model } from "@/components/data/addfieldsmodels"
const { request } = workerRegistry


export function RequestNode(props: NodeProps) {
  const worker = useWorker(props.id)

  const updateNodeInternals = useUpdateNodeInternals()
  const { form } = useForm(model)
  const m = model.fields

  form.onSubmit = data => {
    if (!data.name || !data.title || !data.type) return
    worker.addHandler({
      direction: "output",
      type: data.type as any,
      title: data.title,
      name: data.name,
    })
    updateNodeInternals(props.id)
  }

  return <NodeLayout>
    <NodeTitle registry={request} worker={worker} />
    <NodeHandlers worker={worker} />

    <AddFields onClick={form.modal.show} />
    <Modal form={form} title="Add Field">
      <Row>
        <Input span={12} field={m.name} required />
        <Input span={12} field={m.title} required />
        <Select span={12} field={m.type} placeholder="Select Type" required />
      </Row>
    </Modal>

  </NodeLayout >
}

request.icon = Cable

