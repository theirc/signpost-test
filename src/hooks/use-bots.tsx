/**
 * useBots Hook
 * 
 * A hook to manage bot data in the application.
 * Provides functionality to fetch, add, update, and delete bots from the database.
 * 
 * @returns {Object} An object containing bots data and operations:
 *   - bots: The current list of bots
 *   - loading: Boolean indicating if bots are being loaded
 *   - error: Any error that occurred during loading
 *   - addBot: Function to add a new bot
 *   - updateBot: Function to update an existing bot
 *   - deleteBot: Function to delete a bot
 *   - fetchBots: Function to refresh bots
 */
import { useEffect, useState, useCallback } from 'react'
import { useSupabase } from './use-supabase'

export type Bot = {
  id: string
  name: string
  model: string
  collection?: string
  knowledge_collections?: string[]
  knowledge_sources?: string[]
  system_prompt?: string
  temperature?: number
  created_at: string
  updated_at: string
  creator?: string
  average_speed?: number
  last_run?: string
  archived?: boolean
}

export function useBots() {
  const supabase = useSupabase()
  const [bots, setBots] = useState<Bot[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // Define fetchBots outside useEffect so it can be called manually
  const fetchBots = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('bots')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setBots(data || [])
    } catch (error) {
      setError(error instanceof Error ? error : new Error(String(error)))
    } finally {
      setLoading(false)
    }
  }, [supabase])

  // Initial fetch
  useEffect(() => {
    fetchBots()
  }, [fetchBots])

  const addBot = async (botData: Partial<Bot>): Promise<Bot | null> => {
    if (!botData.name || !botData.model) {
      throw new Error('Name and model are required')
    }

    try {
      const { data, error } = await supabase
        .from('bots')
        .insert([botData])
        .select()
        .single()

      if (error) throw error

      // Add new bot to state
      setBots(prev => [...prev, data])
      return data
    } catch (error) {
      console.error('Error adding bot:', error)
      throw error
    }
  }

  const updateBot = async (id: string, botData: Partial<Bot>): Promise<Bot | null> => {
    try {
      const { data, error } = await supabase
        .from('bots')
        .update(botData)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      // Update bot in state
      setBots(prev => prev.map(bot => bot.id === id ? data : bot))
      return data
    } catch (error) {
      console.error('Error updating bot:', error)
      throw error
    }
  }

  const deleteBot = async (id: string) => {
    try {
      const { error } = await supabase
        .from('bots')
        .delete()
        .eq('id', id)

      if (error) throw error
      setBots(prev => prev.filter(bot => bot.id !== id))
      return true
    } catch (error) {
      setError(error instanceof Error ? error : new Error(String(error)))
      return false
    }
  }

  return { bots, loading, error, addBot, updateBot, deleteBot, fetchBots }
} 