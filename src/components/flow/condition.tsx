import { createModel } from "@/lib/data/model"
import { Input, Row, Select, useForm } from "../forms"
import { cond } from "lodash"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion"
import { useNodeConnections } from "@xyflow/react"
import { useWorker, useWorkerContext } from "./hooks"
import { WorkerLabeledHandle } from "./handles"
import { MemoizedWorker } from "./memoizedworkers"
import { Switch } from "../ui/switch"
import { Label } from "../ui/label"
import { useState } from "react"
import { app } from "@/lib/app"

const list = [
  { label: "Equals", value: "equals" },
  { label: "Not Equals", value: "notEquals" },
]

const model = createModel({
  fields: {
    condition: { title: "Condition", type: "string", },
    value: { title: "Value", type: "string" },
  }
})

export function ConditionHandler() {

  const { worker } = useWorkerContext<AIWorker>()
  const ch = worker.getConnectedHandler(worker.fields.condition, app.agent)
  useNodeConnections({ id: worker.id })
  let type: IOTypes = "unknown"
  if (ch) type = ch.type
  worker.fields.condition.type = type

  // console.log("Render Condition")
  return <div className="">
    <WorkerLabeledHandle handler={worker.fields.condition} />
    <MemoizedWorker worker={worker} name="condition">
      {type == "boolean" && <ConditionBoolean worker={worker} />}
    </MemoizedWorker>
  </div>
}


function ConditionBoolean({ worker }: { worker: AIWorker }) {

  const [on, setOn] = useState(!!worker.condition.value)

  function onChange(v: boolean) {
    worker.condition.operator = "equals"
    worker.condition.value = !!v
    setOn(v)
  }


  return <div className='px-2 py-2 nodrag w-full flex-grow flex flex-col'>
    <div className="flex items-center space-x-2">
      <Switch id="condition" checked={on} onCheckedChange={onChange} />
      <Label htmlFor="condition">{on ? "Is True" : "Is False"}</Label>
    </div>
  </div>

}

function ConditionString() {

  //ToDo:

  console.log("Render Condition String")

  const { form, m, watch } = useForm(model, {
    values: {
      condition: "equals",
    }
  })

  return <form.context>
    <div className='px-2 nodrag w-full flex-grow flex flex-col'>
      <Row className=''>
        <Select field={m.condition} span={12} options={list} hideLabel />
      </Row>
      <Row className='pt-1'>
        <Input field={m.value} type="number" span={12} hideLabel />
      </Row>
    </div>
  </form.context>


}