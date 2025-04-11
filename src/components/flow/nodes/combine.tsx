import { workerRegistry } from '@/lib/agents/registry'
import { NodeProps } from '@xyflow/react'
import { Combine, CreditCard, GitFork, Keyboard, MousePointerClick, Settings, User } from "lucide-react"
import { NodeHandlers, WorkerLabeledHandle } from '../handles'
import { useWorker } from '../hooks'
import { NodeLayout } from './node'
import { DropdownMenu, DropdownMenuItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuTrigger, DropdownMenuGroup } from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
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

  const { form, m, watch } = useForm(model, {
    values: {
      mode: worker.parameters.mode,
    }
  })

  watch((value, { name }) => {
    if (name === "mode") worker.parameters.mode = value.mode as any
  })

  return <form.context>
    <div className='px-2 nodrag w-full flex-grow flex flex-col'>
      <Row className='py-4'>
        <Select field={m.mode} span={12} />
      </Row>
    </div>
  </form.context>

}


export function CombineNode(props: NodeProps) {
  const worker = useWorker(props.id) as CombineWorker

  const type1 = worker.inferType(worker.fields.input1, app.agent)
  const type2 = worker.inferType(worker.fields.input2, app.agent)
  const type = type1 == "unknown" ? type2 : type1
  worker.fields.input1.type = type
  worker.fields.input2.type = type
  worker.fields.output.type = type


  const { form, m, watch } = useForm(model, {
    values: {
      mode: worker.parameters.mode
    }
  })

  watch((value, { name }) => {
    if (name === "mode") worker.parameters.mode = value.mode as any
  })


  function onSelected(e) {
    worker.parameters.mode = e
  }

  return <NodeLayout worker={worker}>
    <WorkerLabeledHandle handler={worker.fields.input1} />
    <WorkerLabeledHandle handler={worker.fields.input2} />

    <NodeHandlers worker={worker} />
    <WorkerLabeledHandle handler={worker.fields.output} />

    <div className='w-full flex'>
      <MemoizedWorker worker={worker}>
        <Parameters worker={worker} />
      </MemoizedWorker>
    </div>

  </NodeLayout >
}

combine.icon = Combine

