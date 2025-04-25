// import { LabeledHandle } from "@/components/labeled-handle"
// import { Position, useReactFlow } from '@xyflow/react'
// import { File, Download } from "lucide-react"
// import { NodeLayout } from './node'
// import { NodeTitle } from './title'
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
// import { Label } from "@/components/ui/label"
// import { Input } from "@/components/ui/input"
// import { Separator } from "@/components/ui/separator"
// import { Button } from "@/components/ui/button"
// import { useState, useEffect } from "react"
// import { Textarea } from "@/components/ui/textarea"
// import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

// // Add interfaces for props and state
// interface DocumentGeneratorNodeProps {
//   data: any; // Define specific type
//   isConnectable: boolean;
//   id: string;
// }

// interface FormData {
//   docType: string;
//   categories: string[];
//   subcategories: string[];
//   socialMedia: string[];
// }

// // Move options to constants
// const DOC_TYPES = {
//   ARTICLE: 'article',
//   SERVICE_MAP: 'service-map',
//   SOCIAL: 'social',
//   // ...
// } as const;

// const SAMPLE_DOCS = {
//   pdf: "https://cdn.jsdelivr.net/gh/mozilla/pdf.js/examples/learning/helloworld.pdf",
//   docx: "/sample-files/sample.docx",
//   // You'd want to host these files on your own CDN in production
// };

// const downloadFromCDN = async (url: string, filename: string) => {
//   try {
//     const response = await fetch(url, {
//       // Add these headers to handle CORS
//       headers: {
//         'Accept': '*/*',
//       },
//       // Use no-cors mode as fallback for external resources
//       mode: 'no-cors'
//     });
    
//     if (!response.ok) {
//       throw new Error(`HTTP error! status: ${response.status}`);
//     }
    
//     const blob = await response.blob();
//     const downloadUrl = window.URL.createObjectURL(blob);
    
//     const link = document.createElement('a');
//     link.href = downloadUrl;
//     link.download = filename;
//     document.body.appendChild(link);
//     link.click();
    
//     // Cleanup
//     document.body.removeChild(link);
//     window.URL.revokeObjectURL(downloadUrl);
//   } catch (error) {
//     console.error('Download failed:', error);
//     // Fallback to generating a simple DOCX if the download fails
//     if (filename.endsWith('.docx')) {
//       generateSampleDOCX();
//     }
//   }
// };


// //NOTE: This is a workaround to get a DOCX file to download all of these random cdn functions for samples should be replaced with API routes to call the bots to generate this stuff
// const generateSampleDOCX = () => {
//   // Create a simple RTF document
//   const rtfContent = `{\\rtf1\\ansi\\deff0
// {\\fonttbl{\\f0\\froman Times New Roman;}}
// {\\colortbl;\\red0\\green0\\blue0;}
// {\\info{\\author Sample Generator}{\\company Our Company}}
// \\viewkind4\\uc1\\pard\\cf1\\f0\\fs24
// This is a sample document.\\par
// \\par
// It contains some sample text to demonstrate document generation.\\par
// \\par
// Generated on: ${new Date().toLocaleDateString()}\\par
// }`;

//   // Create blob with RTF content
//   const blob = new Blob([rtfContent], { type: 'application/rtf' });
  
//   // Create download link
//   const url = window.URL.createObjectURL(blob);
//   const link = document.createElement('a');
//   link.href = url;
//   link.download = 'generated-document.rtf';
//   document.body.appendChild(link);
//   link.click();
  
//   // Cleanup
//   document.body.removeChild(link);
//   window.URL.revokeObjectURL(url);
// };

