import { app } from "@/lib/app"
import { Connection, Handle, HandleProps, Position, useNodeConnections } from "@xyflow/react"
import { Binary, CircleHelp, Hash, Headphones, Image, MessageCircleMore, Type, Video } from "lucide-react"
import React, { useContext } from "react"
import { MemoizedWorker } from "./memoizedworkers"
import { cn } from "@/lib/utils"
import { useWorkerContext } from "./hooks"
import { HanlderIcon } from "./handlericon"
import { createModel } from "@/lib/data/model"
import { boolean, number } from "zod"
import { useForm } from "../forms/hooks"
import { Input, InputTextArea, Row, Select } from "../forms"

type WorkerHandleProps = Partial<HandleProps> & React.HTMLAttributes<HTMLDivElement> & {
  handler?: NodeIO
  mockable?: boolean
}

const model = createModel({
  fields: {
    text: { title: "Text", type: "string" },
    number: { title: "Text", type: "number" },
  }
})

function Mockable({ handle }: { handle: NodeIO }) {

  const { form, m, watch } = useForm(model, {
    values: {
      text: handle.mock,
      number: Number(handle.mock) || 0,
    }
  })

  watch((value, { name }) => {
    if (name === "text") handle.mock = value.text
    if (name === "number") handle.mock = Number(value.number) || 0
  })

  return <form.context>
    <div className='px-2 nodrag w-full flex-grow flex flex-col'>
      {handle.type === "string" && <Row className='py-2'>
        <InputTextArea field={m.text} span={12} hideLabel />
      </Row>}
      {handle.type === "number" && <Row className='py-2'>
        <Input field={m.text} type="number" span={12} hideLabel />
      </Row>}
    </div>
  </form.context>

}



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
  }

  function isValidConnection(e: Connection) {

    const workers = app.agent.workers[e.source]
    const workert = app.agent.workers[e.target]
    if (!workers || !workert) return false
    const handles = workers.handles[e.sourceHandle]
    const handlet = workert.handles[e.targetHandle]
    if (!handles || !handlet) return false

    if (handlet.condition && handles.type != "boolean" && handles.type != "number" && handles.type != "string") return false

    if (handlet.type === "unknown") return true
    if (handles.type === "unknown") return true

    if (handles.type == "enum" && handlet.type == "string") return true
    if (handles.type == "enum" && handlet.type == "number") return true

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

export function WorkerLabeledHandle({ handler, mockable, ...props }: WorkerHandleProps) {
  const ct = useWorkerContext()
  if (!handler) return null

  function onClick() {
    if (handler.system) return
    ct?.onEdit?.(handler)
  }

  if (handler.type != "string" && handler.type != "number") mockable = false

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
      {handler.direction == "output" && <div className="mr-[6px]">
        <HanlderIcon handler={handler} worker={ct?.worker} />
      </div>}
    </div>
    {mockable && <Mockable handle={handler} />}
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



export function NodeHandlers({ worker, mockable }: { worker: AIWorker, mockable?: boolean }) {
  return <MemoizedWorker worker={worker}>
    <InternalNodeHandlers worker={worker} mockable={mockable} />
  </MemoizedWorker>
}


function InternalNodeHandlers(props: { worker: AIWorker, mockable?: boolean }) {
  const { worker } = props
  const hs = Object.values(worker.handles).filter(h => !h.system)
  const handlers = hs
  return <div className="my-2">
    {handlers.map((h, i) => <WorkerLabeledHandle key={i} handler={h} mockable={props.mockable} />)}
  </div>
}


