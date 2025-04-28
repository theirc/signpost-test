// import { LabeledHandle } from "@/components/labeled-handle"
// import { Button } from "@/components/ui/button"
// import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, } from "@/components/ui/dialog"
// import { Input } from "@/components/ui/input"
// import { Label } from "@/components/ui/label"
// import { Position, useReactFlow } from '@xyflow/react'
// import { ListTree, Trash2 } from "lucide-react"
// import { NodeLayout } from './node'
// import { NodeTitle } from './title'
// import { useState, useEffect } from 'react'
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// interface SchemaField {
//   id: string;
//   name: string;
//   type: string;
//   prompt: string;
// }

// function AddField({ onAdd, onClose }: { onAdd: (field: SchemaField) => void, onClose: () => void }) {
//   const [name, setName] = useState('')
//   const [type, setType] = useState('string')
//   const [prompt, setPrompt] = useState('')

//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault()
//     if (!name.trim()) return

//     onAdd({
//       id: Math.random().toString(36).substring(7),
//       name: name.trim(),
//       type,
//       prompt: prompt.trim()
//     })
//     onClose()
//   }

//   return (
//     <DialogContent className="sm:max-w-[425px]">
//       <form onSubmit={handleSubmit}>
//         <DialogHeader>
//           <DialogTitle>Add Field</DialogTitle>
//           <DialogDescription>
//             Add a new field to extract from the input
//           </DialogDescription>
//         </DialogHeader>
//         <div className="grid gap-4 py-4">
//           <div className="grid gap-2">
//             <Label>Field Name</Label>
//             <Input
//               value={name}
//               onChange={(e) => setName(e.target.value)}
//               placeholder="e.g. customerName"
//             />
//           </div>
//           <div className="grid gap-2">
//             <Label>Data Type</Label>
//             <Select value={type} onValueChange={setType}>
//               <SelectTrigger>
//                 <SelectValue />
//               </SelectTrigger>
//               <SelectContent>
//                 <SelectItem value="string">String</SelectItem>
//                 <SelectItem value="number">Number</SelectItem>
//                 <SelectItem value="boolean">Boolean</SelectItem>
//                 <SelectItem value="date">Date</SelectItem>
//               </SelectContent>
//             </Select>
//           </div>
//           <div className="grid gap-2">
//             <Label>Extraction Prompt</Label>
//             <Input
//               value={prompt}
//               onChange={(e) => setPrompt(e.target.value)}
//               placeholder="How to extract this field..."
//             />
//           </div>
//         </div>
//         <DialogFooter>
//           <Button type="submit">Add Field</Button>
//         </DialogFooter>
//       </form>
//     </DialogContent>
//   )
// }

// export function SchemaNode({ data, isConnectable, id }) {
//   const [fields, setFields] = useState<SchemaField[]>(data?.fields || [])
//   const [showDialog, setShowDialog] = useState(false)
//   const [showOutput, setShowOutput] = useState(false)
//   const [showInput, setShowInput] = useState(false)
//   const { getEdges, getNode, getNodes } = useReactFlow()

//   // Get input content from connected node
//   const getInputContent = () => {
//     if (!id) {
//       console.log('No node ID available:', { id, data })
//       return 'Error: Node ID not available'
//     }

//     const edges = getEdges()
//     const nodes = getNodes()
//     console.log('Debug - All nodes:', nodes)
//     console.log('Debug - All edges:', edges)
//     console.log('Debug - Current node ID:', id)
    
//     // Find edge connected to our input
//     const inputEdge = edges.find(edge => {
//       const match = edge.target === id && edge.targetHandle === 'input'
//       console.log('Debug - Checking edge:', {
//         edge,
//         currentNodeId: id,
//         targetMatches: edge.target === id,
//         handleMatches: edge.targetHandle === 'input',
//         isMatch: match
//       })
//       return match
//     })
    
//     if (!inputEdge) {
//       console.log('Debug - No input edge found')
//       return 'No input connected'
//     }
    
//     console.log('Debug - Found input edge:', inputEdge)
    
//     // Get the source node
//     const sourceNode = getNode(inputEdge.source)
//     console.log('Debug - Looking for source node:', {
//       sourceId: inputEdge.source,
//       foundNode: sourceNode,
//       allNodeIds: nodes.map(n => n.id)
//     })
    
//     if (!sourceNode) {
//       console.log('Debug - Source node not found')
//       return 'Source node not found'
//     }
    
//     // Get the actual content based on node type
//     let content = sourceNode.data?.content
//     console.log('Debug - Source node data:', {
//       nodeType: sourceNode.type,
//       nodeData: sourceNode.data,
//       content
//     })
    
//     if (!content) {
//       console.log('Debug - No content found in source node')
//       return 'No content available'
//     }

//     // Ensure content is a string
//     return typeof content === 'string' ? content : String(content)
//   }

