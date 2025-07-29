import { addEdge, applyEdgeChanges, applyNodeChanges, Background, Connection, Controls, Edge, EdgeChange, Node, NodeChange, Panel, ReactFlow, ReactFlowProvider, useEdges, useReactFlow, MiniMap } from '@xyflow/react'
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
import { TooltipNode } from './nodes/tooltip'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Parentheses, BrainCog, Wrench, BugOff } from 'lucide-react'
import { Button } from '@/components/ui/button'

// Function to generate rotating colors for icons
const getIconColor = (index: number) => {
  const colors = [
    'text-purple-600', // Purple
    'text-orange-600', // Orange
    'text-pink-600',   // Pink
    'text-blue-600',   // Blue
    'text-green-600',  // Green
    'text-red-600',    // Red
    'text-indigo-600', // Indigo
    'text-teal-600',   // Teal
    'text-yellow-600', // Yellow
    'text-cyan-600',   // Cyan
    'text-emerald-600', // Emerald
    'text-violet-600', // Violet
  ]
  return colors[index % colors.length]
}

// Function to generate background colors for icon containers
const getIconBackgroundColor = (index: number) => {
  const backgroundColors = [
    'bg-purple-100', // Light purple
    'bg-orange-100', // Light orange
    'bg-pink-100',   // Light pink
    'bg-blue-100',   // Light blue
    'bg-green-100',  // Light green
    'bg-red-100',    // Light red
    'bg-indigo-100', // Light indigo
    'bg-teal-100',   // Light teal
    'bg-yellow-100', // Light yellow
    'bg-cyan-100',   // Light cyan
    'bg-emerald-100', // Light emerald
    'bg-violet-100', // Light violet
  ]
  return backgroundColors[index % backgroundColors.length]
}

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
  tooltip: TooltipNode,
}

