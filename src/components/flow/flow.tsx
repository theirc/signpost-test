import { addEdge, applyEdgeChanges, applyNodeChanges, Background, Connection, Controls, Edge, EdgeChange, Node, NodeChange, Panel, ReactFlow, ReactFlowProvider, useEdges, useReactFlow } from '@xyflow/react'
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Toolbar } from './menu'
import { toast, Toaster } from "sonner"
import { app } from '@/lib/app'
import { workerRegistry } from '@/lib/agents/registry'

import { ButtonEdge } from './edges'
import { RequestNode } from './nodes/input'
import { SchemaNode } from './nodes/schema'
import { ResponseNode } from './nodes/response'
// import { ConditionNode } from './nodes/condition'
import { TextNode } from './nodes/text'
import { AINode } from './nodes/ai'
// import { SpeechToText } from './nodes/stt'
// import { BackgroundNode } from './nodes/backgroundstart'
import { Skeleton } from '../ui/skeleton'
import { agents } from '@/lib/data'
import { buildAgent } from '@/lib/agents'
import { CombineNode } from './nodes/combine'
import { display } from '@/lib/agents/workers/display'
import { DisplayNode } from './nodes/diisplay'
import { MockNode } from './nodes/mock'
import { useForceUpdate } from '@/lib/utils'

const nodeTypes = {
  request: RequestNode,
  schema: SchemaNode,
  response: ResponseNode,
  // condition: ConditionNode,
  text: TextNode,
  ai: AINode,
  // stt: SpeechToText,
  // background: BackgroundNode,
  combine: CombineNode,
  display: DisplayNode,
  mock: MockNode,
}

function Flow() {

  const [nodes, setNodes] = useState([])
  const [edges, setEdges] = useState([])
  const counter = useRef(0)
  const { screenToFlowPosition, updateNode } = useReactFlow()
  const { agent } = app
  const update = useForceUpdate()

  useEffect(() => {
    const initialNodes: Node[] = []
    for (const key in agent.workers) {
      const w = agent.workers[key]
      initialNodes.push({
        id: w.config.id,
        data: w.config,
        type: w.config.type,
        position: { x: w.config.x, y: w.config.y },
      })
    }
    setNodes(initialNodes)
    const initialEdges: Edge[] = []
    for (const key in agent.edges) {
      const e = agent.edges[key]
      initialEdges.push({ id: key, source: e.source, target: e.target, sourceHandle: e.sourceHandle, targetHandle: e.targetHandle })
    }
    setEdges(initialEdges)

  }, [])


  agent.update = () => {
    if (agent.currentWorker) {
      counter.current++
      setNodes((nds) =>
        nds.map((node) => {
          return {
            ...node,
            data: {
              ...node.data,
              label: counter.current.toString(),
            },
          }
        }),
      )
      console.log(`Executing Worker: '${agent.currentWorker.config.type}' `, agent.currentWorker)
    }
    update()
  }


  const onNodesChange = (changes: NodeChange[]) => {
    for (const change of changes) {
      if (change.type === 'position') {
        const w = app.agent.workers[change.id]
        if (!w) continue
        w.config.x = change.position.x
        w.config.y = change.position.y
      }
    }
    setNodes((nds) => applyNodeChanges(changes, nds))
  }

  const onEdgesChange = (changes: EdgeChange[]) => {
    for (const change of changes) {
      if (change.type === 'remove') delete app.agent.edges[change.id]
    }
    // console.log("Edges changed:", app.agent.edges)

    setEdges((eds) => applyEdgeChanges(changes, eds))
  }

  const onConnect = (c: Connection) => {
    // console.log("Connect:", c)

    const workers = app.agent.workers[c.source]
    const handle = workers.handles[c.sourceHandle]


    if (handle.type === "execute") {
      c = { ...c, type: 'executeEdge', animated: true } as any
    }

    setEdges((eds) => {
      const added = addEdge(c, eds)
      for (const edge of added) {
        app.agent.edges[edge.id] = edge
      }
      // console.log("Added edge:", app.agent.edges)
      return added
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


    if (type == "request" && app.agent.hasInput()) {
      toast("Only one Input is allowed.", {
        action: { label: "Ok", onClick: null, },
      })
      return
    }

    if (type == "response" && app.agent.hasResponse()) {
      toast("Only one Response is allowed.", {
        action: { label: "Ok", onClick: null, },
      })
      return
    }

    const factory = workerRegistry[type] as WorkerRegistryItem
    if (!factory) return
    const position = screenToFlowPosition({ x: event.clientX, y: event.clientY, })
    const worker = factory.create(app.agent)
    worker.config.x = position.x
    worker.config.y = position.y

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

  return <div className='w-full h-full'>
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDelete={onDelete}
      className='!bg-sky-50'
      nodeTypes={nodeTypes}
      edgeTypes={{ executeEdge: ButtonEdge }}
      fitView
    >
      <Background />
      <Controls />
    </ReactFlow>
  </div>
}


export function FlowDesigner({ id }: { id?: string }) {

  const isLoading = useRef(false)
  const [agent, setAgent] = useState<Agent>(null)

  useEffect(() => {
    console.log("Loading agent:", id)
    if (isLoading.current) return
    isLoading.current = true
    if (id == "new") {
      app.agent = buildAgent({
        title: "New Agent",
      })
      setAgent(app.agent)
    } else {
      agents.loadAgent(id as any).then((a) => {
        console.log("Agent loaded:", a)
        app.agent = a
        setAgent(a)
      })
    }
  }, [])



  if (!agent) return <div className='size-full p-4'>
    <div className="space-y-2">
      <Skeleton className="h-8 w-full" />
      <Skeleton className="w-full h-96" />
    </div>
  </div>

  return <>
    <Toolbar />
    <ReactFlowProvider>
      <Flow />
      <Toaster />
    </ReactFlowProvider>
  </>
}

