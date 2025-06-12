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
import { STTNode } from './nodes/stt'
import { TTSNode } from './nodes/tts'
// import { BackgroundNode } from './nodes/backgroundstart'
import { Skeleton } from '../ui/skeleton'
import { agentsModel } from '@/lib/data'
import { agents } from '@/lib/agents'
import { CombineNode } from './nodes/combine'
import { display } from '@/lib/agents/workers/display'
import { DisplayNode } from './nodes/diisplay'
import { MockNode } from './nodes/mock'
import { useForceUpdate } from '@/lib/utils'
import { SearchNode } from './nodes/search'
import { AgentNode } from './nodes/agent'
import { ApiNode } from './nodes/api'
import { DocumentSelectorNode } from './nodes/documentselector'
import { StateNode } from './nodes/state'
import { translate } from '@/lib/agents/workers/translate'
import { TranslateNode } from './nodes/translate'

const nodeTypes = {
  request: RequestNode,
  schema: SchemaNode,
  response: ResponseNode,
  text: TextNode,
  ai: AINode,
  combine: CombineNode,
  display: DisplayNode,
  mock: MockNode,
  search: SearchNode,
  agentWorker: AgentNode,
  api: ApiNode,
  documentSelector: DocumentSelectorNode,
  state: StateNode,
  stt: STTNode,
  tts: TTSNode,
  translate: TranslateNode,
}

function Flow() {

  const [nodes, setNodes] = useState([])
  const [edges, setEdges] = useState([])
  const counter = useRef(0)
  const { screenToFlowPosition, updateNode } = useReactFlow()
  const { agent } = app

  useEffect(() => {
    const initialNodes: Node[] = []
    for (const key in agent.workers) {
      const w = agent.workers[key]
      initialNodes.push({
        id: w.config.id,
        data: {},
        type: w.config.type,
        position: { x: w.config.x, y: w.config.y },
      })
    }
    setNodes(initialNodes)
    const initialEdges: Edge[] = []
    for (const key in agent.edges) {
      const e = agent.edges[key]
      initialEdges.push({ id: key, source: e.source, target: e.target, sourceHandle: e.sourceHandle, targetHandle: e.targetHandle, type: "customEdge" })
    }
    setEdges(initialEdges)

  }, [])


  agent.update = () => {
    // console.log("Flow Update, currentWorker: ", agent.currentWorker?.config.type || "null")
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
    if (agent.currentWorker) {
      // console.log(`Executing Worker: '${agent.currentWorker.config.type}' `, agent.currentWorker)
    }
    // update()
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

    agent.updateWorkers()
    agent.update()

  }

  const onConnect = (c: Connection) => {
    console.log("Connect:", c)

    console.log("Agent: ", app.agent)



    const worker = app.agent.workers[c.source]
    const handle = worker.handles[c.sourceHandle]
    worker.updateWorker()


    // if (handle.type === "execute") {
    c = { ...c, type: 'customEdge' } as any
    // }

    setEdges((eds) => {
      const added = addEdge(c, eds)
      for (const edge of added) {
        app.agent.edges[edge.id] = edge
      }
      return added
    })

    agent.updateWorkers()
    agent.update()

  }

  const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
    console.log("DragOver:", event.dataTransfer.getData("nodeType"))

  }, [])

  const onDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    console.log("Drop:", event.dataTransfer.getData("nodeType"))

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

  return <div className='w-full h-full pb-10'>
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
      edgeTypes={{ customEdge: ButtonEdge }}
      fitView
      minZoom={0.2}
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
      app.agent = agents.createAgent({
        title: "New Agent",
      })
      setAgent(app.agent)
    } else {
      app.state.agentLoading = true
      agents.loadAgent(id as any).then((a) => {
        console.log("Agent loaded:", a)
        app.agent = a
        setAgent(a)
        app.state.agentLoading = false
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

