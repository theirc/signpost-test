import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { useSupabase } from "@/hooks/use-supabase"
import { useSources, Source } from "@/hooks/use-sources"
import { useSourceConfig } from "@/hooks/use-source-config"

interface LiveDataModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Base configuration interface matching database schema
interface SourceConfig {
  id?: string
  source_id: string
  enabled: boolean
  url?: string
  prompt?: string
  chunk_size?: number
  chunk_overlap?: number
  max_token_limit?: number
  include_urls?: boolean
  extract_media_content?: boolean
  exclude_urls?: string[]
  retrieve_links?: boolean
  sitemap?: string
  subdomain?: string
  map?: string
  bot_log?: string
  max_links?: number
  crawl_depth?: number
  max_total_links?: number
  include_external_links?: boolean
  extract_main_content?: boolean
  type?: string
}

// Form state interface
interface FormState {
  name: string
  type: string
  enabled: boolean
  url?: string
  sitemap?: string
  subdomain?: string
  map?: string
  prompt?: string
  bot_log?: string
  max_links?: number
  crawl_depth?: number
  max_total_links?: number
  include_external_links?: boolean
  extract_main_content?: boolean
  chunk_size?: number
  chunk_overlap?: number
  max_token_limit?: number
  include_urls?: boolean
  extract_media_content?: boolean
  exclude_urls?: string[]
  retrieve_links?: boolean
}

const DEFAULT_FORM_STATE: FormState = {
  name: "",
  type: "",
  enabled: true,
  max_links: 10,
  crawl_depth: 0,
  max_total_links: 50,
  include_external_links: true,
  extract_main_content: true,
  chunk_size: 1500,
  chunk_overlap: 200,
  max_token_limit: 2000,
  include_urls: true,
  extract_media_content: false,
  exclude_urls: [],
  retrieve_links: true
}

