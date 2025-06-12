import { workerRegistry } from "@/lib/agents/registry"
import { NodeProps } from '@xyflow/react'
import { ListTree } from "lucide-react"
import { AddFieldsForm } from "../addfields"
import { InlineHandles, NodeHandlers, WorkerLabeledHandle } from "../handles"
import { useWorker } from "../hooks"
import { NodeLayout } from './node'
import { ConditionHandler } from "../condition"
import { createModel } from "@/lib/data/model"
import { OpenAIModels } from "@/lib/agents/modellist"
import { Row, Select, useForm } from "@/components/forms"
import { MemoizedWorker } from "../memoizedworkers"
const { schema } = workerRegistry

schema.icon = ListTree

const list = OpenAIModels.map((m) => ({ value: m.value.replace("openai/", ""), label: m.label }))


const model = createModel({
  fields: {
    model: { title: "Model", type: "string", list },
  }
})


function Parameters({ worker }: { worker: SchemaWorker }) {

  const { form, m, watch } = useForm(model, {
    values: {
      model: worker.parameters.model || "gpt-4o",
    }
  })

  watch((value, { name }) => {
    if (name === "model") worker.parameters.model = value.model || "gpt-4o"
  })

  return <form.context>
    <div className='px-2 nodrag w-full flex-grow flex flex-col'>
      <Row className='py-2'>
        <Select field={m.model} span={12} />
      </Row>
    </div>
  </form.context>

}


export function SchemaNode(props: NodeProps) {
  const worker = useWorker<SchemaWorker>(props.id)
  return <NodeLayout worker={worker}>
    <InlineHandles>
      <WorkerLabeledHandle handler={worker.fields.input} />
      <WorkerLabeledHandle handler={worker.fields.json} />
    </InlineHandles>

    <NodeHandlers worker={worker} />
    <MemoizedWorker worker={worker} name="parameters">
      <Parameters worker={worker} />
    </MemoizedWorker>
    <ConditionHandler />
    <AddFieldsForm direction="output" includePrompt ignoreTypes={["references", "doc", "chat", "json"]} />
  </NodeLayout >
}


