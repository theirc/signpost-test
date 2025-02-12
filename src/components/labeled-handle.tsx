import React from "react"
import { cn } from "@/lib/utils"
import { Handle, HandleProps } from "@xyflow/react"

type LabeledHandleProps = HandleProps & React.HTMLAttributes<HTMLDivElement> & { title?: string, handleClassName?: string, labelClassName?: string }
const className = "w-2 h-2 bg-white border border-solid border-stone-400"

function getFlexDirection(position: string) {
  const flexDirection = position === "top" || position === "bottom" ? "flex-col" : "flex-row"
  switch (position) {
    case "bottom":
    case "right":
      return flexDirection + "-reverse justify-end"
    default:
      return flexDirection
  }
}

export const LabeledHandle = React.forwardRef<HTMLDivElement, LabeledHandleProps>(({ className, labelClassName, title, position, ...props }, ref) => {


  return <div ref={ref} title={title} className={cn("relative flex items-center", getFlexDirection(position), className,)}>

    {/* <Handle id="a" className={className} type="target" position={Position.Top} isConnectable={isConnectable} /> */}
    {/* <Handle id="b" className={cn(className, "left-4")} type="target" position={Position.Top} isConnectable={isConnectable} /> */}
    {/* <Handle id="c" className={className} type="source" position={Position.Bottom} isConnectable={isConnectable} /> */}
    {/* <Handle id="d" className={className} type="source" position={Position.Bottom} isConnectable={isConnectable} /> */}



    <Handle position={position} {...props} className="w-2 h-2 bg-white border border-solid border-stone-400" />
    <label className={`px-3 py-1 text-foreground ${labelClassName}`}>{title}</label>
  </div>
})

LabeledHandle.displayName = "LabeledHandle"

