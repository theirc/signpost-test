import { useCallback, useState } from 'react'
import { Handle, NodeProps, Position, XYPosition } from '@xyflow/react'
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from '@/lib/utils'
import { Slider } from '@/components/ui/slider'
import { Brain, Settings } from "lucide-react"
import { NodeTitle } from '../title'
import { NodeLayout } from './node'
import { Select, SelectContent, SelectItem, SelectValue, SelectTrigger } from '@/components/ui/select'
import { app } from '@/lib/app'
import { useWorker } from '../hooks'
import { NodeHandlers } from '../handles'
import { workerRegistry } from '@/lib/agents/registry'
const { ai } = workerRegistry
ai.icon = Brain

export function AINode(props: NodeProps) {

  const worker = useWorker(props.id)

  return <NodeLayout>
    <NodeTitle registry={ai} worker={worker} />
    {/* <ExecuteNextHandle /> */}
    {/* <LabeledHandle id="input" title="Input" type="target" position={Position.Left} /> */}
    {/* <LabeledHandle id="prompt" title="Prompt" type="target" position={Position.Left} /> */}
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
    <NodeHandlers worker={worker} />
  </NodeLayout>

}


