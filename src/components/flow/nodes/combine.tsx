import { workerRegistry } from '@/lib/agents/registry'
import { NodeProps } from '@xyflow/react'
import { Combine } from "lucide-react"
import { NodeHandlers, WorkerLabeledHandle } from '../handles'
import { useWorker } from '../hooks'
import { NodeLayout } from './node'
import { createModel } from '@/lib/data/model'
import { Row, Select, useForm } from '@/components/forms'
import { MemoizedWorker } from '../memoizedworkers'
import { app } from '@/lib/app'
const { combine } = workerRegistry

const list = [
  { label: "Non Empty", value: "nonempty" },
  { label: "Concatenate", value: "concat" },
]

const model = createModel({
  fields: {
    mode: { title: "Action", type: "string", list },
  }
})

function Parameters({ worker }: { worker: CombineWorker }) {
  // Ensure parameters have proper defaults
  if (!worker.parameters.mode) worker.parameters.mode = "nonempty"

  const { form, m, watch } = useForm(model, {
    values: {
      mode: worker.parameters.mode || "nonempty",
    }
  })

  watch((value, { name }) => {
    if (name === "mode") worker.parameters.mode = value.mode as any
  })

  return <form.context>
    <div className='px-2 nodrag w-full flex-grow flex flex-col'>
      <Row className='py-2'>
        <Select field={m.mode} span={12} />
      </Row>
    </div>
  </form.context>
}


export function CombineNode(props: NodeProps) {
  const worker = useWorker(props.id) as CombineWorker

  if (!worker) return null

  // Ensure basic parameters exist (like schema does)
  if (!worker.parameters.mode) worker.parameters.mode = "nonempty"

  // Infer output type from inputs
  let inferredType: IOTypes = "unknown"
  if (worker.fields.input1) {
    const input1Type = worker.inferType(worker.fields.input1, app.agent)
    if (input1Type !== "unknown") {
      inferredType = input1Type
    }
  }
  if (inferredType === "unknown" && worker.fields.input2) {
    const input2Type = worker.inferType(worker.fields.input2, app.agent)
    if (input2Type !== "unknown") {
      inferredType = input2Type
    }
  }
  
  // Apply inferred type to all handlers
  if (worker.fields.input1) worker.fields.input1.type = inferredType
  if (worker.fields.input2) worker.fields.input2.type = inferredType
  if (worker.fields.output) worker.fields.output.type = inferredType

  return <NodeLayout worker={worker}>
    <WorkerLabeledHandle handler={worker.fields.input1} />
    <WorkerLabeledHandle handler={worker.fields.input2} />
    <WorkerLabeledHandle handler={worker.fields.output} />
    <MemoizedWorker worker={worker} name="parameters">
      <Parameters
        worker={worker}
      />
    </MemoizedWorker>
  </NodeLayout>
}

combine.icon = Combine
