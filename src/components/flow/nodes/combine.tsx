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

export function CombineNode(props: NodeProps) {
  const worker = useWorker(props.id) as CombineWorker

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
    <WorkerLabeledHandle handler={worker.fields.result} />

    <div className='w-full flex'>
      <form.context>
        <div className='p-2 mt-2 nodrag w-full flex-grow flex flex-col'>
          <Row className='py-4'>
            <Select field={m.mode} span={12} />
          </Row>
        </div>
      </form.context>
    </div>

  </NodeLayout >
}

combine.icon = Combine

