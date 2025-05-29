import { InlineHandles, WorkerLabeledHandle } from "@/components/flow/handles"
import { workerRegistry } from "@/lib/agents/registry"
import { app } from "@/lib/app"
import { NodeProps, useNodeConnections } from '@xyflow/react'
import { Eye } from "lucide-react"
import Markdown from "react-markdown"
import { useWorker } from "../hooks"
import { NodeLayout } from './node'
import { DisplayContent } from "./displaytypes"
import remarkBreaks from "remark-breaks"
import remarkGfm from "remark-gfm"
const { display } = workerRegistry


display.icon = Eye

export function DisplayNode(props: NodeProps) {

  const worker = useWorker<DisplayWorker>(props.id)
  useNodeConnections({ id: props.id })
  const ch = worker.getConnectedHandler(worker.fields.input, app.agent)
  let type: IOTypes = "unknown"
  let value = null

  if (ch) {
    type = ch.type
    value = ch.value
  }

  worker.fields.output.type = type

  return <NodeLayout worker={worker} resizable className="flex flex-col" maxWidth={640} maxHeight={800}>

    <InlineHandles>
      <WorkerLabeledHandle handler={worker.fields.input} />
      <WorkerLabeledHandle handler={worker.fields.output} />
    </InlineHandles>

    {type == "unknown" && <h3 className="flex justify-center font-semibold my-4 text-red-600">Connect the Input Node</h3>}

    {type != "unknown" && <DisplayContent
      type={type}
      // value={worker.fields.output.value}
      value={value}
      className="m-2 border border-solid border-gray-200 overflow-y-auto nodrag min-h-8  flex-grow p-2"
    />}

  </NodeLayout >

}