// const generateSamplePDF = () => {
//   // This is a minimal PDF file in base64 format
//   const samplePDF = 'JVBERi0xLjcKCjEgMCBvYmogICUgZW50cnkgcG9pbnQKPDwKICAvVHlwZSAvQ2F0YWxvZwogIC9QYWdlcyAyIDAgUgo+PgplbmRvYmoKCjIgMCBvYmoKPDwKICAvVHlwZSAvUGFnZXMKICAvTWVkaWFCb3ggWyAwIDAgMjAwIDIwMCBdCiAgL0NvdW50IDEKICAvS2lkcyBbIDMgMCBSIF0KPj4KZW5kb2JqCgozIDAgb2JqCjw8CiAgL1R5cGUgL1BhZ2UKICAvUGFyZW50IDIgMCBSCiAgL1Jlc291cmNlcyA8PAogICAgL0ZvbnQgPDwKICAgICAgL0YxIDQgMCBSIAogICAgPj4KICA+PgogIC9Db250ZW50cyA1IDAgUgo+PgplbmRvYmoKCjQgMCBvYmoKPDwKICAvVHlwZSAvRm9udAogIC9TdWJ0eXBlIC9UeXBlMQogIC9CYXNlRm9udCAvVGltZXMtUm9tYW4KPj4KZW5kb2JqCgo1IDAgb2JqICAlIHBhZ2UgY29udGVudAo8PAogIC9MZW5ndGggNDQKPj4Kc3RyZWFtCkJUCjcwIDUwIFRECi9GMSAxMiBUZgooSGVsbG8sIFdvcmxkKSBUagpFVAplbmRzdHJlYW0KZW5kb2JqCgp4cmVmCjAgNgowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAwMTAgMDAwMDAgbiAKMDAwMDAwMDA3OSAwMDAwMCBuIAowMDAwMDAwMTczIDAwMDAwIG4gCjAwMDAwMDAzMDEgMDAwMDAgbiAKMDAwMDAwMDM4MCAwMDAwMCBuIAp0cmFpbGVyCjw8CiAgL1NpemUgNgogIC9Sb290IDEgMCBSCj4+CnN0YXJ0eHJlZgo0OTIKJSVFT0YK';

//   // Create blob from base64
//   const byteCharacters = atob(samplePDF);
//   const byteNumbers = new Array(byteCharacters.length);
//   for (let i = 0; i < byteCharacters.length; i++) {
//     byteNumbers[i] = byteCharacters.charCodeAt(i);
//   }
//   const byteArray = new Uint8Array(byteNumbers);
//   const blob = new Blob([byteArray], { type: 'application/pdf' });
  
//   // Create download URL
//   const url = window.URL.createObjectURL(blob);
  
//   // Create temporary link and trigger download
//   const link = document.createElement('a');
//   link.href = url;
//   link.download = 'generated-document.pdf';
//   document.body.appendChild(link);
//   link.click();
  
//   // Cleanup
//   document.body.removeChild(link);
//   window.URL.revokeObjectURL(url);
// }

// const generateSampleJSON = () => {
//   const sampleData = {
//     title: "Sample JSON Output",
//     timestamp: new Date().toISOString(),
//     data: {
//       field1: "Value 1",
//       field2: "Value 2",
//       nestedData: {
//         subfield1: "Subvalue 1",
//         subfield2: "Subvalue 2"
//       },
//       arrayField: [1, 2, 3, 4, 5]
//     }
//   };

//   const blob = new Blob([JSON.stringify(sampleData, null, 2)], { type: 'application/json' });
//   const url = window.URL.createObjectURL(blob);
  
//   const link = document.createElement('a');
//   link.href = url;
//   link.download = 'generated-data.json';
//   document.body.appendChild(link);
//   link.click();
  
//   document.body.removeChild(link);
//   window.URL.revokeObjectURL(url);
// }

// const generateSampleCSV = () => {
//   const headers = ['Name', 'Age', 'City', 'Occupation'];
//   const rows = [
//     ['John Doe', '30', 'New York', 'Engineer'],
//     ['Jane Smith', '25', 'San Francisco', 'Designer'],
//     ['Bob Johnson', '45', 'Chicago', 'Manager']
//   ];
  
//   const csvContent = [
//     headers.join(','),
//     ...rows.map(row => row.join(','))
//   ].join('\n');

//   const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
//   const url = window.URL.createObjectURL(blob);
  
//   const link = document.createElement('a');
//   link.href = url;
//   link.download = 'generated-data.csv';
//   document.body.appendChild(link);
//   link.click();
  
//   document.body.removeChild(link);
//   window.URL.revokeObjectURL(url);
// }

