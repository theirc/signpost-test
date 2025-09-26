import { workerRegistry } from "@/lib/agents/registry"
import { NodeProps } from '@xyflow/react'
import { MessageSquare, Settings } from "lucide-react"
import { WorkerLabeledHandle } from "../handles"
import { useWorker } from "../hooks"
import { NodeLayout } from './node'
import { ConditionHandler } from "../condition"
import { Row, useForm, Select } from "@/components/forms"
import { Input as FormInput } from "@/components/forms/input"
import { createModel } from "@/lib/data/model"

import { Button } from "@/components/ui/button"
import { Dialog, DialogTrigger } from "@/components/ui/dialog"
import { toast } from "sonner"
import { TelerivetConfigDialog } from "@/components/ui/telerivet"

import { MemoizedWorker } from "../memoizedworkers"

const { message } = workerRegistry
message.icon = MessageSquare

const model = createModel({
  fields: {
    integrationChannel: { 
      title: "Integration Channel", 
      type: "string", 
      list: [
        { value: "telerivet", label: "Telerivet" },
        { value: "twilio", label: "Twilio (Coming Soon)" }
      ]
    },
    telerivetApiKey: { title: "Telerivet API Key", type: "string" },
    telerivetProjectId: { title: "Telerivet Project ID", type: "string" },
    username: { title: "Username", type: "string" },
    defaultToNumber: { title: "Default To Number", type: "string" },
    defaultQuickReplies: { title: "Default Quick Replies", type: "string" },
    defaultRouteId: { title: "Default Route ID", type: "string" },
  }
})

function Parameters({ worker }: { worker: MessageWorker }) {
  const { form, watch, m, setValue } = useForm(model, {
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

  // Use form state for conditional rendering
  const integrationChannel = watch("integrationChannel")

  watch((value, { name }) => {
    if (name === "integrationChannel") worker.parameters.integrationChannel = value.integrationChannel
    if (name === "telerivetApiKey") worker.parameters.telerivetApiKey = value.telerivetApiKey
    if (name === "telerivetProjectId") worker.parameters.telerivetProjectId = value.telerivetProjectId
    if (name === "defaultToNumber") worker.parameters.defaultToNumber = value.defaultToNumber
    if (name === "defaultQuickReplies") {
      worker.parameters.defaultQuickReplies = value.defaultQuickReplies
        .split(",")
        .map(s => s.trim())
        .filter(s => s.length > 0)
    }
    if (name === "defaultRouteId") worker.parameters.defaultRouteId = value.defaultRouteId
  })

    const handleTelerivetSave = (values: any) => {
    // Simply update form values
    setValue("telerivetApiKey", values.telerivetApiKey)
    setValue("telerivetProjectId", values.telerivetProjectId)
    setValue("defaultRouteId", values.defaultRouteId)

    // Update worker parameters
    worker.parameters.telerivetApiKey = values.telerivetApiKey
    worker.parameters.telerivetProjectId = values.telerivetProjectId
    worker.parameters.defaultRouteId = values.defaultRouteId

    toast.success('Telerivet configuration saved successfully!')
  }

  return <form.context>
    <div className="px-2 nodrag w-full flex-grow flex flex-col">
      {/* Integration Channel Selector */}
      <Row className="py-2">
        <Select field={m.integrationChannel} span={12} />
      </Row>

             {/* Telerivet-specific fields */}
       {integrationChannel === "telerivet" && (
         <>
           <Row>
             <FormInput span={12} field={m.telerivetProjectId} placeholder="Telerivet Project ID" />
           </Row>
         </>
       )}

      {/* Twilio coming soon message */}
      {integrationChannel === "twilio" && (
        <Row>
          <div className="w-full px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-800 text-sm">
            🚧 Twilio integration is coming soon! For now, please select Telerivet.
          </div>
        </Row>
      )}

             {/* General fields */}
       <Row>
         <FormInput span={12} field={m.defaultToNumber} placeholder="Default To Number" />
       </Row>
       <Row>
         <FormInput span={12} field={m.defaultQuickReplies} placeholder="Default Quick Replies (comma-separated)" />
       </Row>
       <Row>
         <FormInput span={12} field={m.defaultRouteId} placeholder="Default Route ID" />
       </Row>

       {/* Configure Telerivet Button - at the bottom of the form */}
       {integrationChannel === "telerivet" && (
         <div className="w-full pt-2">
           <Dialog>
             <DialogTrigger asChild>
               <Button 
                 variant="outline" 
                 size="sm" 
                 className="w-full gap-2"
                 onClick={(e) => {
                   e.stopPropagation()
                 }}
               >
                 <Settings className="h-4 w-4" />
                 Configure Telerivet
               </Button>
             </DialogTrigger>
             <TelerivetConfigDialog 
               worker={worker} 
               onSave={handleTelerivetSave}
             />
           </Dialog>
         </div>
       )}
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
    <WorkerLabeledHandle handler={worker.fields.fileAttachment} />
    <WorkerLabeledHandle handler={worker.fields.output} />
    <MemoizedWorker worker={worker} name="parameters">
      <Parameters worker={worker} />
    </MemoizedWorker>
    <ConditionHandler />
  </NodeLayout>
} 