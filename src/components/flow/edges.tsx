import { Button } from "@/components/ui/button"
import { BaseEdge, EdgeLabelRenderer, EdgeProps, getBezierPath, useReactFlow } from "@xyflow/react"
import { X } from "lucide-react"

export function ButtonEdge({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, animated }: EdgeProps) {

  const [edgePath, labelX, labelY] = getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition, })
  const { setEdges } = useReactFlow()


  const onEdgeClick = () => {
    setEdges((edges) => edges.filter((edge) => edge.id !== id))
  }

  return <>
    <BaseEdge path={edgePath} style={{ color: "red", stroke: "red", strokeWidth: 2 }} />
    <EdgeLabelRenderer>
      <div className="nodrag nopan pointer-events-auto absolute" style={{ transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`, }}>
        <Button onClick={onEdgeClick} size="icon" variant="secondary" className="rounded-full border border-solid border-gray-300 shadow-md w-6 h-6">
          <X size={16} />
        </Button>
      </div>
    </EdgeLabelRenderer>
  </>

}
