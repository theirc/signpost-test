import { Button } from "@/components/ui/button"
import { Dialog, DialogTrigger } from "@/components/ui/dialog"
import { workerRegistry } from "@/lib/agents/registry"
import { NodeProps, useUpdateNodeInternals } from '@xyflow/react'
import { ListTree } from "lucide-react"
import { NodeHandlers } from "../handles"
import { NodeTitle } from '../title'
import { useWorker } from "../hooks"
import { NodeLayout } from './node'
import { createModel } from "@/lib/data/model"
import { z } from "zod"
import { inputOutputTypes } from "@/lib/agents/worker"
import { Input, InputTextArea, Modal, Row, Select, useForm } from "@/components/forms"
import { AddFields } from "../addfields"
import { model } from "@/components/data/addfieldsmodels"
const { schema } = workerRegistry


export function SchemaNode(props: NodeProps) {
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
    <NodeTitle registry={schema} worker={worker} />
    <NodeHandlers worker={worker} />

    <AddFields onClick={form.modal.show} />
    <Modal form={form} title="Add Field">
      <Row>
        <Input span={12} field={m.name} required />
        <Input span={12} field={m.title} required />
        <InputTextArea span={12} field={m.prompt} required />
        <Select span={12} field={m.type} placeholder="Select Type" required />
      </Row>
    </Modal>

  </NodeLayout >
}





schema.icon = ListTree
