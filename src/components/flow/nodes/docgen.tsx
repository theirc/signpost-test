import { LabeledHandle } from "@/components/labeled-handle"
import { Position, useReactFlow } from '@xyflow/react'
import { File } from "lucide-react"
import { NodeLayout } from './node'
import { NodeTitle } from './title'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

// Add interfaces for props and state
interface DocumentGeneratorNodeProps {
  data: any; // Define specific type
  isConnectable: boolean;
  id: string;
}

interface FormData {
  docType: string;
  categories: string[];
  subcategories: string[];
  socialMedia: string[];
}

// Move options to constants
const DOC_TYPES = {
  ARTICLE: 'article',
  SERVICE_MAP: 'service-map',
  SOCIAL: 'social',
  // ...
} as const;

export function DocumentGeneratorNode({ data, isConnectable, id }) {
  console.log('DocumentGeneratorNode props:', { data, isConnectable, id })
  
  const [docType, setDocType] = useState("article")
  const [categories, setCategories] = useState<string[]>([])
  const [subcategories, setSubcategories] = useState<string[]>([])
  const [socialMedia, setSocialMedia] = useState<string[]>([])
  const [showInput, setShowInput] = useState(false)
  const { getEdges, getNode } = useReactFlow()

  // Log initial data
  useEffect(() => {
    console.log('DocumentGeneratorNode data:', data)
  }, [data])

  const categoryOptions = [
    { value: "1", label: "Shloop it" },
    { value: "2", label: "Doop it" },
    { value: "3", label: "Scoop it" }
  ]

  const subcategoryOptions = [
    { value: "1", label: "Shloop" },
    { value: "2", label: "Doop" },
    { value: "3", label: "Scoop" }
  ]

  const socialMediaOptions = [
    { value: "facebook", label: "Facebook" },
    { value: "twitter", label: "Twitter" },
    { value: "instagram", label: "Instagram" },
    { value: "linkedin", label: "LinkedIn" },
    { value: "youtube", label: "YouTube" }
  ]

  const ServiceMappingForm = () => (
    <div className="space-y-4">
      <div>
        <Label>Name</Label>
        <Input placeholder="{{AI parse from input}}" />
      </div>
      <div>
        <Label>Description</Label>
        <Textarea 
          placeholder="{{AI parse from input}}"
          className="min-h-[100px]"
        />
      </div>

      <div>
        <Label>Address</Label>
        <Input placeholder="{{AI parse from input}}" />
      </div>

      <div className="space-y-2">
        <Label>Categories {categories.length === 0 && "(Will use AI parsing if none selected)"}</Label>
        <Select 
          onValueChange={(value) => {
            if (!categories.includes(value)) {
              setCategories([...categories, value])
            }
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select categories..." />
          </SelectTrigger>
          <SelectContent>
            {categoryOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {categories.map(cat => {
              const option = categoryOptions.find(o => o.value === cat)
              return (
                <Button 
                  key={cat} 
                  variant="secondary" 
                  size="sm"
                  onClick={() => setCategories(categories.filter(c => c !== cat))}
                >
                  {option?.label} ×
                </Button>
              )
            })}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label>Subcategories {subcategories.length === 0 && "(Will use AI parsing if none selected)"}</Label>
        <Select
          onValueChange={(value) => {
            if (!subcategories.includes(value)) {
              setSubcategories([...subcategories, value])
            }
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select subcategories..." />
          </SelectTrigger>
          <SelectContent>
            {subcategoryOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {subcategories.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {subcategories.map(sub => {
              const option = subcategoryOptions.find(o => o.value === sub)
              return (
                <Button 
                  key={sub} 
                  variant="secondary" 
                  size="sm"
                  onClick={() => setSubcategories(subcategories.filter(s => s !== sub))}
                >
                  {option?.label} ×
                </Button>
              )
            })}
          </div>
        )}
      </div>

      <div>
        <Label>Location</Label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs text-muted-foreground">Latitude</Label>
            <Input placeholder="{{AI parse from input}}" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Longitude</Label>
            <Input placeholder="{{AI parse from input}}" />
          </div>
        </div>
      </div>

      <div>
        <Label>Operating Hours</Label>
        <Input placeholder="{{AI parse from input}}" />
      </div>

      <div>
        <Label>Contact</Label>
        <Input placeholder="{{AI parse from input}}" />
      </div>
    </div>
  )

  const SocialMediaForm = () => (
    <div className="space-y-4">
      <div>
        <Label>Name</Label>
        <Input placeholder="{{AI parse from input}}" />
      </div>

      <div>
        <Label>Description</Label>
        <Input placeholder="{{AI parse from input}}" />
      </div>

      <div className="space-y-2">
        <Label>Social Media Post {socialMedia.length === 0 && "(Will use AI parsing if none selected)"}</Label>
        <Select
          onValueChange={(value) => {
            if (!socialMedia.includes(value)) {
              setSocialMedia([...socialMedia, value])
            }
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select platforms..." />
          </SelectTrigger>
          <SelectContent>
            {socialMediaOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {socialMedia.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {socialMedia.map(social => {
              const option = socialMediaOptions.find(o => o.value === social)
              return (
                <Button 
                  key={social} 
                  variant="secondary" 
                  size="sm"
                  onClick={() => setSocialMedia(socialMedia.filter(s => s !== social))}
                >
                  {option?.label} ×
                </Button>
              )
            })}
          </div>
        )}
        {socialMedia.length > 0 && (
          <div className="space-y-2 mt-2">
            {socialMedia.map(social => {
              const option = socialMediaOptions.find(o => o.value === social)
              return (
                <div key={social}>
                  <Label className="text-xs text-muted-foreground">{option?.label} URL</Label>
                  <Input placeholder="{{AI parse from input}}" />
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )

  const ZendeskForm = () => (
    <div className="space-y-4">
      <div>
        <Label>Subdomain*</Label>
        <Input placeholder="Enter Zendesk subdomain" />
      </div>

      <div>
        <Label>Category ID {" "}
          <span className="text-xs text-muted-foreground">(Will use AI parsing if empty)</span>
        </Label>
        <Input placeholder="{{AI parse from input}}" />
      </div>

      <div>
        <Label>Section ID {" "}
          <span className="text-xs text-muted-foreground">(Will use AI parsing if empty)</span>
        </Label>
        <Input placeholder="{{AI parse from input}}" />
      </div>

      <div>
        <Label>Title</Label>
        <Input placeholder="{{AI parse from input}}" />
      </div>

      <div>
        <Label>Description</Label>
        <Input placeholder="{{AI parse from input}}" />
      </div>
    </div>
  )

  const DefaultForm = () => (
    <div className="space-y-4">
      <div>
        <Label>Title</Label>
        <Input placeholder="{{AI parse from input}}" />
      </div>

      <div>
        <Label>Description</Label>
        <Input placeholder="{{AI parse from input}}" />
      </div>
    </div>
  )

  const getForm = () => {
    switch (docType) {
      case "article":
        return <ZendeskForm />
      case "service-map":
        return <ServiceMappingForm />
      case "social":
        return <SocialMediaForm />
      default:
        return <DefaultForm />
    }
  }

  // Function to get input node's content
  const getInputContent = () => {
    if (!id) {
      console.log('No node ID available:', { id, data })
      return 'Error: Node ID not available'
    }

    const edges = getEdges()
    console.log('All edges:', edges)
    console.log('Current node ID:', id)
    
    // Find edge connected to our data input
    const inputEdge = edges.find(edge => {
      const matches = {
        target: edge.target,
        expectedTarget: id,
        targetMatches: edge.target === id,
        handleMatches: edge.targetHandle === 'data',
        fullMatch: edge.target === id && edge.targetHandle === 'data'
      }
      console.log('Checking edge:', matches)
      return matches.fullMatch
    })
    
    if (!inputEdge) {
      console.log('No input edge found matching:', {
        nodeId: id,
        expectedHandle: 'data'
      })
      return 'No input connected'
    }
    
    console.log('Found input edge:', inputEdge)
    
    // Get the source node
    const sourceNode = getNode(inputEdge.source)
    console.log('Source node:', sourceNode)
    
    if (!sourceNode) {
      console.log('Source node not found for ID:', inputEdge.source)
      return 'Input node not found'
    }
    
    console.log('Source node data:', sourceNode.data)
    
    // Return the content from the source node's data
    const content = sourceNode.data?.content
    console.log('Content found:', content)
    
    return content || 'No content available'
  }

  return <NodeLayout>
    <NodeTitle title="Document Generator" icon={File} />
    <div className="relative">
      <LabeledHandle 
        id="template" 
        title="Template" 
        type="target" 
        position={Position.Left} 
        style={{ top: 20 }}
      />
      <div className="flex items-center gap-2" style={{ position: 'absolute', left: 0, top: 60 }}>
        <LabeledHandle 
          id="data"
          title="Data Source" 
          type="target" 
          position={Position.Left}
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowInput(true)}
          className="h-6 px-2 text-xs"
        >
          View Input
        </Button>
      </div>
      <LabeledHandle 
        id="output" 
        title="Output" 
        type="source" 
        position={Position.Right} 
        style={{ top: 20 }}
      />
      <div className="w-full px-4 pt-16 pb-4">
        <div className='space-y-4'>
          <div>
            <Label>Document Type</Label>
            <Select 
              defaultValue="article" 
              onValueChange={(value) => setDocType(value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="article">Zendesk Article</SelectItem>
                <SelectItem value="service-map">Service Mapping Point</SelectItem>
                <SelectItem value="social">Social Media Profile</SelectItem>
                <SelectItem value="pdf">PDF Document</SelectItem>
                <SelectItem value="excel">Excel Spreadsheet</SelectItem>
                <SelectItem value="json">JSON Data</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator className="my-2" />
          
          {getForm()}
        </div>
      </div>

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





