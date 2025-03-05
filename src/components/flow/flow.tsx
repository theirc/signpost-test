import { addEdge, applyEdgeChanges, applyNodeChanges, Background, Connection, Controls, Edge, EdgeChange, Node, NodeChange, Panel, ReactFlow, ReactFlowProvider, useReactFlow } from '@xyflow/react'
import { useCallback, useState } from 'react'
import { Toolbar } from './menu'
import { toast, Toaster } from "sonner"
import { app } from '@/lib/app'
import { workerRegistry } from '@/lib/agents/registry'

import { ButtonEdge } from './edges'
import { RequestNode } from './nodes/input'
import { SchemaNode } from './nodes/schema'
import { SelecthNode } from './nodes/select'
import { ResponseNode } from './nodes/response'
import { ConditionNode } from './nodes/condition'
import { TextNode } from './nodes/text'
import { AINode } from './nodes/ai'
import { SpeechToText } from './nodes/stt'
import { BackgroundNode } from './nodes/backgroundstart'

const nodeTypes = {
  request: RequestNode,
  schema: SchemaNode,
  select: SelecthNode,
  response: ResponseNode,
  condition: ConditionNode,
  text: TextNode,
  ai: AINode,
  stt: SpeechToText,
  background: BackgroundNode,
}

function DnDFlow() {
  const [nodes, setNodes] = useState([])
  const [edges, setEdges] = useState([])
  const { screenToFlowPosition } = useReactFlow()

  const onNodesChange = (changes: NodeChange[]) => {
    setNodes((nds) => {
      return applyNodeChanges(changes, nds)
    })
  }

  const onEdgesChange = (changes: EdgeChange[]) => {
    setEdges((eds) => {
      return applyEdgeChanges(changes, eds)
    })
  }

  const onConnect = (c: Connection) => {

    const workers = app.agent.workers[c.source]
    const handle = workers.handlers[c.sourceHandle]

    if (handle.type === "execute") {
      c = { ...c, type: 'executeEdge', animated: true } as any
    }

    setEdges((eds) => {
      return addEdge(c, eds)
    })
  }

  const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    const type = event.dataTransfer.getData("nodeType") as WorkerTypes
    if (!type) return
    if (type == "request" && app.agent.hasInput()) return

    const factory = workerRegistry[type] as WorkerRegistryItem
    if (!factory) return
    const position = screenToFlowPosition({ x: event.clientX, y: event.clientY, })
    const worker = factory.create(app.agent)

    const node = {
      id: worker.config.id,
      type: worker.config.type,
      position,
      data: {}
    }

    setNodes((nds) => nds.concat(node))
  }, [screenToFlowPosition])



  const onDelete = useCallback(({ nodes }: { nodes: Node[]; edges: Edge[] }): void => {
    if (nodes && nodes.length > 0) {
      for (const node of nodes) {
        app.agent.deleteWorker(node.id)
      }
    }

  }, [])

  return <div style={{ height: '100%' }}>
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDelete={onDelete}
      className='bg-sky-50'
      nodeTypes={nodeTypes}
      edgeTypes={{ executeEdge: ButtonEdge }}
    >
      <Background />
      <Controls />
    </ReactFlow>
  </div>
}

export function FlowDesigner() {

  function onSave() {
    toast("The flow was saved", {
      description: "Not Implemented!",
      action: {
        label: "Ok",
        onClick: () => console.log("Ok"),
      },
    })
  }
  return <>
    <Toolbar onSave={onSave} />
    <ReactFlowProvider>
      <DnDFlow />
      <Toaster />
    </ReactFlowProvider>
  </>
}