//   // Generate example structured output
//   const getStructuredOutput = () => {
//     const example = fields.reduce((acc, field) => {
//       let exampleValue = ''
//       switch (field.type) {
//         case 'string':
//           exampleValue = '(extracted text)'
//           break
//         case 'number':
//           exampleValue = '123'
//           break
//         case 'boolean':
//           exampleValue = 'true'
//           break
//         case 'date':
//           exampleValue = '2024-02-14'
//           break
//         default:
//           exampleValue = '...'
//       }
//       return {
//         ...acc,
//         [field.name]: exampleValue
//       }
//     }, {})

//     return JSON.stringify(example, null, 2)
//   }

//   // Update node data when fields change
//   useEffect(() => {
//     if (data?.onChange) {
//       const inputContent = getInputContent()
//       data.onChange({ 
//         fields,
//         content: inputContent,
//         schema: fields.reduce((acc, field) => ({
//           ...acc,
//           [field.name]: { type: field.type, prompt: field.prompt }
//         }), {})
//       })
//     }
//   }, [fields, data, getEdges, getNode])

//   const addField = (field: SchemaField) => {
//     setFields(prev => [...prev, field])
//   }

//   const removeField = (fieldId: string) => {
//     setFields(prev => prev.filter(f => f.id !== fieldId))
//   }

//   return <NodeLayout>
//     <NodeTitle title="Schema" icon={ListTree} />
    
//     <div className="p-4 space-y-4">
//       {/* Input/Output Handles */}
//       <div className="flex justify-between items-center">
//         <div 
//           className="cursor-pointer" 
//           onClick={() => setShowInput(true)}
//         >
//           <LabeledHandle 
//             id="input" 
//             title="Unstructured Input" 
//             type="target" 
//             position={Position.Left} 
//           />
//         </div>
//         <div 
//           className="cursor-pointer" 
//           onClick={() => setShowOutput(true)}
//         >
//           <LabeledHandle
//             id="output"
//             title="Structured Output"
//             type="source"
//             position={Position.Right}
//           />
//         </div>
//       </div>

//       {/* Fields list */}
//       <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
//         {fields.map(field => (
//           <div 
//             key={field.id} 
//             className="flex items-center justify-between bg-muted p-2 rounded-sm group"
//           >
//             <div className="flex-1">
//               <div className="font-medium text-sm">{field.name}</div>
//               <div className="text-xs text-muted-foreground">
//                 Type: {field.type}
//               </div>
//               {field.prompt && (
//                 <div className="text-xs text-muted-foreground mt-1">
//                   Prompt: {field.prompt}
//                 </div>
//               )}
//             </div>
//             <Button
//               variant="ghost"
//               size="icon"
//               className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 ml-2"
//               onClick={() => removeField(field.id)}
//             >
//               <Trash2 className="h-4 w-4" />
//             </Button>
//           </div>
//         ))}
//       </div>

//       {/* Add field button */}
//       <Dialog open={showDialog} onOpenChange={setShowDialog}>
//         <DialogTrigger asChild>
//           <Button 
//             className="w-full" 
//             variant="outline"
//           >
//             Add Field
//           </Button>
//         </DialogTrigger>
//         <AddField 
//           onAdd={addField}
//           onClose={() => setShowDialog(false)}
//         />
//       </Dialog>

//       {/* Input Preview Dialog */}
//       <Dialog open={showInput} onOpenChange={setShowInput}>
//         <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
//           <DialogHeader>
//             <DialogTitle>Unstructured Input</DialogTitle>
//           </DialogHeader>
//           <div className="mt-4">
//             <div className="bg-muted p-4 rounded-md">
//               <div className="whitespace-pre-wrap text-sm font-mono">
//                 {getInputContent()}
//               </div>
//             </div>
//           </div>
//         </DialogContent>
//       </Dialog>

//       {/* Output Preview Dialog */}
//       <Dialog open={showOutput} onOpenChange={setShowOutput}>
//         <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
//           <DialogHeader>
//             <DialogTitle>Schema Output Format</DialogTitle>
//           </DialogHeader>
//           <div className="mt-4 space-y-6">
//             {/* Input Preview */}
//             <div>
//               <h3 className="text-sm font-medium mb-2">Input</h3>
//               <div className="bg-muted p-4 rounded-md">
//                 <div className="whitespace-pre-wrap text-sm font-mono">
//                   {getInputContent()}
//                 </div>
//               </div>
//             </div>

//             {/* Schema Definition */}
//             <div>
//               <h3 className="text-sm font-medium mb-2">Schema Definition</h3>
//               <div className="bg-muted p-4 rounded-md">
//                 <div className="whitespace-pre-wrap text-sm font-mono">
//                   {JSON.stringify(fields.reduce((acc, field) => ({
//                     ...acc,
//                     [field.name]: { type: field.type, prompt: field.prompt }
//                   }), {}), null, 2)}
//                 </div>
//               </div>
//             </div>

//             {/* Example Output */}
//             <div>
//               <h3 className="text-sm font-medium mb-2">Example Output</h3>
//               <div className="bg-muted p-4 rounded-md">
//                 <div className="whitespace-pre-wrap text-sm font-mono">
//                   {getStructuredOutput()}
//                 </div>
//               </div>
//             </div>
//           </div>
//         </DialogContent>
//       </Dialog>
//     </div>
//   </NodeLayout>
// }