// interface HandleButtonProps {
//   id: string;
//   title: string;
//   type: 'source' | 'target';
//   position: Position;
//   onClick: () => void;
// }

// const HandleButton = ({ id, title, type, position, onClick }: HandleButtonProps) => (
//   <div 
//     className="flex items-center gap-1 group cursor-pointer" 
//     onClick={onClick}
//   >
//     <LabeledHandle 
//       id={id}
//       title={title} 
//       type={type} 
//       position={position}
//     />
//   </div>
// )

// export function DocumentGeneratorNode({ data, isConnectable, id }) {
//   console.log('DocumentGeneratorNode props:', { data, isConnectable, id })
  
//   const [docType, setDocType] = useState("article")
//   const [categories, setCategories] = useState<string[]>([])
//   const [subcategories, setSubcategories] = useState<string[]>([])
//   const [socialMedia, setSocialMedia] = useState<string[]>([])
//   const [showInput, setShowInput] = useState(false)
//   const [showOutput, setShowOutput] = useState(false)
//   const [generatedOutput, setGeneratedOutput] = useState<any>(null)
//   const [showTemplateInput, setShowTemplateInput] = useState(false)
//   const { getEdges, getNode } = useReactFlow()
//   const [isLoading, setIsLoading] = useState(false)

//   // Log initial data
//   useEffect(() => {
//     console.log('DocumentGeneratorNode data:', data)
//   }, [data])

//   // Effect to automatically generate output when inputs change
//   useEffect(() => {
//     const edges = getEdges()
//     const templateEdge = edges.find(edge => 
//       edge.target === id && edge.targetHandle === 'template'
//     )
//     const dataEdge = edges.find(edge => 
//       edge.target === id && edge.targetHandle === 'data'
//     )

//     // Only generate if we have at least one input
//     if (templateEdge || dataEdge) {
//       handleGenerate()
//     }
//   }, [id, getEdges, getNode, docType, data?.description])

//   const categoryOptions = [
//     { value: "1", label: "Shloop it" },
//     { value: "2", label: "Doop it" },
//     { value: "3", label: "Scoop it" }
//   ]

//   const subcategoryOptions = [
//     { value: "1", label: "Shloop" },
//     { value: "2", label: "Doop" },
//     { value: "3", label: "Scoop" }
//   ]

//   const socialMediaOptions = [
//     { value: "facebook", label: "Facebook" },
//     { value: "twitter", label: "Twitter" },
//     { value: "instagram", label: "Instagram" },
//     { value: "linkedin", label: "LinkedIn" },
//     { value: "youtube", label: "YouTube" }
//   ]

//   const ServiceMappingForm = () => (
//     <div className="space-y-4">
//       <div>
//         <Label>Name</Label>
//         <Input placeholder="{{AI parse from input}}" />
//       </div>
//       <div>
//         <Label>Description</Label>
//         <Textarea 
//           placeholder="{{AI parse from input}}"
//           className="min-h-[100px]"
//         />
//       </div>

//       <div>
//         <Label>Address</Label>
//         <Input placeholder="{{AI parse from input}}" />
//       </div>

//       <div className="space-y-2">
//         <Label>Categories {categories.length === 0 && "(Will use AI parsing if none selected)"}</Label>
//         <Select 
//           onValueChange={(value) => {
//             if (!categories.includes(value)) {
//               setCategories([...categories, value])
//             }
//           }}
//         >
//           <SelectTrigger className="w-full">
//             <SelectValue placeholder="Select categories..." />
//           </SelectTrigger>
//           <SelectContent>
//             {categoryOptions.map(option => (
//               <SelectItem key={option.value} value={option.value}>
//                 {option.label}
//               </SelectItem>
//             ))}
//           </SelectContent>
//         </Select>
//         {categories.length > 0 && (
//           <div className="flex flex-wrap gap-2 mt-2">
//             {categories.map(cat => {
//               const option = categoryOptions.find(o => o.value === cat)
//               return (
//                 <Button 
//                   key={cat} 
//                   variant="secondary" 
//                   size="sm"
//                   onClick={() => setCategories(categories.filter(c => c !== cat))}
//                 >
//                   {option?.label} ×
//                 </Button>
//               )
//             })}
//           </div>
//         )}
//       </div>

