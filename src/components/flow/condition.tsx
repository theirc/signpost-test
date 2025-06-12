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
  { label: "Is Empty", value: "isEmpty" },
  { label: "Is Not Empty", value: "isNotEmpty" },
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
  // useNodeConnections({ id: worker.id })
  const conditionHandlers = worker.getHandlersArray().filter((h) => h.condition && h.direction === "input")

  function onRemoveConditionalHandle(handle: NodeIO) {
    worker.deleteHandler(handle.id)
    app.agent.update()
  }

  return <div>
    {conditionHandlers.map((h) => {
      const ch = worker.getConnectedHandler(h, app.agent)
      let type = ch?.type ?? "unknown"
      h.type = type

      return <div key={h.id}>
        <WorkerLabeledHandle handler={h} onRemoveConditionalHandle={onRemoveConditionalHandle} />
        {type === "boolean" && <MemoizedWorker worker={worker}> <ConditionBoolean handle={h} /> </MemoizedWorker>}
        {(type === "string" || type === "enum") && <MemoizedWorker worker={worker}> <ConditionString handle={h} /></MemoizedWorker>}
        {type === "number" && <MemoizedWorker worker={worker}> <ConditionNumber handle={h} /> </MemoizedWorker>}
      </div>
    })}
  </div>


}


function ConditionBoolean({ handle }: { handle: NodeIO }) {

  const [on, setOn] = useState(!!handle.conditionValue1)

  function onChange(v: boolean) {
    handle.operator = "equals"
    handle.conditionValue1 = !!v
    setOn(v)
  }

  return <div className='px-2 py-2 nodrag w-full flex-grow flex flex-col'>
    <div className="flex items-center space-x-2">
      <Switch id="condition" checked={on} onCheckedChange={onChange} />
      <Label htmlFor="condition">{on ? "Is True" : "Is False"}</Label>
    </div>
  </div>

}

function ConditionString({ handle }: { handle: NodeIO }) {

  const [operator, setOperator] = useState<WorkerOperators>(handle.operator)

  const { form, m, watch } = useForm(stringModel, {
    values: {
      condition: handle.operator || "equals",
      value: handle.conditionValue1 || "",
    }
  })

  watch((value, { name }) => {
    if (name === "condition") {
      handle.operator = value.condition as WorkerOperators
      setOperator(value.condition as WorkerOperators)
    }
    if (name === "value") handle.conditionValue1 = value.value
  })

  return <form.context>
    <div className='px-2 py-2 nodrag w-full flex-grow flex flex-col'>
      <Row className='mb-2'>
        <Select field={m.condition} span={12} options={stringOperators} hideLabel />
      </Row>
      {operator != "isEmpty" && operator != "isNotEmpty" && <Input field={m.value} type="text" span={12} hideLabel placeholder="Enter text value" />}
    </div>
  </form.context>
}

function ConditionNumber({ handle }: { handle: NodeIO }) {
  const { form, m, watch } = useForm(numberModel, {
    values: {
      condition: handle.operator || "equals",
      value: handle.conditionValue1 || 0,
      value2: handle.conditionValue1 || 0,
    }
  })

  const [operator, setOperator] = useState(handle.operator || "equals")

  watch((value, { name }) => {
    if (name === "condition") {
      const op = value.condition as WorkerOperators
      handle.operator = op
      setOperator(op)
    }
    if (name === "value") {
      handle.conditionValue1 = Number(value.value)
    }
    if (name === "value2") {
      handle.conditionValue2 = Number(value.value2)
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

