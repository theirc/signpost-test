import { app } from "@/lib/app"
import { useUpdateNodeInternals } from "@xyflow/react"
import { model } from "../data/addfieldsmodels"
import { Input, InputTextArea, Modal, Row, Select, useForm } from "../forms"
import { DeleteButton, SubmitButton } from "../forms/submitbutton"
import { useWorkerContext } from "./hooks"


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

  // console.log("AddFieldsForm: ", worker.id, props.direction)

  const updateNodeInternals = useUpdateNodeInternals()
  const { form, m, } = useForm(model)

  ctx.onEdit = handle => {
    console.log("Editing: ", handle)
    form.edit(handle)
  }

  form.onSubmit = data => {
    const h: NodeIO = {
      name: data.name,
      type: data.type as any,
      direction: direction,
      prompt: includePrompt ? data.prompt : undefined,
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

  return <>
    <AddFields onClick={onAddFieldClick} />

    <Modal form={form} title="Add Field">
      <Row>
        <Input span={12} field={m.name} required />
        {includePrompt && <InputTextArea rows={10} span={12} field={m.prompt} required />}
        <Select span={12} field={m.type} placeholder="Select Type" required options={list} />
      </Row>
      <Modal.Footer>
        {form.editing && <DeleteButton onClick={onDelete} />}
        <div className="flex-grow" />
        <SubmitButton onClick={form.submit} />
      </Modal.Footer>
    </Modal>
  </>
}