//       <div className="space-y-2">
//         <Label>Subcategories {subcategories.length === 0 && "(Will use AI parsing if none selected)"}</Label>
//         <Select
//           onValueChange={(value) => {
//             if (!subcategories.includes(value)) {
//               setSubcategories([...subcategories, value])
//             }
//           }}
//         >
//           <SelectTrigger className="w-full">
//             <SelectValue placeholder="Select subcategories..." />
//           </SelectTrigger>
//           <SelectContent>
//             {subcategoryOptions.map(option => (
//               <SelectItem key={option.value} value={option.value}>
//                 {option.label}
//               </SelectItem>
//             ))}
//           </SelectContent>
//         </Select>
//         {subcategories.length > 0 && (
//           <div className="flex flex-wrap gap-2 mt-2">
//             {subcategories.map(sub => {
//               const option = subcategoryOptions.find(o => o.value === sub)
//               return (
//                 <Button 
//                   key={sub} 
//                   variant="secondary" 
//                   size="sm"
//                   onClick={() => setSubcategories(subcategories.filter(s => s !== sub))}
//                 >
//                   {option?.label} ×
//                 </Button>
//               )
//             })}
//           </div>
//         )}
//       </div>

//       <div>
//         <Label>Location</Label>
//         <div className="grid grid-cols-2 gap-2">
//           <div>
//             <Label className="text-xs text-muted-foreground">Latitude</Label>
//             <Input placeholder="{{AI parse from input}}" />
//           </div>
//           <div>
//             <Label className="text-xs text-muted-foreground">Longitude</Label>
//             <Input placeholder="{{AI parse from input}}" />
//           </div>
//         </div>
//       </div>

//       <div>
//         <Label>Operating Hours</Label>
//         <Input placeholder="{{AI parse from input}}" />
//       </div>

//       <div>
//         <Label>Contact</Label>
//         <Input placeholder="{{AI parse from input}}" />
//       </div>
//     </div>
//   )

//   const SocialMediaForm = () => (
//     <div className="space-y-4">
//       <div>
//         <Label>Name</Label>
//         <Input placeholder="{{AI parse from input}}" />
//       </div>

//       <div>
//         <Label>Description</Label>
//         <Input placeholder="{{AI parse from input}}" />
//       </div>

//       <div className="space-y-2">
//         <Label>Social Media Post {socialMedia.length === 0 && "(Will use AI parsing if none selected)"}</Label>
//         <Select
//           onValueChange={(value) => {
//             if (!socialMedia.includes(value)) {
//               setSocialMedia([...socialMedia, value])
//             }
//           }}
//         >
//           <SelectTrigger className="w-full">
//             <SelectValue placeholder="Select platforms..." />
//           </SelectTrigger>
//           <SelectContent>
//             {socialMediaOptions.map(option => (
//               <SelectItem key={option.value} value={option.value}>
//                 {option.label}
//               </SelectItem>
//             ))}
//           </SelectContent>
//         </Select>
//         {socialMedia.length > 0 && (
//           <div className="flex flex-wrap gap-2 mt-2">
//             {socialMedia.map(social => {
//               const option = socialMediaOptions.find(o => o.value === social)
//               return (
//                 <Button 
//                   key={social} 
//                   variant="secondary" 
//                   size="sm"
//                   onClick={() => setSocialMedia(socialMedia.filter(s => s !== social))}
//                 >
//                   {option?.label} ×
//                 </Button>
//               )
//             })}
//           </div>
//         )}
//         {socialMedia.length > 0 && (
//           <div className="space-y-2 mt-2">
//             {socialMedia.map(social => {
//               const option = socialMediaOptions.find(o => o.value === social)
//               return (
//                 <div key={social}>
//                   <Label className="text-xs text-muted-foreground">{option?.label} URL</Label>
//                   <Input placeholder="{{AI parse from input}}" />
//                 </div>
//               )
//             })}
//           </div>
//         )}
//       </div>
//     </div>
//   )

//   const ZendeskForm = () => (
//     <div className="space-y-4">
//       <div>
//         <Label>Subdomain*</Label>
//         <Input placeholder="Enter Zendesk subdomain" />
//       </div>

