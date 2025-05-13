import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState } from "react"
import { useSupabase } from "@/hooks/use-supabase"
import { zendeskApi } from "@/api/getZendeskContent"
import { 
  FormState, 
  DEFAULT_FORM_STATE,
  ZendeskForm,
  WebScrapingForm,
  DirectusForm,
  PromptForm,
  BotLogsForm
} from "./live_data_forms"
import { 
  updateSourceConfig, 
  createLiveDataElement,
  SourceConfig,
  addSource,
  Source
} from '@/lib/data/supabaseFunctions'

interface LiveDataModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSourcesUpdated: () => void
}

export function LiveDataModal({ open, onOpenChange, onSourcesUpdated }: LiveDataModalProps) {
  const supabase = useSupabase()
  
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

      const { data: savedSource, error: sourceError } = await addSource(source)
      if (sourceError || !savedSource) throw new Error('Failed to create source')

      // Prepare config based on source type
      const config: Partial<SourceConfig> & { source: string } = {
        source: savedSource.id,
        enabled: form.enabled ? 1 : 0,
        type: form.type
      }

      // Add type-specific configuration
      if (form.type === 'web-scraping') {
        config.url = form.url
        
        try {
          // Save the config first - with better error logging
          console.log('Saving web scraping config:', config);
          const { data: savedConfig, error: configError } = await updateSourceConfig(config)
          
          if (configError || !savedConfig) {
            console.error('updateSourceConfig failed:', configError);
            // Update source content with error message
            await supabase
              .from('sources')
              .update({
                content: `Failed to configure web scraping for ${form.url}`
              })
              .eq('id', savedSource.id)
            
            setProgress('Error: Failed to save source configuration');
            await new Promise(resolve => setTimeout(resolve, 2000));
            onOpenChange(false);
            return;
          }
          
          console.log('Successfully saved web scraping config:', savedConfig);
          
          // Only proceed if we have a URL
          if (form.url) {
            try {
              setProgress('Fetching content from URL...')
              
              // Dynamically import scraping functions
              setIsLoading(true)
              try {
                // CORRECTED import path
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
                const { error: elementError } = await createLiveDataElement({
                  source_config_id: savedConfig.source,
                  content: content,
                  metadata: {
                    url: form.url,
                    title: form.name,
                    fetched_at: new Date().toISOString()
                  },
                  status: 'active',
                  version: '1'
                })

                if (elementError) {
                  throw elementError;
                }
                
                // Update source content with summary
                const { error: updateError } = await supabase
                  .from('sources')
                  .update({
                    content: `Content fetched from ${form.url} (${new Date().toLocaleString()})`
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
                    content: `Error fetching content from ${form.url}: ${error instanceof Error ? error.message : 'Unknown error'}`
                  })
                  .eq('id', savedSource.id)
                
                setProgress(`Error: ${error instanceof Error ? error.message : 'Failed to fetch content'}`)
                // Don't throw here to allow the dialog to close
                // But still allow a small delay so user can see the error
                await new Promise(resolve => setTimeout(resolve, 2000))
              } finally {
                 setIsLoading(false); // Add finally block to ensure isLoading is reset
              }
            } catch (error) {
              // This outer catch handles errors from the config saving step before scraping
              console.error('Error before or during web scraping initiation:', error);
              // Update source content with configuration error message
              await supabase
                .from('sources')
                .update({
                  content: `Failed to configure web scraping: ${error instanceof Error ? error.message : 'Database error'}`
                })
                .eq('id', savedSource.id);
              
              setProgress(`Error: ${error instanceof Error ? error.message : 'Failed to configure'}`);
              await new Promise(resolve => setTimeout(resolve, 2000));
            }
          }
        } catch (error) {
          console.error('Error saving web scraping configuration:', error);
          // Update source content with error message if config saving failed
          // Ensure savedSource exists before trying to update
          if (savedSource?.id) { 
            await supabase
              .from('sources')
              .update({
                content: `Failed to save web scraping config: ${error instanceof Error ? error.message : 'Database error'}`
              })
              .eq('id', savedSource.id);
          }
          
          setProgress(`Error: ${error instanceof Error ? error.message : 'Failed to save config'}`);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
        // We've handled this case completely, so close the modal
        onOpenChange(false);
        onSourcesUpdated();
        return;
      } else if (form.type === 'zendesk') {
        config.subdomain = form.subdomain
        config.api_token = form.apiToken  // Save API token in config
        
        // Save the config first
        const { data: savedConfig, error: configError } = await updateSourceConfig(config)
        if (configError || !savedConfig) throw new Error('Failed to save source configuration')
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

                const { error: elementError } = await createLiveDataElement({
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

                if (elementError) {
                  throw elementError;
                }

                successCount++;
              } catch (error) {
                console.error('Error creating live data element for article:', {
                  id: article.id,
                  error
                });
                errorCount++;
              }
            }

            // Update source content with summary
            const { error: updateError } = await supabase
              .from('sources')
              .update({
                content: `Imported ${successCount} Zendesk articles (${errorCount} failed)`
              })
              .eq('id', savedSource.id)

            if (updateError) {
              console.error('Error updating source content:', updateError)
              throw updateError
            }

            setProgress(`Successfully imported ${successCount} articles (${errorCount} failed)`)
            await new Promise(resolve => setTimeout(resolve, 2000))
            onOpenChange(false)
            onSourcesUpdated();
          } catch (error) {
            console.error('Error in Zendesk import:', error)
            // Update source content with error message
            await supabase
              .from('sources')
              .update({
                content: `Error importing Zendesk articles: ${error instanceof Error ? error.message : 'Unknown error'}`
              })
              .eq('id', savedSource.id)
            
            setProgress(`Error: ${error instanceof Error ? error.message : 'Failed to import articles'}`)
            await new Promise(resolve => setTimeout(resolve, 2000))
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
      onSourcesUpdated();
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