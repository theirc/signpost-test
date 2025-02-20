import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { Switch } from "@/components/ui/switch"
import { availableSources, updateAvailableSources } from "./files-modal"
import type { Source } from "@/components/sources-table"
import { Textarea } from "@/components/ui/textarea"

interface LiveDataModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSourcesUpdate: (sources: Source[]) => void
}

interface SourceConfig {
  name: string
  enabled: boolean
  url?: string
  sitemap?: string
  subdomain?: string
  mapId?: string
  prompt?: string
  botLogId?: string
}

interface LiveDataConfig {
  sourceId: string
  enabled: boolean
  url?: string
  sitemap?: string
  subdomain?: string
  mapId?: string
  prompt?: string
  botLogId?: string
}

const DEFAULT_CONFIG: SourceConfig = {
  name: '',
  enabled: true,
}

// Store configurations separately
export const liveDataConfigs: LiveDataConfig[] = []

export function LiveDataModal({ open, onOpenChange, onSourcesUpdate }: LiveDataModalProps) {
  const [sourceType, setSourceType] = useState<string>('')
  const [config, setConfig] = useState<SourceConfig>(DEFAULT_CONFIG)

  const handleSave = () => {
    if (!sourceType || !config.name) return

    const newSource: Source = {
      id: Math.random().toString(36).substring(7),
      name: config.name,
      type: sourceType,
      lastUpdated: new Date().toISOString(),
      content: '',
      tags: ['Live Data', sourceType.toLowerCase()]
    }

    const updatedSources = [...availableSources, newSource]
    updateAvailableSources(updatedSources)
    onSourcesUpdate(updatedSources)

    // Store configuration separately
    liveDataConfigs.push({
      sourceId: newSource.id,
      enabled: config.enabled,
      url: config.url,
      sitemap: config.sitemap,
      subdomain: config.subdomain,
      mapId: config.mapId,
      prompt: config.prompt,
      botLogId: config.botLogId
    })

    // Reset form and close modal
    setSourceType('')
    setConfig(DEFAULT_CONFIG)
    onOpenChange(false)
  }

  const updateConfig = (updates: Partial<SourceConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Live Data Source Configuration</DialogTitle>
          <DialogDescription>
            Configure and manage your live data sources for real-time data processing.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="source-type" className="text-right">Source Type</Label>
            <Select value={sourceType} onValueChange={setSourceType}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select source type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="zendesk">Zendesk</SelectItem>
                <SelectItem value="perplexity">Perplexity</SelectItem>
                <SelectItem value="directus">Directus</SelectItem>
                <SelectItem value="exa">Exa</SelectItem>
                <SelectItem value="web-scraping">Web Scraping</SelectItem>
                <SelectItem value="bot-logs">Bot Logs</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {sourceType && (
            <>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="source-name" className="text-right">Name</Label>
                <Input
                  id="source-name"
                  className="col-span-3"
                  value={config.name}
                  onChange={(e) => updateConfig({ name: e.target.value })}
                  placeholder="Enter source name"
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Enabled</Label>
                <div className="col-span-3">
                  <Switch
                    checked={config.enabled}
                    onCheckedChange={(enabled) => updateConfig({ enabled })}
                  />
                </div>
              </div>

              {sourceType === 'zendesk' && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Subdomain</Label>
                  <Input
                    className="col-span-3"
                    value={config.subdomain || ''}
                    onChange={(e) => updateConfig({ subdomain: e.target.value })}
                    placeholder="your-company"
                  />
                </div>
              )}

              {sourceType === 'directus' && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Map ID</Label>
                  <Input
                    className="col-span-3"
                    value={config.mapId || ''}
                    onChange={(e) => updateConfig({ mapId: e.target.value })}
                    placeholder="Enter map ID"
                  />
                </div>
              )}

              {sourceType === 'web-scraping' && (
                <>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">URL</Label>
                    <Input
                      className="col-span-3"
                      value={config.url || ''}
                      onChange={(e) => updateConfig({ url: e.target.value })}
                      placeholder="https://example.com"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Sitemap URL</Label>
                    <Input
                      className="col-span-3"
                      value={config.sitemap || ''}
                      onChange={(e) => updateConfig({ sitemap: e.target.value })}
                      placeholder="https://example.com/sitemap.xml (optional)"
                    />
                  </div>
                </>
              )}

              {sourceType === 'bot-logs' && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Bot Log ID</Label>
                  <Input
                    className="col-span-3"
                    value={config.botLogId || ''}
                    onChange={(e) => updateConfig({ botLogId: e.target.value })}
                    placeholder="Enter bot log ID"
                  />
                </div>
              )}

              {(sourceType === 'perplexity' || sourceType === 'exa') && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Prompt</Label>
                  <div className="col-span-3">
                    <Textarea
                      value={config.prompt || ''}
                      onChange={(e) => updateConfig({ prompt: e.target.value })}
                      placeholder={`Enter ${sourceType} prompt...`}
                      className="min-h-[100px]"
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button 
            type="submit" 
            onClick={handleSave}
            disabled={!sourceType || !config.name || (sourceType === 'web-scraping' && !config.url)}
          >
            Save Configuration
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 