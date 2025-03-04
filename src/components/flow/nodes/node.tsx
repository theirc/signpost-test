import { cn } from "@/lib/utils"
import { NodeResizeControl } from "@xyflow/react"
import { MoveDiagonal } from "lucide-react"

interface Props extends React.ComponentProps<"div"> {
  children: React.ReactNode
  resizable?: boolean
  minWidth?: number
  minHeight?: number
  maxHeight?: number
  maxWidth?: number
}

const controlStyle = {
  background: 'transparent',
  border: 'none',
}


const ResizeIcon = () => {
  return <div className="nodrag -ml-[22px] -mt-[22px] size-5">
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="size-full">
      <g stroke-width="0"></g><g stroke-linecap="round" stroke-linejoin="round"></g>
      <g>
        <path d="M21 15L15 21M21 8L8 21" stroke="#c0c0c0" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
      </g>
    </svg>
  </div>
}

export function NodeLayout(props: Props) {
  return <div className={cn("shadow-md rounded-sm bg-white border border-stone-400 size-full pb-4 min-w-56 ", props.className)}>

    {props.resizable && <NodeResizeControl style={controlStyle} minWidth={props.minWidth || 224} minHeight={props.minHeight || 200} maxHeight={props.maxHeight} maxWidth={props.maxWidth} >
      {/* <MoveDiagonal size={20} className="nodrag -ml-[10px] -mt-[10px] rotate-90 text-gray-400" /> */}
      <ResizeIcon />
    </NodeResizeControl>}

    {props.children}
  </div>
}