//       <div>
//         <Label>Category ID {" "}
//           <span className="text-xs text-muted-foreground">(Will use AI parsing if empty)</span>
//         </Label>
//         <Input placeholder="{{AI parse from input}}" />
//       </div>

//       <div>
//         <Label>Section ID {" "}
//           <span className="text-xs text-muted-foreground">(Will use AI parsing if empty)</span>
//         </Label>
//         <Input placeholder="{{AI parse from input}}" />
//       </div>

//       <div>
//         <Label>Title</Label>
//         <Input placeholder="{{AI parse from input}}" />
//       </div>

//       <div>
//         <Label>Description</Label>
//         <Input placeholder="{{AI parse from input}}" />
//       </div>
//     </div>
//   )

//   const DefaultForm = () => (
//     <div className="space-y-4">
//       <div>
//         <Label>Title</Label>
//         <Input placeholder="{{AI parse from input}}" />
//       </div>

//       <div>
//         <Label>Description</Label>
//         <Input placeholder="{{AI parse from input}}" />
//       </div>
//     </div>
//   )

//   const getForm = () => {
//     switch (docType) {
//       case "article":
//         return <ZendeskForm />
//       case "service-map":
//         return <ServiceMappingForm />
//       case "social":
//         return <SocialMediaForm />
//       default:
//         return <DefaultForm />
//     }
//   }

//   // Function to get input node's content
//   const getInputContent = () => {
//     if (!id) {
//       console.log('No node ID available:', { id, data })
//       return 'Error: Node ID not available'
//     }

//     const edges = getEdges()
//     console.log('All edges:', edges)
//     console.log('Current node ID:', id)
    
//     // Find edge connected to our data input
//     const inputEdge = edges.find(edge => {
//       const matches = {
//         target: edge.target,
//         expectedTarget: id,
//         targetMatches: edge.target === id,
//         handleMatches: edge.targetHandle === 'data',
//         fullMatch: edge.target === id && edge.targetHandle === 'data'
//       }
//       console.log('Checking edge:', matches)
//       return matches.fullMatch
//     })
    
//     if (!inputEdge) {
//       console.log('No input edge found matching:', {
//         nodeId: id,
//         expectedHandle: 'data'
//       })
//       return 'No input connected'
//     }
    
//     console.log('Found input edge:', inputEdge)
    
//     // Get the source node
//     const sourceNode = getNode(inputEdge.source)
//     console.log('Source node:', sourceNode)
    
//     if (!sourceNode) {
//       console.log('Source node not found for ID:', inputEdge.source)
//       return 'Input node not found'
//     }
    
//     console.log('Source node data:', sourceNode.data)
    
//     // Return the content from the source node's data
//     const content = sourceNode.data?.content
//     console.log('Content found:', content)
    
//     return content as string || 'No content available'
//   }

//   // Function to get template input node's content
//   const getTemplateContent = () => {
//     if (!id) {
//       return 'No node ID available'
//     }

//     const edges = getEdges()
    
//     // Find edge connected to our template input
//     const inputEdge = edges.find(edge => 
//       edge.target === id && edge.targetHandle === 'template'
//     )
    
//     if (!inputEdge) {
//       return 'No template connected'
//     }
    
//     // Get the source node
//     const sourceNode = getNode(inputEdge.source)
//     if (!sourceNode) {
//       return 'Template node not found'
//     }
    
//     return sourceNode.data?.content as string || 'No content available'
//   }

//   const renderOutput = () => {
//     if (!generatedOutput) {
//       return <div className="text-muted-foreground">No output generated yet</div>
//     }

//     switch (docType) {
//       case "article":
//         return (
//           <div className="space-y-4">
//             <h3 className="font-semibold">{generatedOutput.title}</h3>
//             <div dangerouslySetInnerHTML={{ __html: generatedOutput.body }} />
//           </div>
//         )
      
//       case "service-map":
//         return (
//           <div className="space-y-2">
//             <div><strong>Name:</strong> {generatedOutput.name}</div>
//             <div><strong>Description:</strong> {generatedOutput.description}</div>
//             <div><strong>Address:</strong> {generatedOutput.address}</div>
//             <div><strong>Categories:</strong> {generatedOutput.categories?.join(", ")}</div>
//             {/* ... other service map fields ... */}
//           </div>
//         )
      
