import { app } from "@/lib/app"
import { Connection, Handle, HandleProps, Position, useNodeConnections } from "@xyflow/react"
import { Binary, CircleHelp, Hash, Headphones, Image, MessageCircleMore, Type, Video } from "lucide-react"
import React, { useContext } from "react"
import { MemoizedWorker } from "./memoizedworkers"
import { cn } from "@/lib/utils"
import { useWorkerContext } from "./hooks"
import { HanlderIcon } from "./handlericon"

type WorkerHandleProps = Partial<HandleProps> & React.HTMLAttributes<HTMLDivElement> & { handler?: NodeIO }


export function WorkerHandle({ handler, className, ...props }: WorkerHandleProps) {
  const connections = useNodeConnections()

  if (!handler) return null

  let isConnectable = true
  const type = handler.direction == "output" ? "source" : "target"
  const position = handler.direction == "output" ? Position.Right : Position.Left

  for (let i = 0; i < connections.length; i++) {
    const h = connections[i]

    if (h.sourceHandle !== props.id && h.targetHandle !== props.id) continue

    const workers = app.agent.workers[h.source]
    const workert = app.agent.workers[h.target]
    if (!workers || !workert) continue
    const handles = workers.handles[h.sourceHandle]
    const handlet = workert.handles[h.targetHandle]

    if (!handles || !handlet) continue

    if (handles.type === "execute" || handlet.type === "execute") {
      isConnectable = false
      break
    }

  }

  function isValidConnection(e: Connection) {

    const workers = app.agent.workers[e.source]
    const workert = app.agent.workers[e.target]
    if (!workers || !workert) return false
    const handles = workers.handles[e.sourceHandle]
    const handlet = workert.handles[e.targetHandle]
    if (!handles || !handlet) return false

    if (handlet.type === "unknown") return true
    if (handles.type === "unknown") return true

    // if (handles.type === "execute" || handlet.type === "execute") return (handles.type === "execute" && handlet.type === "execute")
    // if (handles.type === "unknown") return true

    return handles.type === handlet.type

  }

  return <Handle
    id={handler.id}
    position={position}
    type={type}
    className={className}
    style={{ width: 8, height: 8, border: 1, borderStyle: "solid", borderColor: "grey", background: "white" }}
    isConnectable={isConnectable}
    isValidConnection={isValidConnection}
  />

}

export function WorkerLabeledHandle({ handler, ...props }: WorkerHandleProps) {
  const ct = useWorkerContext()
  if (!handler) return null

  function onClick() {
    ct?.onEdit?.(handler)
  }

  return <div>
    <div className="relative flex">
      <WorkerHandle handler={handler} />

      {handler.direction == "output" && <div className="flex-grow" />}
      {handler.direction == "input" && <div className="ml-[6px]"><HanlderIcon handler={handler} worker={ct?.worker} /></div>}

      <h3 className={cn(
        `px-[4px] max-w-32 overflow-x-hidden text-wrap text-ellipsis border-transparent border rounded font-semibold`,
        { "hover:bg-gray-200 hover:border-gray-400 cursor-pointer": !handler.system })}
        onClick={onClick}
      >
        {handler.title || handler.name}
      </h3>

      {handler.direction == "input" && <div className="flex-grow" />}
      {handler.direction == "output" && <div className="mr-[6px]"><HanlderIcon handler={handler} worker={ct?.worker} /></div>}
    </div>
    {props.children}
  </div>

}


export function InlineHandles({ children }: { children: [React.ReactNode, React.ReactNode] }) {

  const left = children?.[0]
  const right = children?.[1]

  return <div className="w-full flex">
    {left}
    <div className="flex-grow" />
    {right}
  </div>

}



export function NodeHandlers({ worker }: { worker: AIWorker }) {
  return <MemoizedWorker worker={worker}>
    <InternalNodeHandlers worker={worker} />
  </MemoizedWorker>
}


function InternalNodeHandlers(props: { worker: AIWorker }) {
  const { worker } = props
  const hs = Object.values(worker.handles)
  const handlers = hs
  return <div className="my-2">
    {handlers.map((h, i) => <WorkerLabeledHandle key={i} handler={h} />)}
  </div>
}


