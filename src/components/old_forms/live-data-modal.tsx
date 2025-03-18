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
import { useSourceConfig, SourceConfig } from "@/hooks/use-source-config"
import { zendeskApi } from "@/api/getZendeskContent"

interface LiveDataModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Form state interface
interface FormState {
  name: string
  type: string
  enabled: boolean
  url?: string
  sitemap?: string
  subdomain?: string
  email?: string
  apiToken?: string
  locale?: string
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
  locale: "en-us",
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
  const { updateSourceConfig, createLiveDataElement } = useSourceConfig()
  
  const [form, setForm] = useState<FormState>(DEFAULT_FORM_STATE)
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState<string>('')

  const resetForm = () => {
    setForm(DEFAULT_FORM_STATE)
    setProgress('')
  }

  const handleSave = async () => {
    try {
      setIsLoading(true)
      setProgress('')

      // Create source first
      const source: Partial<Source> = {
        name: form.name,
        type: form.type,
        content: 'Pending content...',  // Required field
        tags: [form.type, 'Live Data']  // Add both type and Live Data tags
      }

      const savedSource = await addSource(source)
      if (!savedSource) throw new Error('Failed to create source')

      // Prepare config based on source type
      const config: Partial<SourceConfig> & { source: string } = {
        source: savedSource.id,
        enabled: form.enabled ? 1 : 0,
        type: form.type
      }

      // Add type-specific configuration
      if (form.type === 'web-scraping') {
        config.url = form.url
        config.sitemap = form.sitemap
        config.max_links = form.max_links
        config.crawl_depth = form.crawl_depth
        config.max_total_links = form.max_total_links
        config.include_external_links = form.include_external_links ? 1 : 0
        config.extract_main_content = form.extract_main_content ? 1 : 0
      } else if (form.type === 'zendesk') {
        config.subdomain = form.subdomain
        config.api_token = form.apiToken  // Save API token in config
        
        // Save the config first
        const savedConfig = await updateSourceConfig(config)
        if (!savedConfig) throw new Error('Failed to save source configuration')
        if (!savedConfig.source) throw new Error('Saved configuration is missing source ID')

        // If we have Zendesk credentials, fetch articles
        if (form.subdomain && form.email && form.apiToken) {
          try {
            console.log('Fetching Zendesk articles with:', {
              subdomain: form.subdomain,
              email: form.email,
              apiToken: '[REDACTED]'
            });

            const articles = await zendeskApi.getArticles(
              form.subdomain,
              form.email,
              form.apiToken,
              form.locale
            )
            console.log('Received articles from Zendesk:', {
              count: articles.length,
              sample: articles[0] ? {
                id: articles[0].id,
                title: articles[0].title,
                bodyLength: articles[0].body?.length,
                hasBody: !!articles[0].body
              } : null
            });
            
            // Store each article as a live data element
            let successCount = 0;
            let errorCount = 0;
            const totalArticles = articles.length;
            
            for (const [index, article] of articles.entries()) {
              if (!article.body) {
                console.warn('Skipping article with no body:', article.id);
                continue;
              }

              try {
                setProgress(`Importing article ${index + 1}/${totalArticles}: ${article.title}`)
                console.log('Creating live data element for article:', {
                  id: article.id,
                  title: article.title,
                  bodyLength: article.body.length
                });

                await createLiveDataElement({
                  source_config_id: savedConfig.source,
                  content: article.body,
                  metadata: {
                    title: article.title,
                    article_id: article.id,
                    url: article.html_url,
                    locale: article.locale,
                    updated_at: article.updated_at
                  },
                  status: 'active',
                  version: String(article.id)
                })
                successCount++;
              } catch (error) {
                console.error('Error creating live data element for article:', {
                  id: article.id,
                  error
                });
                errorCount++;
              }
            }

            setProgress('Finalizing import...')

            // Update source content with summary using direct Supabase update
            const { error: updateError } = await supabase
              .from('sources')
              .update({
                content: `Imported ${successCount} articles from Zendesk (${errorCount} failed)`
              })
              .eq('id', savedSource.id)

            if (updateError) {
              console.error('Error updating source content:', updateError);
              throw updateError;
            }

          } catch (error) {
            console.error('Error in Zendesk article processing:', error);
            throw new Error('Failed to fetch Zendesk articles')
          }
        }
      } else if (form.type === 'directus') {
        config.url = form.url
      } else if (form.type === 'bot-logs') {
        config.bot_log = form.bot_log
      }

      // Save config if not already saved for Zendesk
      if (form.type !== 'zendesk') {
        const savedConfig = await updateSourceConfig(config)
        if (!savedConfig) throw new Error('Failed to save source configuration')
      }

      onOpenChange(false)
    } catch (error) {
      console.error('Error in handleSave:', error)
      // You might want to show an error toast or message here
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
          <>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Subdomain</Label>
              <Input
                className="col-span-3"
                value={form.subdomain || ''}
                onChange={(e) => updateForm({ subdomain: e.target.value })}
                placeholder="your-company"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Email</Label>
              <Input
                className="col-span-3"
                type="email"
                value={form.email || ''}
                onChange={(e) => updateForm({ email: e.target.value })}
                placeholder="your-email@company.com"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">API Token</Label>
              <Input
                className="col-span-3"
                type="password"
                value={form.apiToken || ''}
                onChange={(e) => updateForm({ apiToken: e.target.value })}
                placeholder="Enter your Zendesk API token"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Locale</Label>
              <Input
                className="col-span-3"
                value={form.locale || ''}
                onChange={(e) => updateForm({ locale: e.target.value })}
                placeholder="e.g. en-us, fr, de, ja"
              />
            </div>
          </>
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

        {isLoading && progress && (
          <div className="h-8 bg-secondary/50 flex items-center justify-center border-y">
            <div className="text-sm text-muted-foreground">
              {progress}
            </div>
          </div>
        )}

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
          <div className="flex gap-2">
            <Button variant="outline" className="w-24" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={isLoading || !form.type || !form.name}
              className="w-32"
            >
              {isLoading ? 'Saving...' : 'Save Configuration'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 