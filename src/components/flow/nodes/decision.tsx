import { LabeledHandle } from "@/components/labeled-handle"
import { Slider } from '@/components/ui/slider'
import { Position } from '@xyflow/react'
import { Brain, BookTemplate, GitFork } from "lucide-react"
import { NodeLayout } from './node'
import { NodeTitle } from './title'
import { Button } from "@/components/ui/button"

export function DecisionNode({ data, isConnectable }) {

  return <NodeLayout>
    <NodeTitle title="Decision" icon={GitFork} />
    <LabeledHandle id="input" title="Input" type="target" position={Position.Left} />
    <div className="w-full flex px-4">
      <div className="mr-1 my-4 px-2 py-1 border border-solid border-gray-200 rounded-md " >Equals</div>
      <div className="my-4 px-2 py-1 border border-solid border-gray-200 rounded-md " >True</div>
    </div>
    <LabeledHandle id="true" title="True" type="source" position={Position.Right} />
    <LabeledHandle id="false" title="False" type="source" position={Position.Right} />
  </NodeLayout>

}