//       case "pdf":
//         return (
//           <div className="space-y-4">
//             <div className="text-muted-foreground">
//               Document ready for download
//             </div>
//             <Button 
//               variant="outline" 
//               onClick={generateSamplePDF}
//             >
//               <Download className="mr-2 h-4 w-4" />
//               Download Document
//             </Button>
//           </div>
//         )
      
//       case "docx":
//         return (
//           <div className="space-y-4">
//             <div className="text-muted-foreground">
//               Document ready for download
//             </div>
//             <Button 
//               variant="outline" 
//               onClick={generateSampleDOCX}
//             >
//               <Download className="mr-2 h-4 w-4" />
//               Download Document
//             </Button>
//           </div>
//         )
      
//       case "csv":
//         return (
//           <div className="space-y-4">
//             <div className="text-muted-foreground">
//               CSV file ready for download
//             </div>
//             <Button variant="outline" onClick={generateSampleCSV}>
//               <Download className="mr-2 h-4 w-4" />
//               Download CSV
//             </Button>
//           </div>
//         )

//       case "json":
//         return (
//           <div className="space-y-4">
//             <div className="text-muted-foreground">
//               JSON file ready for download
//             </div>
//             <Button variant="outline" onClick={generateSampleJSON}>
//               <Download className="mr-2 h-4 w-4" />
//               Download JSON
//             </Button>
//           </div>
//         )
      
//       default:
//         return <pre className="bg-muted p-4 rounded-md overflow-auto">
//           {JSON.stringify(generatedOutput, null, 2)}
//         </pre>
//     }
//   }

//   // Update handleGenerate to not require button click
//   const handleGenerate = () => {
//     setIsLoading(true)
    
//     try {
//       const sampleOutputs = {
//         "article": {
//           title: "Sample Zendesk Article",
//           body: "<h2>Introduction</h2><p>This is a sample Zendesk article generated from the input.</p><h2>Details</h2><p>More formatted content would go here...</p>",
//         },
//         "service-map": {
//           name: "Sample Service Location",
//           description: "A service point generated from the input data",
//           address: "123 Sample St, Example City",
//           categories: ["Category 1", "Category 2"],
//           coordinates: { lat: 40.7128, lng: -74.0060 },
//         },
//         "pdf": {
//           fileUrl: SAMPLE_DOCS.pdf,
//           fileName: "generated-document.pdf",
//           download: () => downloadFromCDN(SAMPLE_DOCS.pdf, "generated-document.pdf")
//         },
//         "docx": {
//           fileUrl: SAMPLE_DOCS.docx,
//           fileName: "generated-document.docx",
//           download: () => downloadFromCDN(SAMPLE_DOCS.docx, "generated-document.docx")
//         },
//         "csv": {
//           fileUrl: "generated-data.csv",
//           fileName: "generated-data.csv",
//           download: generateSampleCSV
//         },
//         "json": {
//           fileUrl: "generated-data.json",
//           fileName: "generated-data.json",
//           download: generateSampleJSON,
//           data: {
//             title: "Sample JSON Output",
//             content: "This would be structured data from the input"
//           }
//         }
//       }

//       setGeneratedOutput(sampleOutputs[docType] || { message: "Generated output for " + docType })
      
//       // Update node data
//       if (data) {
//         data.generatedOutput = sampleOutputs[docType]
//         data.lastUpdated = new Date().toISOString()
//       }
//     } catch (error) {
//       console.error('Error generating document:', error)
//     } finally {
//       setIsLoading(false)
//     }
//   }

//   return <NodeLayout>
//     <NodeTitle title="Document Generator" icon={File} />
    
//     <div className="flex flex-col w-full">
//       {/* Handles Section */}
//       <div className="flex justify-between px-3 py-1">
//         {/* Left Side Handles */}
//         <div className="flex flex-col gap-2">
//           <HandleButton
//             id="template"
//             title="Template"
//             type="target"
//             position={Position.Left}
//             onClick={() => setShowTemplateInput(true)}
//           />
//           <HandleButton
//             id="data"
//             title="Data Source"
//             type="target"
//             position={Position.Left}
//             onClick={() => setShowInput(true)}
//           />
//         </div>
        
