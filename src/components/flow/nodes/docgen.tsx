import { LabeledHandle } from "@/components/labeled-handle"
import { Slider } from '@/components/ui/slider'
import { Position } from '@xyflow/react'
import { File } from "lucide-react"
import { NodeLayout } from './node'
import { NodeTitle } from './title'
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function DocumentGeneratorNode({ data, isConnectable }) {

  return <NodeLayout>
    <NodeTitle title="Document Generator" icon={File} />
    <LabeledHandle id="input" title="Input" type="target" position={Position.Left} />
    <div className="w-full px-4 pt-4">
      <div className='mb-4'>
        <Select>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="PDF" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="light">PDF</SelectItem>
            <SelectItem value="dark">Excel</SelectItem>
            <SelectItem value="system">Json</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  </NodeLayout>

}





