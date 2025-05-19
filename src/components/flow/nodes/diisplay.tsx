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
import { app } from "@/lib/app"

const { display } = workerRegistry


display.icon = Eye

export function DisplayNode(props: NodeProps) {


  const worker = useWorker<DisplayWorker>(props.id)
  useNodeConnections({ id: props.id })
  const ch = worker.getConnectedHandler(worker.fields.input, app.agent)
  let type: IOTypes = "unknown"
  if (ch) type = ch.type
  worker.fields.output.type = type

  let md = ""

  if (type == "doc") {
    md = ((worker.fields.output.value as VectorDocument[]) || []).map((doc, i) => {
      return `
## ${doc.title}

${doc.body}

[${doc.title}](${doc.source})

---
`}).join("\n\n")
  }

  return <NodeLayout worker={worker} resizable={type == "string" || type == "doc"} className="flex flex-col" maxWidth={700} maxHeight={1024}>

    <InlineHandles>
      <WorkerLabeledHandle handler={worker.fields.input} />
      <WorkerLabeledHandle handler={worker.fields.output} />
    </InlineHandles>

    {type == "unknown" && <h3 className="flex justify-center font-semibold my-4 text-red-600">Connect the Input Node</h3>}

    {type == "string" && <div className="mx-2 mt-2 border border-solid border-gray-200 overflow-y-auto nodrag h-full min-h-10 p-2" >
      <div className="max-w-[500px] min-h-10 h-full flex-grow ">
        <Markdown>{worker.fields.input.value}</Markdown>
      </div>
    </div>}

    {type == "boolean" && <h3 className="flex justify-center font-semibold my-4 text-red-600 text-lg">{worker.fields.input.value ? "True" : "False"}</h3>}
    {type == "number" && <h3 className="flex justify-center font-semibold my-4 text-red-600 text-lg">{Intl.NumberFormat().format(worker.fields.input.value || 0)}</h3>}

    {type == "doc" && <div className="mx-2 mt-2 border border-solid border-gray-200 overflow-y-auto nodrag h-full min-h-10" >
      <div className="max-w-[700px] min-h-10 h-full flex-grow m-2">
        <Markdown>{md}</Markdown>
      </div>
    </div>
    }

  </NodeLayout >

}