function Flow(props: { onAgentUpdate?: () => void; onShowChat?: () => void }) {

  const [nodes, setNodes] = useState([])
  const [edges, setEdges] = useState([])
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [colorUpdateTrigger, setColorUpdateTrigger] = useState(0)
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

  // Add global drop handler for debugging
  useEffect(() => {
    const handleGlobalDrop = (event: DragEvent) => {
      console.log("Global drop event!")
      console.log("Global drop dataTransfer types:", event.dataTransfer?.types)
      if (event.dataTransfer) {
        console.log("Global drop nodeType:", event.dataTransfer.getData("nodeType"))
      }
    }

    document.addEventListener('drop', handleGlobalDrop)
    return () => document.removeEventListener('drop', handleGlobalDrop)
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
    event.stopPropagation()
    event.dataTransfer.dropEffect = 'move'
    console.log("DragOver event on ReactFlow")
    // Add visual feedback
    event.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.1)'
  }, [])

  const onDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.currentTarget.style.backgroundColor = ''
  }, [])

  const onDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    console.log("Drop event triggered!")
    console.log("Event target:", event.target)
    console.log("Event currentTarget:", event.currentTarget)
    event.preventDefault()
    event.stopPropagation()
    
    // Reset background color
    event.currentTarget.style.backgroundColor = ''
    
    const nodeType = event.dataTransfer.getData("nodeType")
    console.log("Drop event received, nodeType:", nodeType)
    console.log("All dataTransfer types:", event.dataTransfer.types)
    console.log("All dataTransfer items:", event.dataTransfer.items)

    if (!nodeType) {
      console.log("No nodeType found in drop event")
      return
    }

    const type = nodeType as WorkerTypes
    console.log("Creating node of type:", type)

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
    if (!factory) {
      console.log("No factory found for type:", type)
      toast("Unknown node type: " + type)
      return
    }
    
    try {
      const position = screenToFlowPosition({ x: event.clientX, y: event.clientY, })
      console.log("Drop position:", position)
      
      const worker = factory.create(app.agent)
      worker.config.x = position.x
      worker.config.y = position.y

      const node = {
        id: worker.config.id,
        type: worker.config.type,
        position,
        data: {}
      }

      console.log("Adding node:", node)
      setNodes((nds) => nds.concat(node))
      
      toast(`Added ${factory.title} to flow`)
    } catch (error) {
      console.error("Error creating node:", error)
      toast("Error creating node: " + error.message)
    }
  }, [screenToFlowPosition])

  const onDelete = useCallback(({ nodes }: { nodes: Node[]; edges: Edge[] }): void => {
    if (nodes && nodes.length > 0) {
      for (const node of nodes) {
        app.agent.deleteWorker(node.id)
      }
    }
  }, [])

  const addNodeToFront = (nodeType: string) => {
    const factory = workerRegistry[nodeType] as WorkerRegistryItem
    if (!factory) {
      console.error("No factory found for type:", nodeType)
      toast("Unknown node type: " + nodeType)
      return
    }

    try {
      const position = screenToFlowPosition({ x: 100, y: 100 }) // Example position
      const worker = factory.create(app.agent)
      worker.config.x = position.x
      worker.config.y = position.y

      const node = {
        id: worker.config.id,
        type: worker.config.type,
        position,
        data: {}
      }

      setNodes((nds) => [node, ...nds])
      toast(`Added ${factory.title} to front of flow`)
    } catch (error) {
      console.error("Error adding node to front:", error)
      toast("Error adding node to front: " + error.message)
    }
  }


  return <div className='flex-1'>
    <div 
      className="w-full h-full"
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDelete={onDelete}
        className={`!bg-sky-50`}
        nodeTypes={nodeTypes}
        edgeTypes={{ customEdge: ButtonEdge }}
        fitView
        minZoom={0.1}
      >
        <Background />
        <Controls />
        <MiniMap />
        <Panel position="top-left" className="!bg-transparent !border-none !shadow-none">
          <div className="absolute left-0 top-12 flex flex-col space-y-1 bg-slate-50 p-2 rounded-md border border-slate-300">
            <DropdownMenu open={openDropdown === 'io'} onOpenChange={(open) => setOpenDropdown(open ? 'io' : null)}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-600 hover:text-slate-900 hover:bg-slate-100" title="Input & Output">
                  <Parentheses size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="right" align="start" className="w-[480px]" sideOffset={0}>
                <div className="p-2">
                  <h3 className="font-semibold text-base text-gray-900">Input & Output</h3>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  <div className="grid grid-cols-2 gap-1 p-2">
                    {Object.entries(workerRegistry).filter(([key, node]) => node.category == "io").map(([key, node], index) => (
                      <div 
                        key={key} 
                        className="flex items-center gap-2 p-2 cursor-move hover:bg-accent rounded-sm select-none"
                        draggable
                        onDragStart={(event) => {
                          console.log('Drag start for IO:', key)
                          event.dataTransfer.setData('nodeType', key)
                          event.dataTransfer.effectAllowed = 'move'
                          // Set a visual indicator
                          event.dataTransfer.setDragImage(event.currentTarget, 0, 0)
                          console.log('Drag started for:', key)
                          // Close the dropdown when dragging starts
                          setOpenDropdown(null)
                        }}
                        onDragEnd={(event) => {
                          console.log('Drag end for IO:', key)
                        }}
                        onClick={(event) => {
                          // Quick click - add to front of flow
                          console.log('Quick click - adding to front:', key)
                          addNodeToFront(key)
                        }}
                      >
                        <div className={`${getIconBackgroundColor(index)} rounded-md p-1`}>
                          <node.icon size={16} className={getIconColor(index)} />
                        </div>
                        <div>
                          <div className="font-medium">{node.title}</div>
                          <div className="text-xs text-muted-foreground">{node.description}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <DropdownMenu open={openDropdown === 'generator'} onOpenChange={(open) => setOpenDropdown(open ? 'generator' : null)}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-600 hover:text-slate-900 hover:bg-slate-100" title="Generators">
                  <BrainCog size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="right" align="start" className="w-[480px]" sideOffset={0}>
                <div className="p-2">
                  <h3 className="font-semibold text-base text-gray-900">Generators</h3>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  <div className="grid grid-cols-2 gap-1 p-2">
                    {Object.entries(workerRegistry).filter(([key, node]) => node.category == "generator").map(([key, node], index) => (
                      <div 
                        key={key} 
                        className="flex items-center gap-2 p-2 cursor-move hover:bg-accent rounded-sm select-none"
                        draggable
                        onDragStart={(event) => {
                          console.log('Drag start for Generator:', key)
                          event.dataTransfer.setData('nodeType', key)
                          event.dataTransfer.effectAllowed = 'move'
                          // Set a visual indicator
                          event.dataTransfer.setDragImage(event.currentTarget, 0, 0)
                          console.log('Drag started for:', key)
                          // Close the dropdown when dragging starts
                          setOpenDropdown(null)
                        }}
                        onDragEnd={(event) => {
                          console.log('Drag end for Generator:', key)
                        }}
                        onClick={(event) => {
                          // Quick click - add to front of flow
                          console.log('Quick click - adding to front:', key)
                          addNodeToFront(key)
                        }}
                      >
                        <div className={`${getIconBackgroundColor(index)} rounded-md p-1`}>
                          <node.icon size={16} className={getIconColor(index)} />
                        </div>
                        <div>
                          <div className="font-medium">{node.title}</div>
                          <div className="text-xs text-muted-foreground">{node.description}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <DropdownMenu open={openDropdown === 'tool'} onOpenChange={(open) => setOpenDropdown(open ? 'tool' : null)}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-600 hover:text-slate-900 hover:bg-slate-100" title="Tools">
                  <Wrench size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="right" align="start" className="w-[480px]" sideOffset={0}>
                <div className="p-2">
                  <h3 className="font-semibold text-base text-gray-900">Tools</h3>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  <div className="grid grid-cols-2 gap-1 p-2">
                    {Object.entries(workerRegistry).filter(([key, node]) => node.category == "tool").map(([key, node], index) => (
                      <div 
                        key={key} 
                        className="flex items-center gap-2 p-2 cursor-move hover:bg-accent rounded-sm select-none"
                        draggable
                        onDragStart={(event) => {
                          console.log('Drag start for Tool:', key)
                          event.dataTransfer.setData('nodeType', key)
                          event.dataTransfer.effectAllowed = 'move'
                          // Set a visual indicator
                          event.dataTransfer.setDragImage(event.currentTarget, 0, 0)
                          console.log('Drag started for:', key)
                          // Close the dropdown when dragging starts
                          setOpenDropdown(null)
                        }}
                        onDragEnd={(event) => {
                          console.log('Drag end for Tool:', key)
                        }}
                        onClick={(event) => {
                          // Quick click - add to front of flow
                          console.log('Quick click - adding to front:', key)
                          addNodeToFront(key)
                        }}
                      >
                        <div className={`${getIconBackgroundColor(index)} rounded-md p-1`}>
                          <node.icon size={16} className={getIconColor(index)} />
                        </div>
                        <div>
                          <div className="font-medium">{node.title}</div>
                          <div className="text-xs text-muted-foreground">{node.description}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
              
            <DropdownMenu open={openDropdown === 'debug'} onOpenChange={(open) => setOpenDropdown(open ? 'debug' : null)}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-600 hover:text-slate-900 hover:bg-slate-100" title="Debug">
                  <BugOff size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="right" align="start" className="w-[480px]" sideOffset={0}>
                <div className="p-2">
                  <h3 className="font-semibold text-base text-gray-900">Debug</h3>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  <div className="grid grid-cols-2 gap-1 p-2">
                    {Object.entries(workerRegistry).filter(([key, node]) => node.category == "debug").map(([key, node], index) => (
                      <div 
                        key={key} 
                        className="flex items-center gap-2 p-2 cursor-move hover:bg-accent rounded-sm select-none"
                        draggable
                        onDragStart={(event) => {
                          console.log('Drag start for Debug:', key)
                          event.dataTransfer.setData('nodeType', key)
                          event.dataTransfer.effectAllowed = 'move'
                          // Set a visual indicator
                          event.dataTransfer.setDragImage(event.currentTarget, 0, 0)
                          console.log('Drag started for:', key)
                          // Close the dropdown when dragging starts
                          setOpenDropdown(null)
                        }}
                        onDragEnd={(event) => {
                          console.log('Drag end for Debug:', key)
                        }}
                        onClick={(event) => {
                          // Quick click - add to front of flow
                          console.log('Quick click - adding to front:', key)
                          addNodeToFront(key)
                        }}
                      >
                        <div className={`${getIconBackgroundColor(index)} rounded-md p-1`}>
                          <node.icon size={16} className={getIconColor(index)} />
                        </div>
                        <div>
                          <div className="font-medium">{node.title}</div>
                          <div className="text-xs text-muted-foreground">{node.description}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </Panel>
        <Panel position="top-right" className="!bg-transparent !border-none !shadow-none">
          <Toolbar onShowChat={props.onShowChat} />
        </Panel>
      </ReactFlow>
    </div>
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
    <ReactFlowProvider>
      <div className='w-full flex-grow flex'>
        <Flow onAgentUpdate={onAgentUpdate} onShowChat={onShowChat} />
        {showChat && <ChatFlow />}
      </div>
      <Toaster />
    </ReactFlowProvider>
  </>

}
