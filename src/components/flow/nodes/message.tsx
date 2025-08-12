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
import { useEffect, useState } from "react"

const { message } = workerRegistry
message.icon = MessageSquare

const model = createModel({
  fields: {
    integrationChannel: { title: "Integration Channel", type: "string", required: true },
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
      integrationChannel: worker.parameters.integrationChannel || "telerivet",
      telerivetApiKey: worker.parameters.telerivetApiKey || "",
      telerivetProjectId: worker.parameters.telerivetProjectId || "",
      username: worker.parameters.username || "",
      defaultToNumber: worker.parameters.defaultToNumber || "",
      defaultQuickReplies: (worker.parameters.defaultQuickReplies || []).join(", "),
      defaultRouteId: worker.parameters.defaultRouteId || "",
    }
  })

  // Local state for integration channel to handle dropdown changes
  const [localIntegrationChannel, setLocalIntegrationChannel] = useState(
    worker.parameters.integrationChannel || "telerivet"
  )

  // Sync local state with worker parameter when it changes externally
  useEffect(() => {
    setLocalIntegrationChannel(worker.parameters.integrationChannel || "telerivet")
  }, [worker.parameters.integrationChannel])

  // Watch for form changes and update worker parameters
  useEffect(() => {
    const subscription = watch((value, { name }) => {
      console.log(`[Message Node] Form field changed: ${name} = ${value[name as keyof typeof value]}`)
      
      if (name === "integrationChannel") {
        worker.parameters.integrationChannel = value.integrationChannel
        console.log(`[Message Node] Updated integrationChannel: ${worker.parameters.integrationChannel}`)
      }
      if (name === "telerivetApiKey") {
        worker.parameters.telerivetApiKey = value.telerivetApiKey
        console.log(`[Message Node] Updated telerivetApiKey: ${worker.parameters.telerivetApiKey}`)
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
      {/* Integration Channel Selector */}
      <div className="w-full">
        <select 
          value={localIntegrationChannel} 
          onChange={(e) => {
            const newValue = e.target.value;
            setLocalIntegrationChannel(newValue);
            // Update the worker parameter immediately for instant feedback
            worker.parameters.integrationChannel = newValue;
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="telerivet">Telerivet</option>
          <option value="twilio">Twilio (Coming Soon)</option>
        </select>
      </div>

      {/* Telerivet-specific fields */}
      {localIntegrationChannel === "telerivet" && (
        <>
          <div className="w-full">
            <Input span={12} field={m.telerivetApiKey} hideLabel placeholder="Telerivet API Key" />
          </div>
          <div className="w-full">
            <Input span={12} field={m.telerivetProjectId} hideLabel placeholder="Telerivet Project ID" />
          </div>
        </>
      )}

      {/* Twilio coming soon message */}
      {localIntegrationChannel === "twilio" && (
        <div className="w-full">
          <div className="w-full px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-800 text-sm">
            🚧 Twilio integration is coming soon! For now, please select Telerivet.
          </div>
        </div>
      )}

      {/* General fields */}
      <div className="w-full">
        <Input span={12} field={m.defaultToNumber} hideLabel placeholder="Default To Number" />
      </div>
      <div className="w-full">
        <Input span={12} field={m.defaultQuickReplies} hideLabel placeholder="Default Quick Replies (comma-separated)" />
      </div>
      <div className="w-full">
        <Input span={12} field={m.defaultRouteId} hideLabel placeholder="Default Route ID" />
      </div>
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