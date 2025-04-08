import { createModel } from "@/lib/data/model"
import { Input, Row, Select, useForm } from "../forms"
import { cond } from "lodash"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion"

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

  const { form, m, watch } = useForm(model, {
    values: {
      condition: "equals",
    }
  })


  return <div>
    <form.context>
      <div className='px-2 nodrag w-full flex-grow flex flex-col'>
        <Row className=''>
          <Select field={m.condition} span={12} options={list} hideLabel />
        </Row>
        <Row className='pt-1'>
          <Input field={m.value} type="number" span={12} hideLabel />
        </Row>
      </div>
    </form.context>

  </div>
} 