import { LabeledHandle } from "@/components/labeled-handle"
import { Position } from '@xyflow/react'
import { File } from "lucide-react"
import { NodeLayout } from './node'
import { NodeTitle } from './title'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { Textarea } from "@/components/ui/textarea"

export function DocumentGeneratorNode({ data, isConnectable }) {
  const [docType, setDocType] = useState("article")
  const [categories, setCategories] = useState<string[]>([])
  const [subcategories, setSubcategories] = useState<string[]>([])
  const [socialMedia, setSocialMedia] = useState<string[]>([])

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
      <LabeledHandle 
        id="data" 
        title="Data Source" 
        type="target" 
        position={Position.Left} 
        style={{ top: 20 }}
      />
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
    </div>
  </NodeLayout>
}





