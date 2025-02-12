import { useCallback, useState } from 'react'
import { Handle, Position } from '@xyflow/react'
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LabeledHandle } from "@/components/labeled-handle"
import { cn } from '@/lib/utils'
import { Slider } from '@/components/ui/slider'
import { Brain, Settings } from "lucide-react"
import { NodeTitle } from './title'
import { NodeLayout } from './node'
import { Select, SelectContent, SelectItem, SelectValue, SelectTrigger } from '@/components/ui/select'

export function AINode({ data, isConnectable }) {

  return <NodeLayout>
    <NodeTitle title="AI" icon={Brain} />
    <LabeledHandle id="input" title="Input" type="target" position={Position.Left} />
    <LabeledHandle id="prompt" title="Prompt" type="target" position={Position.Left} />
    <div className='p-4 nodrag'>

      <div className='mb-4'>
        <Select>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Model" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="light">OpenAI</SelectItem>
            <SelectItem value="dark">Claude</SelectItem>
            <SelectItem value="system">Gemini</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className='text-gray-500 text-sm mb-3'>Temperature</div>
      <Slider defaultValue={[50]} max={100} step={1} className="w-full" />


    </div>
    <LabeledHandle id="lab" title="Output" type="source" position={Position.Right} />
  </NodeLayout>

}





