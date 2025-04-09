import { cn } from "@/lib/utils"
import { NodeResizeControl } from "@xyflow/react"
import { createContext, ReactNode, SVGProps } from "react"
import { useWorkerContext, WorkerContext } from "../hooks"
import { NodeTitle } from "../title"
import { app } from "@/lib/app"

interface Props extends React.ComponentProps<"div"> {
  children: React.ReactNode
  resizable?: boolean
  minWidth?: number
  minHeight?: number
  maxHeight?: number
  maxWidth?: number
  worker?: AIWorker
  onEdit?: (handle: NodeIO) => void
}

const controlStyle = {
  background: 'transparent',
  border: 'none',
}

function ResizeIcon(props: SVGProps<SVGSVGElement>) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" {...props}><g fill="none" stroke="currentColor"><path d="M10 20h10V10"></path><path d="M12 17h5v-5"></path></g></svg>
}


export function NodeLayout(props: Props) {

  const { currentWorker } = app.agent


  let running = false
  if (currentWorker && props.worker && currentWorker.id === props.worker.id) {
    // console.log("Title Worker: ", currentWorker.config.type)
    running = true
  }


  return <WorkerContext.Provider value={{ worker: props.worker, onEdit: props.onEdit }}>

    {/* <div className={cn("shadow-xl rounded-sm bg-white border border-stone-400 size-full pb-4 min-w-[224px]", props.className)}> */}
    <div className={cn(" shadow-xl rounded-sm bg-white border border-stone-400 size-full pb-4 min-w-[224px] transition-shadow", {
      "shadow-red-500": running,
      "outline-red-600": running,
      "outline-1": running,
      "outline": running,
    }, props.className)}>
      <NodeTitle />
      {props.resizable && <NodeResizeControl style={controlStyle} minWidth={props.minWidth || 224} minHeight={props.minHeight || 200} maxHeight={props.maxHeight} maxWidth={props.maxWidth || 640} >
        <ResizeIcon className="-ml-4 -mt-4 text-gray-400" />
      </NodeResizeControl>}
      {props.children}
    </div>
  </WorkerContext.Provider>
}


