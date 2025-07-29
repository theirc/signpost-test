import { workerRegistry } from "@/lib/agents/registry"
import { createModel } from "@/lib/data/model"
import { NodeProps } from '@xyflow/react'
import { HelpCircle } from "lucide-react"
import { useWorker } from "../hooks"
import { NodeLayout } from './node'
import { MemoizedWorker } from "../memoizedworkers"
import { InputTextArea, useForm } from "@/components/forms"

const { tooltip } = workerRegistry

tooltip.icon = HelpCircle

const model = createModel({
  fields: {
    notes: { title: "Notes", type: "string", required: false },
  }
})

function Parameters({ worker }: { worker: TooltipWorker }) {
  const { form, m, watch } = useForm(model, {
    doNotReset: true,
    values: {
      notes: worker.parameters.notes || "",
    }
  })

  watch((value, { name }) => {
    if (name === "notes") worker.parameters.notes = value.notes
  })

  return <form.context>
    <div className='px-2 nodrag w-full flex-grow flex flex-col'>
      <div className='py-2'>
        <InputTextArea 
          field={m.notes} 
          placeholder="Add your notes here..." 
          className="min-h-[100px] resize-none"
        />
      </div>
    </div>
  </form.context>
}

export function TooltipNode(props: NodeProps) {
  const worker = useWorker<TooltipWorker>(props.id)
  
  return <NodeLayout worker={worker}>
    <MemoizedWorker worker={worker} name="parameters">
      <Parameters worker={worker} />
    </MemoizedWorker>
  </NodeLayout>
}