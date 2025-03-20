import { InlineHandles, NodeHandlers, WorkerLabeledHandle } from "@/components/flow/handles"
import { Row, useForm } from "@/components/forms"
import { InputTextArea } from "@/components/forms/textarea"
import { workerRegistry } from "@/lib/agents/registry"
import { createModel } from "@/lib/data/model"
import { NodeProps } from '@xyflow/react'
import { Eye, Type } from "lucide-react"
import { useWorker } from "../hooks"
import { NodeLayout } from './node'
import Markdown from "react-markdown"
const { display } = workerRegistry

display.icon = Eye

export function DisplayNode(props: NodeProps) {

  const worker = useWorker<DisplayWorker>(props.id)


  return <NodeLayout worker={worker} resizable minHeight={350}>

    <InlineHandles>
      <WorkerLabeledHandle handler={worker.fields.input} />
      <WorkerLabeledHandle handler={worker.fields.output} />
    </InlineHandles>

    <div className="mx-2 mt-4 border border-solid border-gray-200 overflow-y-auto nodrag " style={{ height: "80%" }} >
      <Markdown>
        {worker.fields.input.value || ""}
      </Markdown>
    </div>


  </NodeLayout>

}

