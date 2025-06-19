import { Button } from "@/components/ui/button"
import { BaseEdge, EdgeLabelRenderer, EdgeProps, getBezierPath, useReactFlow } from "@xyflow/react"
import { Trash2, X } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, } from "@/components/ui/dropdown-menu"
import { app } from "@/lib/app"
import { DisplayContent } from "./nodes/displaytypes"

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

  if (!app.agent.displayData) type = "unknown"

  return <>
    <BaseEdge path={edgePath} style={{}} />
    <EdgeLabelRenderer>
      <div className="nodrag nopan pointer-events-auto absolute" style={{ transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`, }}>
        {type === "unknown" && <Button onClick={onEdgeClick} size="icon" variant="secondary" className="rounded-full border border-solid border-gray-300 shadow-md w-6 h-6 !bg-gray-400">
          <X size={16} />
        </Button>}

        {app.agent.displayData && <>
          <DisplayContent
            type={type}
            value={v}
            className="bg-neutral-50 p-2 text-sm border border-solid border-gray-400 shadow-md rounded-sm max-w-64 max-h-64 overflow-auto"
          />
        </>}
      </div>
    </EdgeLabelRenderer>
  </>

}

