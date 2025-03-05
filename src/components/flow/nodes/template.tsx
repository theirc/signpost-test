// // import { LabeledHandle } from "@/components/flow/handles"
// import { Position } from '@xyflow/react'
// import { BookTemplate } from "lucide-react"
// import { NodeLayout } from './node'
// import { NodeTitle } from './title'
// import { Button } from "@/components/ui/button"
// import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
// import { Textarea } from "@/components/ui/textarea"
// import { useState, useEffect } from "react"
// import { Label } from "@/components/ui/label"

// const DEFAULT_OUTPUT = `
// <div class="content-wrapper">
//   <h1>Template Content</h1>
//   <div class="main-content">
//     <p>Enter your template content in the textarea.</p>
//   </div>
// </div>
// `

// // Add interface for props
// interface TemplateNodeProps {
//   data: any // Define specific type
//   isConnectable: boolean
//   id: string
// }

// interface HandleButtonProps {
//   id: string
//   title: string
//   type: 'output' | 'input'
//   position: Position
//   onClick: () => void
// }

// const HandleButton = ({ id, title, type, position, onClick }: HandleButtonProps) => (
//   <div
//     className="flex items-center gap-1 group cursor-pointer"
//     onClick={onClick}
//   >
//     {/* <LabeledHandle
//       id={id}
//       title={title}
//       type={type}
//       position={position}
//     /> */}
//   </div>
// )

// export function TemplateNode({ data, isConnectable, id }: TemplateNodeProps) {
//   const [content, setContent] = useState("")
//   const [description, setDescription] = useState("")
//   const [parsedContent, setParsedContent] = useState<string>(data?.content || DEFAULT_OUTPUT)
//   const [showOutput, setShowOutput] = useState(false)
//   const [showInput, setShowInput] = useState(false)

//   // Update node data when content changes
//   const updateNodeData = (newContent: string, newDescription?: string) => {
//     const descToUse = newDescription !== undefined ? newDescription : description

//     const contentWrapper = `
//       <div class="content-wrapper">
//         ${descToUse ? `
//           <div class="description mb-4 text-muted-foreground">
//             <h2 class="text-lg font-semibold mb-2">Description</h2>
//             <p>${descToUse}</p>
//           </div>
//         ` : ''}
//         <div class="main-content">
//           ${newContent}
//         </div>
//       </div>
//     `

//     setParsedContent(contentWrapper)

//     // Update the node's data structure to match schema
//     if (data) {
//       data.content = contentWrapper
//       data.type = "template"
//       data.description = descToUse
//       data.rawContent = newContent
//       data.icon = "BookTemplate"
//       data.title = "Template"
//       data.lastUpdated = new Date().toISOString()
//     }
//   }

//   // Initialize from existing data
//   useEffect(() => {
//     if (data?.content) {
//       setParsedContent(data.content)
//       setContent(data.rawContent || "")
//       if (data.description) setDescription(data.description)
//     }
//   }, [data])

//   const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
//     const newContent = e.target.value
//     setContent(newContent)
//     updateNodeData(newContent)
//   }

//   const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
//     const newDescription = e.target.value
//     setDescription(newDescription)
//     updateNodeData(content, newDescription)
//   }

//   const getInputContent = () => {
//     // Implement the logic to get the input content based on the current state
//     // This is a placeholder and should be replaced with the actual implementation
//     return DEFAULT_OUTPUT
//   }

//   return <NodeLayout>
//     <NodeTitle title="Template" icon={BookTemplate} />

//     <div className="flex flex-col w-full">
//       {/* Handles Section */}
//       <div className="flex justify-between px-3 py-1">
//         {/* Left Side Handle */}
//         <div className="flex flex-col gap-2">
//           <HandleButton
//             id="template"
//             title="Template Input"
//             type="input"
//             position={Position.Left}
//             onClick={() => setShowInput(true)}
//           />
//         </div>

//         {/* Right Side Handle */}
//         <div className="flex flex-col">
//           <HandleButton
//             id="output"
//             title="Output"
//             type="output"
//             position={Position.Right}
//             onClick={() => setShowOutput(true)}
//           />
//         </div>
//       </div>

//       {/* Main Content Section */}
//       <div className="px-3 py-1">
//         <div className='space-y-2'>
//           <div>
//             <Label>Description</Label>
//             <Textarea
//               value={description}
//               onChange={handleDescriptionChange}
//               placeholder="Enter a description..."
//               className="min-h-[80px]"
//             />
//           </div>

//           <div>
//             <Label>Content</Label>
//             <Textarea
//               value={content}
//               onChange={handleContentChange}
//               placeholder="Enter your template content..."
//               className="min-h-[200px]"
//             />
//           </div>
//         </div>
//       </div>

//       {/* Dialogs */}
//       <Dialog open={showInput} onOpenChange={setShowInput}>
//         <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
//           <DialogHeader>
//             <DialogTitle>Template Input</DialogTitle>
//           </DialogHeader>
//           <div className="mt-4">
//             <div className="bg-accent p-4 rounded-md">
//               <div
//                 className="whitespace-pre-wrap text-sm"
//                 dangerouslySetInnerHTML={{
//                   __html: getInputContent() || DEFAULT_OUTPUT
//                 }}
//               />
//             </div>
//           </div>
//         </DialogContent>
//       </Dialog>

//       <Dialog open={showOutput} onOpenChange={setShowOutput}>
//         <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
//           <DialogHeader>
//             <DialogTitle>Template Output</DialogTitle>
//           </DialogHeader>
//           <div className="mt-4">
//             <div className="bg-accent p-4 rounded-md">
//               <div
//                 className="whitespace-pre-wrap text-sm"
//                 dangerouslySetInnerHTML={{
//                   __html: parsedContent || DEFAULT_OUTPUT
//                 }}
//               />
//             </div>
//           </div>
//         </DialogContent>
//       </Dialog>
//     </div>
//   </NodeLayout>
// }





