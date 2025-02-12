import { LabeledHandle } from "@/components/labeled-handle"
import { Slider } from '@/components/ui/slider'
import { Position } from '@xyflow/react'
import { Brain, BookTemplate, Send } from "lucide-react"
import { NodeLayout } from './node'
import { NodeTitle } from './title'
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function NotifyNode({ data, isConnectable }) {

  return <NodeLayout>
    <NodeTitle title="Notify" icon={Send} />
    <LabeledHandle id="input" title="Input" type="target" position={Position.Left} />
    <div className="w-full flex p-4">
      <Select>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Zendesk" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="light">Whatsapp</SelectItem>
          <SelectItem value="dark">Email</SelectItem>
        </SelectContent>
      </Select>    </div>
  </NodeLayout>

}





