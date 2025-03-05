import { LabeledHandle } from "@/components/labeled-handle"
import { Position, useReactFlow } from '@xyflow/react'
import { GitFork } from "lucide-react"
import { NodeLayout } from './node'
import { NodeTitle } from './title'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useState, useEffect } from "react"

interface HandleButtonProps {
  id: string;
  title: string;
  type: 'source' | 'target';
  position: Position;
  onClick: () => void;
}

const HandleButton = ({ id, title, type, position, onClick }: HandleButtonProps) => (
  <div 
    className="flex items-center gap-1 group cursor-pointer" 
    onClick={onClick}
  >
    <LabeledHandle 
      id={id}
      title={title} 
      type={type} 
      position={position}
    />
  </div>
)

export function DecisionNode({ data, isConnectable }) {
  const [operator, setOperator] = useState(data.operator || 'equals')
  const [compareValue, setCompareValue] = useState(data.compareValue || '')
  const [showInput, setShowInput] = useState(false)
  const { getEdges, getNode } = useReactFlow()

  const operators = [
    { value: 'equals', label: 'Equals' },
    { value: 'notEquals', label: 'Not Equals' },
    { value: 'greaterThan', label: 'Greater Than' },
    { value: 'lessThan', label: 'Less Than' },
    { value: 'contains', label: 'Contains' },
  ]

  // Effect to evaluate decision when inputs change
  useEffect(() => {
    evaluateDecision()
  }, [operator, compareValue, data?.input])

  // Function to get input node's content
  const getInputContent = () => {
    if (!data.id) return "No node ID available";

    const edges = getEdges();

    // Find edge connected to our input
    const inputEdge = edges.find(
      (edge) => edge.target === data.id && edge.targetHandle === "input"
    );

    if (!inputEdge) return "No input connected";

    // Get the source node
    const sourceNode = getNode(inputEdge.source);
    if (!sourceNode) return "Input node not found";

    return sourceNode.data?.content as string || "No content available"; // Type assertion here
  }

  const evaluateDecision = () => {
    const inputContent = getInputContent()
    if (!inputContent || inputContent === 'No input connected') {
      return
    }

    let result = false
    const input = String(inputContent).trim()
    const compare = String(compareValue).trim()

    switch (operator) {
      case 'equals':
        result = input === compare
        break
      case 'notEquals':
        result = input !== compare
        break
      case 'greaterThan':
        result = Number(input) > Number(compare)
        break
      case 'lessThan':
        result = Number(input) < Number(compare)
        break
      case 'contains':
        result = input.toLowerCase().includes(compare.toLowerCase())
        break
      default:
        result = false
    }

    // Update node data with result
    if (data.onChange) {
      data.onChange({ 
        operator,
        compareValue,
        result,
        lastUpdated: new Date().toISOString()
      })
    }
  }

  return <NodeLayout>
    <NodeTitle title="Decision" icon={GitFork} />
    
    <div className="flex flex-col w-full">
      {/* Handles Section */}
      <div className="flex justify-between px-3 py-1">
        {/* Left Side Handle */}
        <div>
          <HandleButton
            id="input"
            title="Input"
            type="target"
            position={Position.Left}
            onClick={() => setShowInput(true)}
          />
        </div>
        
        {/* Right Side Handles */}
        <div className="flex flex-col gap-2">
          <HandleButton
            id="true"
            title="True"
            type="source"
            position={Position.Right}
            onClick={() => {}}
          />
          <HandleButton
            id="false"
            title="False"
            type="source"
            position={Position.Right}
            onClick={() => {}}
          />
        </div>
      </div>

      {/* Main Content Section */}
      <div className="p-4 space-y-4">
        <div>
          <Label>Operator</Label>
          <Select 
            value={operator}
            onValueChange={(value) => {
              setOperator(value)
              if (data.onChange) {
                data.onChange({ operator: value })
              }
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select operator" />
            </SelectTrigger>
            <SelectContent>
              {operators.map(op => (
                <SelectItem key={op.value} value={op.value}>
                  {op.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Compare Value</Label>
          <Input
            placeholder="Enter value to compare against..."
            value={compareValue}
            onChange={(e) => {
              setCompareValue(e.target.value)
              if (data.onChange) {
                data.onChange({ compareValue: e.target.value })
              }
            }}
            className="w-full"
          />
        </div>

        <div className="text-sm text-muted-foreground">
          if (input {operator} {compareValue || '...'})
        </div>
      </div>

      {/* Input Preview Dialog */}
      <Dialog open={showInput} onOpenChange={setShowInput}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Input Content</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <div className="bg-accent p-4 rounded-md">
              <div 
                className="whitespace-pre-wrap text-sm"
                dangerouslySetInnerHTML={{ 
                  __html: getInputContent()
                }}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  </NodeLayout>
}





