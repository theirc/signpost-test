import { app } from "@/lib/app"
import { cn } from "@/lib/utils"
import { Connection, Handle, HandleProps, HandleType, Position, useNodeConnections } from "@xyflow/react"
import { Binary, CircleHelp, Hash, Type, MessageCircleMore, Headphones, Image, Video } from "lucide-react"
import React from "react"

type LabeledHandleProps = HandleProps & React.HTMLAttributes<HTMLDivElement> & { title?: string, handler?: NodeIO }

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

interface WorkerHandleProps extends Partial<LabeledHandleProps> {
  handler: NodeIO
}


function HanlderIcon({ handler }: { handler: NodeIO }) {
  if (!handler) return null
  return <>
    {handler?.type == "string" && <Type size={12} className="mt-[1px]" />}
    {handler?.type == "number" && <Hash size={12} className="mt-[1px]" />}
    {handler?.type == "boolean" && <Binary size={12} className="mt-[1px]" />}
    {handler?.type == "any" && <CircleHelp size={12} className="mt-[1px]" />}
    {handler?.type == "chat" && <MessageCircleMore size={12} className="mt-[1px]" />}
    {handler?.type == "audio" && <Headphones size={12} className="mt-[1px]" />}
    {handler?.type == "image" && <Image size={12} className="mt-[1px]" />}
    {handler?.type == "video" && <Video size={12} className="mt-[1px]" />}
  </>
}

export function WorkerHandle(props: WorkerHandleProps) {
  const { handler } = props
  const position = handler.direction == "output" ? Position.Right : Position.Left
  const type = handler.direction == "output" ? "source" : "target"
  if (handler.type == "execute") return <ExecuteHandle handler={handler} />
  return <LabeledHandle title={handler.title} position={position} type={type} id={handler.id} handler={handler} />

}

function LabeledHandle({ title, position, handler, ...props }: LabeledHandleProps) {

  return <div className={cn("relative flex items-center my-1", getFlexDirection(position),)}>
    <CustomHandle {...props} position={position} className="size-2 bg-white border border-solid border-stone-400" />
    {handler.direction == "input" &&
      <div className="ml-2">
        <HanlderIcon handler={handler} />
      </div>
    }
    <div>
      <label className={`px-1 text-foreground} mr-1`}>{title}</label>
    </div>
    {handler.direction == "output" &&
      <div className="mr-2">
        <HanlderIcon handler={handler} />
      </div>
    }
  </div>
}

function ExecuteHandle(props: { handler: NodeIO }) {
  const { handler } = props

  const position = handler.direction == "output" ? Position.Right : Position.Left
  const type = handler.direction == "output" ? "source" : "target"

  return <div className={cn("relative flex items-center", getFlexDirection(position),)}>
    <CustomHandle id={handler.id} position={position} type={type} className="w-2 h-2 bg-red-500 border border-solid border-red-500" />
    <div>
      <label className={`px-3 text-foreground}`}>{handler.title}</label>
    </div>
  </div>
}


function CustomHandle(props: HandleProps) {

  const connections = useNodeConnections()
  let isConnectable = true

  // console.log("Connections:", connections)

  for (let i = 0; i < connections.length; i++) {
    const h = connections[i]

    if (h.sourceHandle !== props.id && h.targetHandle !== props.id) continue

    const workers = app.agent.workers[h.source]
    const workert = app.agent.workers[h.target]
    if (!workers || !workert) continue
    const handles = workers.handlers[h.sourceHandle]
    const handlet = workert.handlers[h.targetHandle]

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
    const handles = workers.handlers[e.sourceHandle]
    const handlet = workert.handlers[e.targetHandle]
    if (!handles || !handlet) return false

    if (handles.type === "execute" || handlet.type === "execute") return (handles.type === "execute" && handlet.type === "execute")
    if (handles.type === "any" || handlet.type === "any") return true

    return handles.type === handlet.type

  }



  return <Handle {...props} isConnectable={isConnectable} isValidConnection={isValidConnection} />
}

export function NodeHandlers(props: { worker: AIWorker }) {
  const { worker } = props

  const hs = Object.values(worker.handlers)
  const leftExec = hs.filter(h => (h.type === "execute") && h.direction === "input")
  const rightExec = hs.filter(h => (h.type === "execute") && h.direction === "output")
  const handlers = hs.filter(h => (h.type !== "execute"))

  return <>
    {handlers.map((h) => <WorkerHandle key={h.id} handler={h} />)}
    {leftExec.map((h) => <WorkerHandle key={h.id} handler={h} />)}
    {rightExec.map((h) => <WorkerHandle key={h.id} handler={h} />)}
  </>
}

