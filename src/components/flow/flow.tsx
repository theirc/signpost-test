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
import { PromptAgentNode } from './nodes/promptAgent'
import { HandoffAgentNode } from './nodes/handoffAgent'
import { TemplateNode } from './nodes/template'
import { ChatHistoryNode } from './nodes/chathistory'
import { ChatFlow } from './chat'
import { StructuredOutputNode } from './nodes/structuredoutput'

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
  promptAgent: PromptAgentNode,
  handoffAgent: HandoffAgentNode,
  template: TemplateNode,
  chatHistory: ChatHistoryNode,
  structured: StructuredOutputNode,
}

function Flow(props: { onAgentUpdate?: () => void }) {

  const [nodes, setNodes] = useState([])
  const [edges, setEdges] = useState([])
  const counter = useRef(0)
  const { screenToFlowPosition } = useReactFlow()
  const { agent } = app

  useEffect(() => {
    const initialNodes: Node[] = []
    for (const key in agent.workers) {
      const w = agent.workers[key]
      const newNode: Node = {
        id: w.config.id,
        data: {},
        type: w.config.type,
        position: { x: w.config.x, y: w.config.y },
      }

      //ToDo: Fix me
      if (w.type === "ai" || w.type === "promptAgent" || w.type === "handoffAgent") {
        if (w.config.width && w.config.height) {
          newNode.width = w.config.width
          newNode.height = w.config.height
        }

      }

      initialNodes.push(newNode)
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
    if (props.onAgentUpdate) props.onAgentUpdate()
  }

  const onNodesChange = (changes: NodeChange[]) => {
    for (const change of changes) {
      if (change.type === 'position') {
        const w = app.agent.workers[change.id]
        if (!w) continue
        w.config.x = change.position.x
        w.config.y = change.position.y

      }
      if (change.type == "dimensions") {
        const w = app.agent.workers[change.id]
        if (!w) continue
        if (!change.resizing) {
          // console.log("Node resized:", change.id, change.dimensions)
          w.config.width = change.dimensions.width
          w.config.height = change.dimensions.height
        }
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
    // console.log("Connect:", c)
    const worker = app.agent.workers[c.source]
    // const handle = worker.handles[c.sourceHandle]
    worker.updateWorker()
    c = { ...c, type: 'customEdge' } as any
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
    // console.log("DragOver:", event.dataTransfer.getData("nodeType"))

  }, [])

  const onDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    // console.log("Drop:", event.dataTransfer.getData("nodeType"))

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



  return <div className='flex-1'>
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
  const [conversational, setConversational] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const update = useForceUpdate()

  useEffect(() => {
    // console.log("Loading agent:", id)
    if (isLoading.current) return
    isLoading.current = true
    if (id == "new") {
      app.agent = agents.createAgent({
        title: "Create Agent",
      })
      setAgent(app.agent)
    } else {
      app.state.agentLoading = true
      agents.loadAgent(id as any).then((a) => {
        // console.log("Agent loaded:", a)
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

  function onAgentUpdate() {
    // console.log("Agent updated, isConversational: ", app.agent.isConversational)
    setConversational(app.agent.isConversational)
    update()
  }

  function onShowChat() {
    // console.log("show chat", conversational)
    setShowChat(s => !s)
  }

  return <>
    <Toolbar onShowChat={onShowChat} />
    <ReactFlowProvider>
      <div className='w-full flex-grow flex'>
        {showChat && <ChatFlow />}
        <Flow onAgentUpdate={onAgentUpdate} />
      </div>
      <Toaster />
    </ReactFlowProvider>
  </>

}
