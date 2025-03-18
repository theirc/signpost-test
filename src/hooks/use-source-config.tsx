/**
 * useSourceConfig Hook
 * 
 * A hook to manage configuration settings for different source types.
 * Handles loading, saving, and updating source-specific configuration options.
 * 
 * @param {string} sourceId - The ID of the source to manage configuration for
 * @returns {Object} An object containing configuration state and operations:
 *   - config: The current configuration object
 *   - loading: Boolean indicating if configuration is loading
 *   - saveConfig: Function to save configuration changes
 *   - updateConfig: Function to update specific configuration fields
 */
import { useEffect, useState } from 'react'
import { useSupabase } from './use-supabase'

export type SourceConfig = {
  id: string
  source: string
  enabled: number
  url?: string
  sitemap?: string
  subdomain?: string
  map?: string
  prompt?: string
  bot_log?: string
  max_links?: number
  crawl_depth?: number
  max_total_links?: number
  include_external_links?: number
  extract_main_content?: number
  chunk_size?: number
  chunk_overlap?: number
  max_token_limit?: number
  include_urls?: number
  extract_media_content?: number
  exclude_urls?: string[]
  retrieve_links?: number
  type?: string
  api_token?: string
}

export type LiveDataElement = {
  id?: string
  source_config_id: string
  content: string
  version?: string
  fetch_timestamp?: string
  status?: string
  metadata?: any
  last_updated?: string
  created_at?: string
}

export function useSourceConfig() {
  const supabase = useSupabase()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const getConfigForSource = async (sourceId: string) => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('source_configs')
        .select('*')
        .eq('source', sourceId)
        .single()

      if (error && error.code !== 'PGRST116') throw error // PGRST116 is "no rows returned"
      return data as SourceConfig | null
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)))
      return null
    } finally {
      setLoading(false)
    }
  }

  const updateSourceConfig = async (config: Partial<SourceConfig> & { source: string }) => {
    try {
      setLoading(true)
      console.log('Starting updateSourceConfig with config:', config);
      
      // Check if config exists
      console.log('Checking if config exists for source:', config.source);
      const { data: existingConfig, error: checkError } = await supabase
        .from('source_configs')
        .select('id')
        .eq('source', config.source)
        .single()

      if (checkError) {
        console.log('Error checking existing config:', checkError);
      }
      
      console.log('Existing config check result:', existingConfig);
      
      let result;
      
      if (existingConfig) {
        console.log('Updating existing config for source:', config.source);
        const { data, error } = await supabase
          .from('source_configs')
          .update(config)
          .eq('source', config.source)
          .select('*')
        
        if (error) {
          console.error('Error updating config:', error);
          throw error;
        }
        console.log('Update response:', data);
        result = data?.[0]
      } else {
        console.log('Inserting new config:', config);
        const { data, error } = await supabase
          .from('source_configs')
          .insert([config])
          .select('*')
        
        if (error) {
          console.error('Error inserting config:', error);
          throw error;
        }
        console.log('Insert response:', data);
        result = data?.[0]
      }
      
      console.log('Final result:', result);
      return result as SourceConfig
    } catch (err) {
      console.error('Error in updateSourceConfig:', err);
      if (err instanceof Error) {
        console.error('Error details:', {
          message: err.message,
          stack: err.stack
        });
      }
      setError(err instanceof Error ? err : new Error(String(err)))
      return null
    } finally {
      setLoading(false)
    }
  }

  const createLiveDataElement = async (element: Partial<LiveDataElement>) => {
    try {
      setLoading(true)
      console.log('Creating live data element:', element);
      
      if (!element.source_config_id || !element.content) {
        throw new Error('source_config_id and content are required for live data elements');
      }
      
      const { data, error } = await supabase
        .from('live_data_elements')
        .insert([{
          source_config_id: element.source_config_id,
          content: element.content,
          version: element.version || 1,
          status: element.status || 'active',
          metadata: element.metadata || {},
          fetch_timestamp: element.fetch_timestamp || new Date().toISOString()
        }])
        .select()
      
      if (error) {
        console.error('Error creating live data element:', error);
        throw error;
      }
      
      console.log('Created live data element:', data);
      return data?.[0] as LiveDataElement
    } catch (err) {
      console.error('Error in createLiveDataElement:', err);
      setError(err instanceof Error ? err : new Error(String(err)))
      return null
    } finally {
      setLoading(false)
    }
  }

  const getLiveDataElements = async (sourceConfigId: string) => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('live_data_elements')
        .select('*')
        .eq('source_config_id', sourceConfigId)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data as LiveDataElement[]
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)))
      return []
    } finally {
      setLoading(false)
    }
  }

  return { 
    getConfigForSource,
    updateSourceConfig,
    createLiveDataElement,
    getLiveDataElements,
    loading, 
    error 
  }
} 