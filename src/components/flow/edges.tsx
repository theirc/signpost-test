import { Button } from "@/components/ui/button"
import { BaseEdge, EdgeLabelRenderer, EdgeProps, getBezierPath, useReactFlow } from "@xyflow/react"
import { Trash2, X } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, } from "@/components/ui/dropdown-menu"
import { app } from "@/lib/app"

function round(num: number) {
  return `${Math.round((num + Number.EPSILON) * 100) / 100}`
}


export function ButtonEdge({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, animated, source, target, sourceHandleId }: EdgeProps) {

  const [edgePath, labelX, labelY] = getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition, })
  const { setEdges, getEdges } = useReactFlow()


  const onEdgeClick = () => {
    setEdges((edges) => edges.filter((edge) => edge.id !== id))
  }

  const worker = app.agent.workers[source]

  let v = null
  let type: IOTypes = "unknown"

  if (worker) {
    const handle = worker.handles[sourceHandleId]
    if (handle) {
      v = handle.value
      type = handle.type
    }
  }

  // if (v == null) type = "unknown"

  if (type != "boolean" && type != "string" && type != "number" && type != "enum") {
    type = "unknown"
  }

  if (!app.agent.displayData) {
    type = "unknown"
  }

  return <>
    <BaseEdge path={edgePath} style={{}} />
    <EdgeLabelRenderer>
      <div className="nodrag nopan pointer-events-auto absolute" style={{ transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`, }}>
        {type === "unknown" && <Button onClick={onEdgeClick} size="icon" variant="secondary" className="rounded-full border border-solid border-gray-300 shadow-md w-6 h-6 !bg-gray-400">
          <X size={16} />
        </Button>}

        {app.agent.displayData && <>
          {type === "boolean" && <DisplayBoolean value={v as boolean} />}
          {type === "number" && <DisplayNumber value={v as number} />}
          {type === "string" && <DisplayString value={v as string} />}
          {type === "enum" && <DisplayString value={v as string} />}
        </>}
        {/* {type != "unknown" && <>
          {type === "boolean" && <DisplayBoolean value={v as boolean} />}
          {type === "number" && <DisplayNumber value={v as number} />}
          {type === "string" && <DisplayString value={v as string} />}
        </>} */}
      </div>
    </EdgeLabelRenderer>
  </>

}

function DisplayBoolean({ value }: { value: boolean }) {
  return <div className="bg-neutral-50 p-1 text-sm border border-solid border-gray-400 shadow-md rounded-sm">
    {value ? "True" : "False"}
  </div>
}

function DisplayNumber({ value = 0 }: { value: number }) {
  return <div className="bg-neutral-50 p-1 text-sm border border-solid border-gray-400 shadow-md rounded-sm">
    {round(value)}
  </div>
}

function DisplayString({ value = "" }: { value: string }) {
  return <div className="bg-neutral-50 p-1 text-sm border border-solid border-gray-400 shadow-md rounded-sm  max-w-60 max-h-60  overflow-auto">
    {value || "Empty"}
  </div>
}


// export function ButtonEdge({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, animated }: EdgeProps) {
//   const [edgePath, labelX, labelY] = getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition, })
//   const { setEdges } = useReactFlow()
//   const onEdgeClick = () => {
//     setEdges((edges) => edges.filter((edge) => edge.id !== id))
//   }
//   return <>
//     <BaseEdge path={edgePath} style={{ color: "red", stroke: "red", strokeWidth: 2 }} />
//     <EdgeLabelRenderer>
//       <div className="nodrag nopan pointer-events-auto absolute" style={{ transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`, }}>
//         <Button onClick={onEdgeClick} size="icon" variant="secondary" className="rounded-full border border-solid border-gray-300 shadow-md w-6 h-6">
//           <X size={16} />
//         </Button>
//       </div>
//     </EdgeLabelRenderer>
//   </>
// }