//         {/* Right Side Handle */}
//         <div className="flex flex-col">
//           <HandleButton
//             id="output"
//             title="Output"
//             type="source"
//             position={Position.Right}
//             onClick={() => setShowOutput(true)}
//           />
//         </div>
//       </div>

//       {/* Main Content Section */}
//       <div className="px-3 py-1">
//         <div className='space-y-2'>
//           <div>
//             <Label className="text-xs">Document Type</Label>
//             <Select 
//               defaultValue="article" 
//               onValueChange={(value) => {
//                 setDocType(value)
//                 // Will trigger the useEffect
//               }}
//             >
//               <SelectTrigger className="w-full">
//                 <SelectValue placeholder="Select type" />
//               </SelectTrigger>
//               <SelectContent>
//                 <SelectItem value="article">Zendesk Article</SelectItem>
//                 <SelectItem value="service-map">Service Mapping Point</SelectItem>
//                 <SelectItem value="social">Social Media Post</SelectItem>
//                 <SelectItem value="pdf">PDF Document</SelectItem>
//                 <SelectItem value="docx">Word Document</SelectItem>
//                 <SelectItem value="csv">CSV Data</SelectItem>
//                 <SelectItem value="json">JSON Data</SelectItem>
//               </SelectContent>
//             </Select>
//           </div>

//           <Separator className="my-2" />
          
//           {getForm()}
//         </div>
//       </div>

//       {/* Dialogs remain unchanged */}
//       <Dialog open={showTemplateInput} onOpenChange={setShowTemplateInput}>
//         <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
//           <DialogHeader>
//             <DialogTitle>Template Content</DialogTitle>
//           </DialogHeader>
//           <div className="mt-4">
//             <div className="bg-accent p-4 rounded-md">
//               <div 
//                 className="whitespace-pre-wrap text-sm"
//                 dangerouslySetInnerHTML={{ 
//                   __html: getTemplateContent()
//                 }}
//               />
//             </div>
//           </div>
//         </DialogContent>
//       </Dialog>

//       <Dialog open={showInput} onOpenChange={setShowInput}>
//         <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
//           <DialogHeader>
//             <DialogTitle>Input Content</DialogTitle>
//           </DialogHeader>
//           <div className="mt-4">
//             <div className="bg-accent p-4 rounded-md">
//               <div 
//                 className="whitespace-pre-wrap text-sm"
//                 dangerouslySetInnerHTML={{ 
//                   __html: getInputContent()
//                 }}
//               />
//             </div>
//           </div>
//         </DialogContent>
//       </Dialog>

//       <Dialog open={showOutput} onOpenChange={setShowOutput}>
//         <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
//           <DialogHeader>
//             <DialogTitle>Document Generator Output</DialogTitle>
//           </DialogHeader>
//           <div className="mt-4 space-y-6">
//             {/* Template Input */}
//             <div>
//               <h3 className="text-sm font-medium mb-2">Template Input</h3>
//               <div className="bg-accent p-4 rounded-md">
//                 <div 
//                   className="whitespace-pre-wrap text-sm"
//                   dangerouslySetInnerHTML={{ 
//                     __html: getTemplateContent()
//                   }}
//                 />
//               </div>
//             </div>

//             {/* Data Source Input */}
//             <div>
//               <h3 className="text-sm font-medium mb-2">Data Source Input</h3>
//               <div className="bg-accent p-4 rounded-md">
//                 <div 
//                   className="whitespace-pre-wrap text-sm"
//                   dangerouslySetInnerHTML={{ 
//                     __html: getInputContent()
//                   }}
//                 />
//               </div>
//             </div>

//             {/* Generated Output */}
//             <div>
//               <h3 className="text-sm font-medium mb-2">Generated Output</h3>
//               <div className="bg-accent p-4 rounded-md">
//                 {renderOutput()}
//               </div>
//             </div>
//           </div>
//         </DialogContent>
//       </Dialog>
//     </div>
//   </NodeLayout>
// }





