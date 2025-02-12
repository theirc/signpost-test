import { LabeledHandle } from "@/components/labeled-handle"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Position } from '@xyflow/react'
import { ListTree } from "lucide-react"
import { NodeTitle } from './title'
import { cn } from "@/lib/utils"

export function NodeLayout(props: React.ComponentProps<"div">) {
  return <div className={cn("shadow-md rounded-sm bg-white border border-stone-400 w-full h-full pb-4 min-w-56 ", props.className)}>
    {props.children}
  </div>
}





