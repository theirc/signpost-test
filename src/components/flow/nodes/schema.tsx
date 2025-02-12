import { LabeledHandle } from "@/components/labeled-handle"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Position } from '@xyflow/react'
import { ListTree } from "lucide-react"
import { NodeLayout } from './node'
import { NodeTitle } from './title'
import { z } from 'zod'

const Dog = z.object({
  name: z.string(),
  age: z.number(),
})


function AddField() {
  return <>
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>Add Field</DialogTitle>
      </DialogHeader>
      <div className="grid grid-cols-12 gap-4 py-4">
        <div className="col-span-12 gap-4">
          <Label className="text-right ml-1">Name</Label>
          <Input className="col-span-3" />
        </div>
        <div className="col-span-12 gap-4">
          <Label className="text-right ml-1">Prompt</Label>
          <Input className="col-span-3" />
        </div>
      </div>
      <DialogFooter>
        <Button type="submit">Save changes</Button>
      </DialogFooter>
    </DialogContent></>
}

export function SchemaNode({ data, isConnectable }) {

  return <NodeLayout>
    <NodeTitle title="Schema" icon={ListTree} />
    <LabeledHandle id="input" title="Input" type="target" position={Position.Left} />

    <LabeledHandle id="dt" title="Dangerous Thoughts" type="source" position={Position.Right} />
    <LabeledHandle id="lan" title="Language" type="source" position={Position.Right} />
    <LabeledHandle id="sum" title="Sumarization" type="source" position={Position.Right} />

    <Dialog>
      <DialogTrigger asChild>
        <div className="w-full px-4 pt-4">
          <Button className="w-full" variant="outline" >Add Field</Button>
        </div>
      </DialogTrigger>
      <AddField />
    </Dialog>

  </NodeLayout >

}





