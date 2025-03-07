import { app } from "@/lib/app"
import { cn } from "@/lib/utils"
import { Connection, Handle, HandleProps, HandleType, Position, useNodeConnections } from "@xyflow/react"
import { Binary, CircleHelp, Hash, Type, MessageCircleMore, Headphones, Image, Video } from "lucide-react"
import React, { memo, useRef } from "react"
import isEqual from "lodash/isEqual"
import { MemoizedWorker } from "./memoizedworkers"

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
    {handler?.type == "string" && <Type size={10} className="mt-[1px]" />}
    {handler?.type == "number" && <Hash size={10} className="mt-[1px]" />}
    {handler?.type == "boolean" && <Binary size={10} className="mt-[1px]" />}
    {handler?.type == "any" && <CircleHelp size={10} className="mt-[1px]" />}
    {handler?.type == "chat" && <MessageCircleMore size={10} className="mt-[1px]" />}
    {handler?.type == "audio" && <Headphones size={10} className="mt-[1px]" />}
    {handler?.type == "image" && <Image size={10} className="mt-[1px]" />}
    {handler?.type == "video" && <Video size={10} className="mt-[1px]" />}
  </>
}

export function WorkerHandle(props: WorkerHandleProps) {
  const { handler } = props
  if (!handler) return null
  const position = handler.direction == "output" ? Position.Right : Position.Left
  const type = handler.direction == "output" ? "source" : "target"
  if (handler.type == "execute") return <LabeledHandle title={handler.title} position={position} type={type} id={handler.id} handler={handler} className="bg-red-500 border border-red-500" />
  return <LabeledHandle title={handler.title} position={position} type={type} id={handler.id} handler={handler} />
}

function LabeledHandle({ title, position, handler, className, ...props }: LabeledHandleProps) {


  return <div className={cn("relative flex items-center", getFlexDirection(position),)}>
    <CustomHandle {...props} position={position} className={cn("size-2 border border-solid bg-white border-stone-400", className)} />
    {handler.direction == "input" &&
      <div className="ml-[6px] mt-[1px]">
        <HanlderIcon handler={handler} />
      </div>
    }
    <div>
      <label className={`px-[4px]`}>{title}</label>
    </div>
    {handler.direction == "output" &&
      <div className="mr-[6px] mt-[2px]">
        <HanlderIcon handler={handler} />
      </div>
    }
  </div>


}



function CustomHandle(props: HandleProps) {

  const connections = useNodeConnections()
  let isConnectable = true


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

    if (handles.type === "execute" || handlet.type === "execute") return (handles.type === "execute" && handlet.type === "execute")
    if (handles.type === "any" || handlet.type === "any") return true

    return handles.type === handlet.type

  }



  return <Handle {...props} isConnectable={isConnectable} isValidConnection={isValidConnection} />
}

function buildSlots(handlers: NodeIO[]) {
  const slots: [left: NodeIO, right: NodeIO][] = []

  for (const h of handlers) {
    if (h.direction == "input") {
      slots.push([h, null])
    }
  }

  for (let i = 0; i < handlers.length; i++) {
    const h = handlers[i]
    if (h.direction == "input") continue

    //find the first right empty slot
    let found = false
    for (let j = 0; j < slots.length; j++) {
      const s = slots[j]
      if (!s[1]) {
        slots[j] = [s[0], h]
        found = true
        break
      }
    }

    if (!found) {
      slots.push([null, h])
    }

  }
  return slots
}

function LeftRighWorkerHandle({ handles }: { handles: [NodeIO, NodeIO][] }) {

  return <div className="w-full">
    {handles.map((h, i) => {
      const left = h[0]
      const right = h[1]
      return <div className="flex" key={i}>
        <WorkerHandle handler={left} />
        <div className="flex-grow" />
        <WorkerHandle handler={right} />
      </div>
    })}
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
  const handlers = hs.filter(h => (h.type !== "execute"))
  const executeHandlers = hs.filter(h => (h.type == "execute"))

  const slots = buildSlots(handlers)
  const execSlots = buildSlots(executeHandlers)

  return <div className="my-2">
    <LeftRighWorkerHandle handles={slots} />
    <div className="h-2" />
    <LeftRighWorkerHandle handles={execSlots} />
  </div>

  // return <>
  //   {handlers.map((h) => <WorkerHandle key={h.id} handler={h} />)}
  //   {leftExec.map((h) => <WorkerHandle key={h.id} handler={h} />)}
  //   {rightExec.map((h) => <WorkerHandle key={h.id} handler={h} />)}
  // </>
}



