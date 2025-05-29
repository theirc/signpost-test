import { app } from "@/lib/app"
import { createModel } from "@/lib/data/model"
import { useNodeConnections } from "@xyflow/react"
import { useState } from "react"
import { Input, Row, Select, useForm } from "../forms"
import { Label } from "../ui/label"
import { Switch } from "../ui/switch"
import { WorkerLabeledHandle } from "./handles"
import { useWorkerContext } from "./hooks"
import { MemoizedWorker } from "./memoizedworkers"

const stringOperators = [
  { label: "Equals", value: "equals" },
  { label: "Not Equals", value: "notEquals" },
  { label: "Contains", value: "contains" },
  { label: "Not Contains", value: "notContains" },
]

const numberOperators = [
  { label: "Equals", value: "equals" },
  { label: "Not Equals", value: "notEquals" },
  { label: "Greater Than", value: "gt" },
  { label: "Less Than", value: "lt" },
  { label: "Greater Than or Equal", value: "gte" },
  { label: "Less Than or Equal", value: "lte" },
  { label: "Between", value: "between" },
]

const stringModel = createModel({
  fields: {
    condition: { title: "Condition", type: "string" },
    value: { title: "Value", type: "string" },
  }
})

const numberModel = createModel({
  fields: {
    condition: { title: "Condition", type: "string" },
    value: { title: "Value", type: "number" },
    value2: { title: "Value 2", type: "number" },
  }
})

export function ConditionHandler() {

  const { worker } = useWorkerContext<AIWorker>()
  const ch = worker.getConnectedHandler(worker.fields.condition, app.agent)

  useNodeConnections({ id: worker.id })

  let type: IOTypes = "unknown"
  if (ch) type = ch.type
  worker.fields.condition.type = type

  console.log("Render Condition", type)
  return <div className="">
    <WorkerLabeledHandle handler={worker.fields.condition} />
    {type === "boolean" && <MemoizedWorker worker={worker} name="condition"> <ConditionBoolean worker={worker} /> </MemoizedWorker>}
    {type === "string" || type === "enum" && <MemoizedWorker worker={worker} name="condition">  <ConditionString worker={worker} /> </MemoizedWorker>}
    {type === "number" && <MemoizedWorker worker={worker} name="condition"> <ConditionNumber worker={worker} /> </MemoizedWorker>}
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

function ConditionString({ worker }: { worker: AIWorker }) {
  const { form, m, watch } = useForm(stringModel, {
    values: {
      condition: worker.condition?.operator || "equals",
      value: worker.condition?.value || "",
    }
  })

  watch((value, { name }) => {
    if (name === "condition") {
      worker.condition.operator = value.condition as "equals" | "notEquals" | "contains" | "notContains"
    }
    if (name === "value") {
      worker.condition.value = value.value
    }
  })

  return <form.context>
    <div className='px-2 py-2 nodrag w-full flex-grow flex flex-col'>
      <Row className='mb-2'>
        <Select field={m.condition} span={12} options={stringOperators} hideLabel />
      </Row>
      <Input field={m.value} type="text" span={12} hideLabel placeholder="Enter text value" />
    </div>
  </form.context>
}

function ConditionNumber({ worker }: { worker: AIWorker }) {
  const { form, m, watch } = useForm(numberModel, {
    values: {
      condition: worker.condition?.operator || "equals",
      value: worker.condition?.value || 0,
      value2: worker.condition?.value2 || 0,
    }
  })

  const [operator, setOperator] = useState(worker.condition?.operator || "equals")

  watch((value, { name }) => {
    if (name === "condition") {
      const op = value.condition as "equals" | "notEquals" | "gt" | "lt" | "gte" | "lte" | "between"
      worker.condition.operator = op
      setOperator(op)
    }
    if (name === "value") {
      worker.condition.value = Number(value.value)
    }
    if (name === "value2") {
      worker.condition.value2 = Number(value.value2)
    }
  })

  return <form.context>
    <div className='px-2 py-2 nodrag w-full flex-grow flex flex-col'>
      <Row className='mb-2'>
        <Select field={m.condition} span={12} options={numberOperators} hideLabel />
      </Row>
      <Input field={m.value} type="number" span={12} hideLabel placeholder="Enter number value" />
      {operator === "between" && (
        <Row className='mt-2'>
          <Input field={m.value2} type="number" span={12} hideLabel placeholder="Enter upper bound" />
        </Row>
      )}
    </div>
  </form.context>
}
