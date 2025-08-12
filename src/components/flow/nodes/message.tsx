import { workerRegistry } from "@/lib/agents/registry"
import { NodeProps } from '@xyflow/react'
import { MessageSquare } from "lucide-react"
import { WorkerLabeledHandle } from "../handles"
import { useWorker } from "../hooks"
import { NodeLayout } from './node'
import { ConditionHandler } from "../condition"
import { Row, useForm } from "@/components/forms"
import { Input } from "@/components/forms/input"
import { InputTextArea } from "@/components/forms/textarea"
import { createModel } from "@/lib/data/model"
import { useEffect } from "react"

const { message } = workerRegistry
message.icon = MessageSquare

const model = createModel({
  fields: {
    telerivetApiKey: { title: "Telerivet API Key", type: "string", required: false },
    telerivetProjectId: { title: "Telerivet Project ID", type: "string", required: false },
    username: { title: "Username", type: "string", required: false },
    defaultToNumber: { title: "Default To Number", type: "string", required: false },
    defaultQuickReplies: { title: "Default Quick Replies", type: "string", required: false },
    defaultRouteId: { title: "Default Route ID", type: "string", required: false },
  }
})

function Parameters({ worker }: { worker: MessageWorker }) {
  const { form, watch, m } = useForm(model, {
    doNotReset: true,
    values: {
      telerivetApiKey: worker.parameters.telerivetApiKey || "",
      telerivetProjectId: worker.parameters.telerivetProjectId || "",
      username: worker.parameters.username || "",
      defaultToNumber: worker.parameters.defaultToNumber || "",
      defaultQuickReplies: (worker.parameters.defaultQuickReplies || []).join(", "),
      defaultRouteId: worker.parameters.defaultRouteId || "",
    }
  })

  // Watch for form changes and update worker parameters
  useEffect(() => {
    const subscription = watch((value, { name }) => {
      console.log(`[Message Node] Form field changed: ${name} = ${value[name as keyof typeof value]}`)
      
      if (name === "telerivetApiKey") {
        worker.parameters.telerivetApiKey = value.telerivetApiKey
        console.log(`[Message Node] Updated telerivetApiKey: ${worker.parameters.telerivetApiKey}`)
      }
      if (name === "telerivetProjectId") {
        worker.parameters.telerivetProjectId = value.telerivetProjectId
        console.log(`[Message Node] Updated telerivetProjectId: ${worker.parameters.telerivetProjectId}`)
      }
      if (name === "username") {
        worker.parameters.username = value.username
        console.log(`[Message Node] Updated username: ${worker.parameters.username}`)
      }
      if (name === "defaultToNumber") {
        worker.parameters.defaultToNumber = value.defaultToNumber
        console.log(`[Message Node] Updated defaultToNumber: ${worker.parameters.defaultToNumber}`)
      }
      if (name === "defaultQuickReplies") {
        worker.parameters.defaultQuickReplies = value.defaultQuickReplies
          .split(",")
          .map(s => s.trim())
          .filter(s => s.length > 0)
        console.log(`[Message Node] Updated defaultQuickReplies:`, worker.parameters.defaultQuickReplies)
      }
      if (name === "defaultRouteId") {
        worker.parameters.defaultRouteId = value.defaultRouteId
        console.log(`[Message Node] Updated defaultRouteId: ${worker.parameters.defaultRouteId}`)
      }
    })
    return () => subscription.unsubscribe()
  }, [watch]) // Removed worker.parameters from dependencies to prevent infinite loop

  return <form.context>
    <div className="p-2 flex flex-col gap-2 w-full">
      <Row>
        <Input span={12} field={m.telerivetApiKey} hideLabel placeholder="Telerivet API Key" />
      </Row>
      <Row>
        <Input span={12} field={m.telerivetProjectId} hideLabel placeholder="Telerivet Project ID" />
      </Row>
      <Row>
        <Input span={12} field={m.username} hideLabel placeholder="Username (default: api)" />
      </Row>
      <Row>
        <Input span={12} field={m.defaultToNumber} hideLabel placeholder="Default To Number" />
      </Row>
      <Row>
        <Input span={12} field={m.defaultQuickReplies} hideLabel placeholder="Default Quick Replies (comma-separated)" />
      </Row>
      <Row>
        <Input span={12} field={m.defaultRouteId} hideLabel placeholder="Default Route ID" />
      </Row>
    </div>
  </form.context>
}

export function MessageNode(props: NodeProps) {
  const worker = useWorker<MessageWorker>(props.id)
  
  return <NodeLayout worker={worker} resizable className="flex flex-col h-full" minHeight={300} minWidth={300}>
    <WorkerLabeledHandle handler={worker.fields.content} />
    <WorkerLabeledHandle handler={worker.fields.toNumber} />
    <WorkerLabeledHandle handler={worker.fields.quickReplies} />
    <WorkerLabeledHandle handler={worker.fields.routeId} />
    <WorkerLabeledHandle handler={worker.fields.output} />
    <Parameters worker={worker} />
    <ConditionHandler />
  </NodeLayout>
} 