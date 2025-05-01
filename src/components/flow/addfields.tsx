import { app } from "@/lib/app"
import { useUpdateNodeInternals } from "@xyflow/react"
import { model } from "../data/addfieldsmodels"
import { Col, Input, InputTextArea, Modal, Row, Select, Tags, useForm } from "../forms"
import { DeleteButton, SubmitButton } from "../forms/submitbutton"
import { useWorkerContext } from "./hooks"
import { MultiSelect } from "../ui/multi-select"
import { Tag, TagInput } from 'emblor'
import { useRef, useState } from "react"

export function AddFields(props: React.HtmlHTMLAttributes<HTMLDivElement>) {
  return <div className="w-full px-1 pt-2 -mb-2 flex justify-center" onClick={props.onClick}>
    <div className="text-xs cursor-pointer hover:text-blue-600 hover:font-bold" >+ Add Field</div>
  </div>
}

interface Props {
  includePrompt?: boolean
  direction: "input" | "output"
  ignoreTypes?: IOTypes[]
}

export function AddFieldsForm({ direction, includePrompt, ignoreTypes }: Props) {

  const ctx = useWorkerContext()
  const { worker } = ctx
  const { agent } = app
  const updateNodeInternals = useUpdateNodeInternals()
  const [handleType, setHandleType] = useState<IOTypes>("unknown")
  const { form, m, form: { methods: { watch } } } = useForm(model)


  watch((value, { name }) => {
    if (name === "type") {
      setHandleType(value.type as IOTypes)
      // console.log("Watch Type changed: ", value.type)
    }
  })

  ctx.onEdit = handle => {
    console.log("Editing: ", handle)
    form.edit(handle)
  }

  form.onSubmit = data => {
    const h: NodeIO = {
      name: data.name,
      type: data.type as any,
      direction,
      prompt: includePrompt ? data.prompt : undefined,
      enum: data.enum,
    }
    if (data.id) {
      worker.updateHandler(data.id, h)
    } else {
      worker.addHandler(h)
    }
    updateNodeInternals(worker.id)
    agent.updateWorkers()
    agent.update()
    form.reset()
  }

  function onDelete() {
    const id = form.methods.getValues()["id"]
    if (!id) return
    console.log("Deleting: ", id)
    worker.deleteHandler(id)
    form.modal.hide()
    updateNodeInternals(worker.id)
    agent.updateWorkers()
    agent.update()
  }

  function onAddFieldClick() {
    worker.updateWorker()
    form.modal.show()
  }

  let list = [...model.fields.type.list]

  if (ignoreTypes) {
    list = list.filter(t => !(ignoreTypes.includes(t.value as IOTypes)))
  }

  // console.log("type:", typeRef.current)



  return <>
    <AddFields onClick={onAddFieldClick} />

    <Modal form={form} title="Add Field">
      <Row>
        <Input span={12} field={m.name} required />
        {includePrompt && <InputTextArea rows={10} span={12} field={m.prompt} required />}
        <Select span={12} field={m.type} placeholder="Select Type" required options={list} />
        {handleType === "enum" && <Tags span={12} field={m.enum} required />}
      </Row>
      <Modal.Footer>
        {form.editing && <DeleteButton onClick={onDelete} />}
        <div className="flex-grow" />
        <SubmitButton onClick={form.submit} />
      </Modal.Footer>
    </Modal>
  </>
}

