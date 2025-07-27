import { Button } from "@/components/ui/button"
import { BaseEdge, EdgeLabelRenderer, EdgeProps, getBezierPath, useReactFlow } from "@xyflow/react"
import { Trash2, X } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, } from "@/components/ui/dropdown-menu"
import { app } from "@/lib/app"
import { DisplayContent } from "./nodes/displaytypes"
import { useEffect, useState } from "react"

function round(num: number) {
  return `${Math.round((num + Number.EPSILON) * 100) / 100}`
}

// Animated edge component for running workers
function AnimatedEdge({ path, isRunning }: { path: string; isRunning: boolean }) {
  const [dashOffset, setDashOffset] = useState(0)

  useEffect(() => {
    if (!isRunning) return

    const interval = setInterval(() => {
      setDashOffset((prev) => (prev + 1) % 20)
    }, 50) // Faster animation for better visibility

    return () => clearInterval(interval)
  }, [isRunning])

  if (!isRunning) {
    return <BaseEdge path={path} style={{}} />
  }

  return (
    <>
      {/* Base edge */}
      <BaseEdge path={path} style={{}} />
      {/* Animated highlight edge */}
      <BaseEdge
        path={path}
        className="edge-running-highlight"
        style={{
          stroke: '#8B5CF6', // Bright purple
          strokeWidth: 6, // Increased width for better visibility
          strokeDasharray: '10,10',
          strokeDashoffset: dashOffset,
        }}
      />
      {/* Glow effect */}
      <BaseEdge
        path={path}
        className="edge-running-glow"
        style={{
          stroke: '#A855F7', // Lighter purple for glow
          strokeWidth: 12, // Increased width for better glow effect
        }}
      />
    </>
  )
}

export function ButtonEdge({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, animated, source, target, sourceHandleId }: EdgeProps) {

  const [edgePath, labelX, labelY] = getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition, })
  const { setEdges, getEdges } = useReactFlow()

  const onEdgeClick = () => {
    setEdges((edges) => edges.filter((edge) => edge.id !== id))
  }

  const worker = app.agent.workers[source]
  const { currentWorker } = app.agent

  // Check if this edge is part of the current execution path
  const isRunning = Boolean(currentWorker && currentWorker.id && (
    currentWorker.id === source || 
    currentWorker.id === target ||
    // Check if this edge connects to the current worker
    (currentWorker.id === source && app.agent.workers[target]) ||
    (currentWorker.id === target && app.agent.workers[source])
  ))

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
    <AnimatedEdge path={edgePath} isRunning={isRunning} />
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

