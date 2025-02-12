import { useCallback, useState } from 'react'
import { Handle, Position } from '@xyflow/react'
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LabeledHandle } from "@/components/labeled-handle"
import { cn } from '@/lib/utils'
import { Slider } from '@/components/ui/slider'
import { Brain, ListTree, Settings } from "lucide-react"
import { NodeTitle } from './title'
import { NodeLayout } from './node'

export function SchemaNode({ data, isConnectable }) {

  return <NodeLayout>
    <NodeTitle title="Schema" icon={ListTree} />

    <div className='p-4'>
      <div>
        <Label className='block text-gray-400 text-sm'>Text</Label>
        <Input placeholder="Prompt" />
      </div>
    </div>

    <LabeledHandle id="input" title="Input" type="target" position={Position.Left} />
    <LabeledHandle id="lab" title="Output" type="source" position={Position.Right} />
    <LabeledHandle id="lab" title="Is Contact" type="source" position={Position.Right} />
    <LabeledHandle id="lab" title="Language" type="source" position={Position.Right} />

  </NodeLayout >

}