export function LiveDataModal({ open, onOpenChange }: LiveDataModalProps) {
  const supabase = useSupabase()
  const { addSource } = useSources()
  const { updateSourceConfig } = useSourceConfig()
  
  const [form, setForm] = useState<FormState>(DEFAULT_FORM_STATE)
  const [isLoading, setIsLoading] = useState(false)

  const resetForm = () => {
    setForm(DEFAULT_FORM_STATE)
  }

  const handleSave = async () => {
    // Check all required fields from Source interface
    if (!form.name || !form.type) {
      console.error('Missing required fields')
      return
    }

    setIsLoading(true)
    try {
      // Create the source first with required fields
      const sourceData: Partial<Source> = {
        name: form.name,
        type: form.type,
        content: "Fetching...", // Use placeholder text to indicate content will be populated
        tags: [form.type, 'Live Data']
      }

      // Only add url if it exists
      if (form.url) {
        sourceData.url = form.url
      }

      console.log('sourceData', sourceData);
      const newSource = await addSource(sourceData)
      
      if (!newSource) {
        throw new Error('Failed to create source')
      }

      // Prepare the configuration - only include fields that exist in the database schema
      const sourceConfig = {
        source: newSource.id,
        enabled: form.enabled ? 1 : 0,
        url: form.url || null,
        sitemap: form.sitemap || null,
        subdomain: form.subdomain || null,
        map: form.map || null,
        prompt: form.prompt || null,
        bot_log: form.bot_log || null,
        max_links: form.max_links || null,
        crawl_depth: form.crawl_depth || null,
        max_total_links: form.max_total_links || null,
        include_external_links: form.include_external_links ? 1 : 0,
        extract_main_content: form.extract_main_content ? 1 : 0,
        type: form.type
      }

      console.log('About to save source config:', {
        sourceConfig,
        newSourceId: newSource.id,
        formType: form.type,
        formEnabled: form.enabled
      });

      // Save the configuration
      const savedConfig = await updateSourceConfig(sourceConfig)
      console.log('Response from updateSourceConfig:', savedConfig);

      if (!savedConfig) {
        console.error('updateSourceConfig returned null or undefined');
        throw new Error('Failed to save source configuration')
      }

      // Reset and close
      resetForm()
      onOpenChange(false)
    } catch (error) {
      console.error('Error saving source:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const updateForm = (updates: Partial<FormState>) => {
    setForm(prev => ({ ...prev, ...updates }))
  }

  const renderSourceTypeFields = () => {
    if (!form.type) return null

    return (
      <>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="source-name" className="text-right">Name</Label>
          <Input
            id="source-name"
            className="col-span-3"
            value={form.name}
            onChange={(e) => updateForm({ name: e.target.value })}
            placeholder="Enter source name"
          />
        </div>

        <div className="grid grid-cols-4 items-center gap-4">
          <Label className="text-right">Enabled</Label>
          <div className="col-span-3">
            <Switch
              checked={form.enabled}
              onCheckedChange={(enabled) => updateForm({ enabled })}
            />
          </div>
        </div>

        {form.type === 'web-scraping' && (
          <>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">URL</Label>
              <Input
                className="col-span-3"
                value={form.url || ''}
                onChange={(e) => updateForm({ url: e.target.value })}
                placeholder="https://example.com"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Sitemap URL</Label>
              <Input
                className="col-span-3"
                value={form.sitemap || ''}
                onChange={(e) => updateForm({ sitemap: e.target.value })}
                placeholder="https://example.com/sitemap.xml"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Max Links per Page</Label>
              <Input
                type="number"
                className="col-span-3"
                value={form.max_links || 10}
                onChange={(e) => updateForm({ max_links: parseInt(e.target.value) || 10 })}
                placeholder="Maximum links to process per page"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Crawl Depth</Label>
              <Input
                type="number"
                className="col-span-3"
                value={form.crawl_depth || 0}
                onChange={(e) => updateForm({ crawl_depth: parseInt(e.target.value) || 0 })}
                placeholder="How deep to crawl (0 = this page only)"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Max Total Links</Label>
              <Input
                type="number"
                className="col-span-3"
                value={form.max_total_links || 50}
                onChange={(e) => updateForm({ max_total_links: parseInt(e.target.value) || 50 })}
                placeholder="Maximum total links to process"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Include External Links</Label>
              <div className="col-span-3">
                <Switch
                  checked={form.include_external_links}
                  onCheckedChange={(include_external_links) => updateForm({ include_external_links })}
                />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Extract Main Content</Label>
              <div className="col-span-3">
                <Switch
                  checked={form.extract_main_content}
                  onCheckedChange={(extract_main_content) => updateForm({ extract_main_content })}
                />
              </div>
            </div>
          </>
        )}

        {form.type === 'zendesk' && (
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Subdomain</Label>
            <Input
              className="col-span-3"
              value={form.subdomain || ''}
              onChange={(e) => updateForm({ subdomain: e.target.value })}
              placeholder="your-company"
            />
          </div>
        )}

        {form.type === 'directus' && (
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Map</Label>
            <Input
              className="col-span-3"
              value={form.map || ''}
              onChange={(e) => updateForm({ map: e.target.value })}
              placeholder="Enter map ID"
            />
          </div>
        )}

        {(form.type === 'perplexity' || form.type === 'exa') && (
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Prompt</Label>
            <Textarea
              className="col-span-3"
              value={form.prompt || ''}
              onChange={(e) => updateForm({ prompt: e.target.value })}
              placeholder={`Enter ${form.type} prompt...`}
            />
          </div>
        )}

        {form.type === 'bot-logs' && (
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Bot Log ID</Label>
            <Input
              className="col-span-3"
              value={form.bot_log || ''}
              onChange={(e) => updateForm({ bot_log: e.target.value })}
              placeholder="Enter bot log ID"
            />
          </div>
        )}

        {/* Common processing options */}
        <div className="mt-6 border-t pt-4">
          <h3 className="text-sm font-medium mb-4">Processing Options</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Chunk Size</Label>
              <Input
                type="number"
                className="col-span-3"
                value={form.chunk_size || 1500}
                onChange={(e) => updateForm({ chunk_size: parseInt(e.target.value) || 1500 })}
                placeholder="Size of text chunks"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Chunk Overlap</Label>
              <Input
                type="number"
                className="col-span-3"
                value={form.chunk_overlap || 200}
                onChange={(e) => updateForm({ chunk_overlap: parseInt(e.target.value) || 200 })}
                placeholder="Overlap between chunks"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Max Token Limit</Label>
              <Input
                type="number"
                className="col-span-3"
                value={form.max_token_limit || 2000}
                onChange={(e) => updateForm({ max_token_limit: parseInt(e.target.value) || 2000 })}
                placeholder="Maximum tokens per chunk"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Include URLs</Label>
              <div className="col-span-3">
                <Switch
                  checked={form.include_urls}
                  onCheckedChange={(include_urls) => updateForm({ include_urls })}
                />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Extract Media</Label>
              <div className="col-span-3">
                <Switch
                  checked={form.extract_media_content}
                  onCheckedChange={(extract_media_content) => updateForm({ extract_media_content })}
                />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Retrieve Links</Label>
              <div className="col-span-3">
                <Switch
                  checked={form.retrieve_links}
                  onCheckedChange={(retrieve_links) => updateForm({ retrieve_links })}
                />
              </div>
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Live Data Source Configuration</DialogTitle>
          <DialogDescription>
            Configure a new live data source for real-time data processing.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="source-type" className="text-right">Source Type</Label>
            <Select value={form.type} onValueChange={(value) => updateForm({ type: value })}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select source type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="web-scraping">Web Scraping</SelectItem>
                <SelectItem value="zendesk">Zendesk</SelectItem>
                <SelectItem value="directus">Directus</SelectItem>
                <SelectItem value="perplexity">Perplexity</SelectItem>
                <SelectItem value="exa">Exa</SelectItem>
                <SelectItem value="bot-logs">Bot Logs</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {renderSourceTypeFields()}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button 
            onClick={handleSave}
            disabled={isLoading || !form.type || !form.name}
          >
            {isLoading ? 'Saving...' : 'Save Configuration'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 