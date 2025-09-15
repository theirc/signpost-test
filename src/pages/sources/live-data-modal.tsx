import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState } from "react"
import { useTeamStore } from "@/lib/hooks/useTeam"
import { 
  FormState, 
  DEFAULT_FORM_STATE,
  ZendeskForm,
  WebScrapingForm,
  DirectusForm,
  PromptForm,
  BotLogsForm
} from "./live_data_forms"
import { handleZendeskImport } from "./live_data_forms/zendesk"
import { supabase } from "@/lib/agents/db"
import { useQueryClient } from '@tanstack/react-query'

interface LiveDataModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSourcesUpdated: () => void
}

export function LiveDataModal({ open, onOpenChange, onSourcesUpdated }: LiveDataModalProps) {
  const [form, setForm] = useState<FormState>(DEFAULT_FORM_STATE)
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState<string>('')
  const queryClient = useQueryClient()

  const handleSave = async () => {
    try {
      setIsLoading(true)
      setProgress('')

      const selectedTeam = useTeamStore.getState().selectedTeam
      if (!selectedTeam) {
        throw new Error('No team selected')
      }

      const { data: savedSource, error: sourceError } = await supabase
        .from('sources')
        .insert([{
          name: form.name,
          type: form.type,
          content: 'Pending content...',  // Required field
          tags: [form.type, 'Live Data'],  // Add both type and Live Data tags
          team_id: selectedTeam.id
        }])
        .select()
        .single()

      if (sourceError || !savedSource) throw new Error('Failed to create source')

      // Add type-specific configuration
      if (form.type === 'web-scraping') {
        // Save the config directly with Supabase
        const { data: savedConfig, error: configError } = await supabase
          .from('source_configs')
          .insert([{
            source: savedSource.id,
            enabled: form.enabled ? 1 : 0,
            type: form.type,
            url: form.url,
            team_id: selectedTeam.id
          }])
          .select()
          .single()
        
        if (configError || !savedConfig) {
          console.error('Failed to save web scraping config:', configError);
          // Update source content with error message
          await supabase
            .from('sources')
            .update({
              content: `Failed to configure web scraping for ${form.url}`,
              vector: null
            })
            .eq('id', savedSource.id)
          
          setProgress('Error: Failed to save source configuration');
          await new Promise(resolve => setTimeout(resolve, 2000));
          onOpenChange(false);
          return;
        }

        // Only proceed if we have a URL
        if (form.url) {
          try {
            setProgress('Fetching content from URL...')
            
            // Dynamically import scraping functions
            setIsLoading(true)
            try {
              const { performWebScrape, htmlToPlainText } = await import('@/lib/fileUtilities/use-web-scraping')
              
              console.log(`Scraping URL: ${form.url}`)
              
              // Get HTML from the URL
              setProgress('Connecting to website...')
              const html = await performWebScrape(form.url)
              if (!html) {
                setProgress('Error: No content received from website')
                throw new Error('No content received from website')
              }
              
              setProgress('Processing content...')
              // Convert HTML to plain text
              const content = htmlToPlainText(html)
              
              if (!content || content.length < 10) {
                setProgress('Error: Received content is too short or empty')
                throw new Error('Received content is too short or empty')
              }
              
              setProgress('Saving content...')
              // Create a single live data element with the content
              const { error: elementError } = await supabase
                .from('live_data_elements')
                .insert([{
                  source_config_id: savedConfig.source,
                  content: content,
                  metadata: {
                    url: form.url,
                    title: form.name,
                    fetched_at: new Date().toISOString()
                  },
                  status: 'active',
                  version: '1',
                  team_id: selectedTeam.id
                }])

              if (elementError) {
                throw elementError;
              }
              
              // Update source content with summary
              const { error: updateError } = await supabase
                .from('sources')
                .update({
                  content: `Content fetched from ${form.url} (${new Date().toLocaleString()})`,
                  vector: null
                })
                .eq('id', savedSource.id)
              
              if (updateError) {
                console.error('Error updating source content:', updateError)
                throw updateError
              }
              
              setProgress('URL content successfully imported!')
            } catch (error) {
              console.error('Error in web scraping process:', error)
              // Update source content with error message
              await supabase
                .from('sources')
                .update({
                  content: `Error fetching content from ${form.url}: ${error instanceof Error ? error.message : 'Unknown error'}`,
                  vector: null
                })
                .eq('id', savedSource.id)
              
              setProgress(`Error: ${error instanceof Error ? error.message : 'Failed to fetch content'}`)
              // Don't throw here to allow the dialog to close
              // But still allow a small delay so user can see the error
              await new Promise(resolve => setTimeout(resolve, 2000))
            } finally {
              setIsLoading(false)
            }
          } catch (error) {
            console.error('Error before or during web scraping initiation:', error)
            // Update source content with configuration error message
            await supabase
              .from('sources')
              .update({
                content: `Failed to configure web scraping: ${error instanceof Error ? error.message : 'Database error'}`,
                vector: null
              })
              .eq('id', savedSource.id)
            
            setProgress(`Error: ${error instanceof Error ? error.message : 'Failed to configure'}`)
            await new Promise(resolve => setTimeout(resolve, 2000))
          }
        }
        
        // We've handled this case completely, so close the modal
        onOpenChange(false)
        
        queryClient.invalidateQueries({
          queryKey: ['supabase-table', 'sources'],
          exact: false
        })
        
        onSourcesUpdated()
        return
      } else if (form.type === 'zendesk') {
        try {
          await handleZendeskImport(
            savedSource.id,
            {
              subdomain: form.subdomain,
              email: form.email,
              apiToken: form.apiToken,
              locale: form.locale
            },
            setProgress
          )
          await new Promise(resolve => setTimeout(resolve, 2000))
          
          queryClient.invalidateQueries({
            queryKey: ['supabase-table', 'sources'],
            exact: false
          })
          
          onOpenChange(false)
          onSourcesUpdated()
        } catch (error) {
          console.error('Error in Zendesk import:', error)
          setProgress(`Error: ${error instanceof Error ? error.message : 'Failed to import articles'}`)
          await new Promise(resolve => setTimeout(resolve, 2000))
        }
        return
      } else if (form.type === 'directus') {
        // Save Directus config directly
        const { data: savedConfig, error: configError } = await supabase
          .from('source_configs')
          .insert([{
            source: savedSource.id,
            enabled: form.enabled ? 1 : 0,
            type: form.type,
            url: form.url,
            team_id: selectedTeam.id
          }])
          .select()
          .single()

        if (configError || !savedConfig) throw new Error('Failed to save source configuration')
      } else if (form.type === 'bot-logs') {
        // Save bot logs config directly
        const { data: savedConfig, error: configError } = await supabase
          .from('source_configs')
          .insert([{
            source: savedSource.id,
            enabled: form.enabled ? 1 : 0,
            type: form.type,
            bot_log: form.bot_log,
            team_id: selectedTeam.id
          }])
          .select()
          .single()

        if (configError || !savedConfig) throw new Error('Failed to save source configuration')
      }

      queryClient.invalidateQueries({
        queryKey: ['supabase-table', 'sources'],
        exact: false
      })

      onOpenChange(false)
      onSourcesUpdated();
    } catch (error) {
      console.error('Error in handleSave:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const updateForm = (updates: Partial<FormState>) => {
    setForm(prev => ({ ...prev, ...updates }))
  }

  const renderFormByType = () => {
    if (!form.type) return null

    switch (form.type) {
      case 'web-scraping':
        return <WebScrapingForm form={form} updateForm={updateForm} />
      case 'zendesk':
        return <ZendeskForm form={form} updateForm={updateForm} />
      case 'directus':
        return <DirectusForm form={form} updateForm={updateForm} />
      case 'perplexity':
      case 'exa':
        return <PromptForm form={form} updateForm={updateForm} />
      case 'bot-logs':
        return <BotLogsForm form={form} updateForm={updateForm} />
      default:
        return null
    }
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

          {renderFormByType()}
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