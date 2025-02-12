import { LabeledHandle } from "@/components/labeled-handle"
import { Slider } from '@/components/ui/slider'
import { Position } from '@xyflow/react'
import { Brain, BookTemplate } from "lucide-react"
import { NodeLayout } from './node'
import { NodeTitle } from './title'
import { Button } from "@/components/ui/button"

export function TemplateNode({ data, isConnectable }) {

  return <NodeLayout>
    <NodeTitle title="Template" icon={BookTemplate} />
    <div className="w-full px-4 pt-4">
      <Button className="w-full" variant="outline">Content</Button>
    </div>
    <LabeledHandle id="lab" title="Output" type="source" position={Position.Right} />
  </NodeLayout>

}





