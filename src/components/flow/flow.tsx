import { useState, useCallback, useRef, useContext } from 'react'
import { addEdge, Background, Controls, ReactFlow, applyEdgeChanges, applyNodeChanges, Node, Edge, NodeChange, EdgeChange, OnConnect, Connection, useReactFlow, ReactFlowProvider } from '@xyflow/react'
import { nodeTypes } from './nodes/nodetypes'

const initialNodes: Node[] = [
  { id: '1', type: "template", position: { x: 100, y: 100 }, data: { label: 'Input' } },
  // { id: '2', type: "ai", position: { x: 200, y: 200 }, data: { label: 'AI' } },
  // { id: '3', type: "docgen", position: { x: 400, y: 500 }, data: { label: 'Transformer' } },
  // { id: '4', type: "schema", position: { x: 500, y: 500 }, data: { label: 'Transformer' } },
]

const initialNodes2: Node[] = [
  {
    "id": "1",
    "type": "template",
    "position": {
      "x": 51,
      "y": 256
    },
    "data": {
      "label": "Input"
    },
    "measured": {
      "width": 224,
      "height": 135
    },
    "selected": false,
    "dragging": false
  },
  {
    "id": "2",
    "type": "ai",
    "position": {
      "x": 351,
      "y": 336
    },
    "data": {
      "label": "AI"
    },
    "measured": {
      "width": 224,
      "height": 271
    },
    "selected": false,
    "dragging": false
  },
  {
    "id": "3",
    "type": "docgen",
    "position": {
      "x": 1034.2365553754103,
      "y": 619.2534271817364
    },
    "data": {
      "label": "Transformer"
    },
    "measured": {
      "width": 224,
      "height": 151
    },
    "selected": false,
    "dragging": false
  },
  {
    "id": "4",
    "type": "schema",
    "position": {
      "x": 693.1536028400477,
      "y": 451.6804920892271
    },
    "data": {
      "label": "Transformer"
    },
    "measured": {
      "width": 224,
      "height": 231
    },
    "selected": false,
    "dragging": false
  },
  {
    "id": "dndnode_0",
    "type": "decision",
    "position": {
      "x": 1035.834094929275,
      "y": 374.51458701850186
    },
    "data": {
      "label": "decision node"
    },
    "measured": {
      "width": 224,
      "height": 209
    },
    "selected": true,
    "dragging": false
  },
  {
    "id": "dndnode_1",
    "type": "notify",
    "position": {
      "x": 1425,
      "y": 450
    },
    "data": {
      "label": "notify node"
    }
  }
]

const initialEdges: Edge[] = [
  { id: 'e1-2', source: '1', target: '2', deletable: true },
  { id: 'e1-3', source: '2', target: '3' },
]

const initialEdges2: Edge[] = [
  {
    "id": "e1-2",
    "source": "1",
    "target": "2",
    "deletable": true
  },
  {
    "source": "2",
    "sourceHandle": "lab",
    "target": "4",
    "targetHandle": "input",
    "id": "xy-edge__2lab-4input"
  },
  {
    "source": "4",
    "sourceHandle": "dt",
    "target": "dndnode_0",
    "targetHandle": "input",
    "id": "xy-edge__4dt-dndnode_0input"
  },
  {
    "source": "dndnode_0",
    "sourceHandle": "true",
    "target": "dndnode_1",
    "targetHandle": "input",
    "id": "xy-edge__dndnode_0true-dndnode_1input"
  }
]


let id = 0
const getId = () => `dndnode_${id++}`

function DnDFlow() {

  const [nodes, setNodes] = useState(initialNodes)
  const [edges, setEdges] = useState(initialEdges)
  const { screenToFlowPosition } = useReactFlow()

  const onNodesChange = (changes: NodeChange[]) => {
    setNodes((nds) => {
      console.log(nds)
      return applyNodeChanges(changes, nds)
    })
  }

  const onEdgesChange = (changes: EdgeChange[]) => {
    setEdges((eds) => applyEdgeChanges(changes, eds))
  }

  const onConnect = (params: Connection) => {
    setEdges((eds) => {
      console.log(eds)
      return addEdge(params, eds)
    })
  }

  const onDragOver = useCallback((event) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    const type = event.dataTransfer.getData("nodeType")
    if (!type) return

    const position = screenToFlowPosition({ x: event.clientX, y: event.clientY, })
    const newNode: Node = {
      id: getId(),
      type,
      position,
      data: { label: `${type} node` },
    }

    setNodes((nds) => nds.concat(newNode))

  }, [screenToFlowPosition])


  return <div style={{ height: '100%' }}>
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onDrop={onDrop}
      onDragOver={onDragOver}

      className='bg-sky-50'
      nodeTypes={nodeTypes}
    >
      <Background />
      <Controls />
    </ReactFlow>
  </div>


}

export function FlowDesigner() {
  return <ReactFlowProvider>
    <DnDFlow />
  </ReactFlowProvider>
}
