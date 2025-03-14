import { workerRegistry } from "@/lib/agents/registry"
import { useUpdateNodeInternals } from "@xyflow/react"
import { Input, InputTextArea, Modal, Row, Select, useForm } from "../forms"
import { model } from "../data/addfieldsmodels"
import { useWorkerContext } from "./hooks"
import { DeleteButton, SubmitButton } from "../forms/submitbutton"
import { MemoizedWorker } from "./memoizedworkers"
import { useForceUpdate } from "@/lib/utils"

export function AddFields(props: React.HtmlHTMLAttributes<HTMLDivElement>) {
  return <div className="w-full px-1 pt-2 -mb-2 flex justify-center" onClick={props.onClick}>
    <div className="text-xs cursor-pointer hover:text-blue-600 hover:font-bold" >+ Add Field</div>
  </div>
}



export function AddFieldsForm(props: { includePrompt?: boolean, direction: "input" | "output" }) {

  const ctx = useWorkerContext()
  const { worker } = ctx


  const updateNodeInternals = useUpdateNodeInternals()
  const { form, m, } = useForm(model)

  ctx.onEdit = handle => {
    console.log("Editing: ", handle)
    form.edit(handle)
  }

  form.onSubmit = data => {
    if (data.id) {
      worker.updateHandler(data.id, {
        name: data.name,
        type: data.type as any
      })
    } else {
      worker.addHandler({
        direction: props.direction,
        type: data.type as any,
        name: data.name,
      })
    }
    worker.updateWorker()
    updateNodeInternals(worker.id)
    form.reset()
  }

  function onDelete() {
    const id = form.methods.getValues()["id"]
    if (!id) return
    console.log("Deleting: ", id)
    worker.deleteHandler(id)
    form.modal.hide()
    updateNodeInternals(worker.id)
  }

  function onAddFieldClick() {
    worker.updateWorker()
    form.modal.show()
  }

  return <>
    <AddFields onClick={onAddFieldClick} />

    <Modal form={form} title="Add Field">
      <Row>
        <Input span={12} field={m.name} required />
        {props.includePrompt && <InputTextArea span={12} field={m.prompt} required />}
        <Select span={12} field={m.type} placeholder="Select Type" required />
      </Row>
      <Modal.Footer>
        {form.editing && <DeleteButton onClick={onDelete} />}
        <div className="flex-grow" />
        <SubmitButton onClick={form.submit} />
      </Modal.Footer>
    </Modal>
  </>
}

