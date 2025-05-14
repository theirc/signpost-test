import { useTeamStore } from "@/lib/hooks/useTeam"
import { zendeskApi } from "@/api/getZendeskContent"
import { useSupabase } from "@/hooks/use-supabase"

interface ZendeskConfig {
  subdomain: string
  email: string
  apiToken: string
  locale?: string
}

export async function handleZendeskImport(
  sourceId: string,
  config: ZendeskConfig,
  onProgress: (message: string) => void
) {
  const selectedTeam = useTeamStore.getState().selectedTeam
  if (!selectedTeam) {
    throw new Error('No team selected')
  }

  try {
    // Save Zendesk config
    const { data: savedConfig, error: configError } = await useSupabase()
      .from('source_configs')
      .insert([{
        source: sourceId,
        enabled: 1,
        type: 'zendesk',
        subdomain: config.subdomain,
        api_token: config.apiToken,
        team_id: selectedTeam.id
      }])
      .select()
      .single()

    if (configError || !savedConfig) throw new Error('Failed to save source configuration')
    if (!savedConfig.source) throw new Error('Saved configuration is missing source ID')

    // Fetch articles from Zendesk
    console.log('Fetching Zendesk articles with:', {
      subdomain: config.subdomain,
      email: config.email,
      apiToken: '[REDACTED]'
    })

    const articles = await zendeskApi.getArticles(
      config.subdomain,
      config.email,
      config.apiToken,
      config.locale
    )

    console.log('Received articles from Zendesk:', {
      count: articles.length,
      sample: articles[0] ? {
        id: articles[0].id,
        title: articles[0].title,
        bodyLength: articles[0].body?.length,
        hasBody: !!articles[0].body
      } : null
    })
    
    // Store each article as a live data element
    let successCount = 0
    let errorCount = 0
    const totalArticles = articles.length
    
    for (const [index, article] of articles.entries()) {
      if (!article.body) {
        console.warn('Skipping article with no body:', article.id)
        continue
      }

      try {
        onProgress(`Importing article ${index + 1}/${totalArticles}: ${article.title}`)
        console.log('Creating live data element for article:', {
          id: article.id,
          title: article.title,
          bodyLength: article.body.length
        })

        const { error: elementError } = await useSupabase()
          .from('live_data_elements')
          .insert([{
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
            version: String(article.id),
            team_id: selectedTeam.id
          }])

        if (elementError) {
          throw elementError
        }

        successCount++
      } catch (error) {
        console.error('Error creating live data element for article:', {
          id: article.id,
          error
        })
        errorCount++
      }
    }

    // Update source content with summary
    const { error: updateError } = await useSupabase()
      .from('sources')
      .update({
        content: `Imported ${successCount} Zendesk articles (${errorCount} failed)`
      })
      .eq('id', sourceId)

    if (updateError) {
      console.error('Error updating source content:', updateError)
      throw updateError
    }

    onProgress(`Successfully imported ${successCount} articles (${errorCount} failed)`)
    return { successCount, errorCount }
  } catch (error) {
    console.error('Error in Zendesk import:', error)
    // Update source content with error message
    await useSupabase()
      .from('sources')
      .update({
        content: `Error importing Zendesk articles: ${error instanceof Error ? error.message : 'Unknown error'}`
      })
      .eq('id', sourceId)
    
    throw error
  }
} 