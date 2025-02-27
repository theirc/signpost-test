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
}

export function useSourceConfig() {
  const supabase = useSupabase()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const getConfigForSource = async (sourceId: string) => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('source_config')
        .select('*')
        .eq('source_id', sourceId)
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

  const updateSourceConfig = async (config: Partial<SourceConfig> & { source_id: string }) => {
    try {
      setLoading(true)
      
      // Check if config exists
      const { data: existingConfig } = await supabase
        .from('source_config')
        .select('id')
        .eq('source_id', config.source_id)
        .single()
      
      let result;
      
      if (existingConfig) {
        // Update existing config
        const { data, error } = await supabase
          .from('source_config')
          .update(config)
          .eq('source_id', config.source_id)
          .select()
        
        if (error) throw error
        result = data?.[0]
      } else {
        // Insert new config
        const { data, error } = await supabase
          .from('source_config')
          .insert([config])
          .select()
        
        if (error) throw error
        result = data?.[0]
      }
      
      return result as SourceConfig
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)))
      return null
    } finally {
      setLoading(false)
    }
  }

  return { 
    getConfigForSource,
    updateSourceConfig,
    loading, 
    error 
  }
} 