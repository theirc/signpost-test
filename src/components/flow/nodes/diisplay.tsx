import { InlineHandles, NodeHandlers, WorkerLabeledHandle } from "@/components/flow/handles"
import { Row, useForm } from "@/components/forms"
import { InputTextArea } from "@/components/forms/textarea"
import { workerRegistry } from "@/lib/agents/registry"
import { createModel } from "@/lib/data/model"
import { NodeProps, useNodeConnections } from '@xyflow/react'
import { Eye, Type } from "lucide-react"
import { useWorker } from "../hooks"
import { NodeLayout } from './node'
import Markdown from "react-markdown"
const { display } = workerRegistry

display.icon = Eye

export function DisplayNode(props: NodeProps) {

  const worker = useWorker<DisplayWorker>(props.id)
  useNodeConnections({ id: props.id })

  const ch = worker.getConnectedHandler(worker.fields.input)

  let type: IOTypes = "unknown" as IOTypes

  if (ch) {
    type = ch.type
  }

  worker.fields.output.type = type

  return <NodeLayout worker={worker} resizable={type == "string"} className="flex flex-col" >

    <InlineHandles>
      <WorkerLabeledHandle handler={worker.fields.input} />
      <WorkerLabeledHandle handler={worker.fields.output} />
    </InlineHandles>

    {type == "unknown" && <h3 className="flex justify-center font-semibold my-4 text-red-600">Connect the Input Node</h3>}
    {type == "string" && <div className="mx-2 mt-2 border border-solid border-gray-200 overflow-y-auto nodrag h-full min-h-10" >
      <Markdown>
        {worker.fields.input.value || ""}
      </Markdown>
    </div>}

    {type == "boolean" && <h3 className="flex justify-center font-semibold my-4 text-red-600 text-lg  ">{worker.fields.input.value ? "True" : "False"}</h3>}
    {type == "number" && <h3 className="flex justify-center font-semibold my-4 text-red-600 text-lg  ">{Intl.NumberFormat().format(worker.fields.input.value || 0)}</h3>}

    {/* <div className="mx-2 mt-2 border border-solid border-gray-200 overflow-y-auto nodrag h-full" >
      <Markdown>
        {worker.fields.input.value || ""}
      </Markdown>
    </div> */}


  </NodeLayout>

}

