/**
 * useModels Hook
 * 
 * A hook to manage model data in the application.
 * Provides functionality to fetch, add, update, and delete models from the database.
 * 
 * @returns {Object} An object containing models data and operations:
 *   - models: The current list of models
 *   - loading: Boolean indicating if models are being loaded
 *   - error: Any error that occurred during loading
 *   - addModel: Function to add a new model
 *   - updateModel: Function to update an existing model
 *   - deleteModel: Function to delete a model
 *   - fetchModels: Function to refresh models
 */
import { useEffect, useState, useCallback } from 'react'
import { useSupabase } from './use-supabase'

export interface Model {
  id: string
  name: string
  model_id: string
  provider: string
  created_at: string
}

export function useModels() {
  const supabase = useSupabase()
  const [models, setModels] = useState<Model[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // Define fetchModels outside useEffect so it can be called manually
  const fetchModels = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('models')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setModels(data || [])
    } catch (error) {
      setError(error instanceof Error ? error : new Error(String(error)))
    } finally {
      setLoading(false)
    }
  }, [supabase])

  // Initial fetch
  useEffect(() => {
    fetchModels()
  }, [fetchModels])

  const addModel = async (modelData: Partial<Model>): Promise<Model | null> => {
    if (!modelData.name || !modelData.model_id || !modelData.provider) {
      throw new Error('Name, model_id, and provider are required')
    }

    try {
      const { data, error } = await supabase
        .from('models')
        .insert([modelData])
        .select()
        .single()

      if (error) throw error

      // Add new model to state
      setModels(prev => [...prev, data])
      return data
    } catch (error) {
      console.error('Error adding model:', error)
      throw error
    }
  }

  const updateModel = async (id: string, modelData: Partial<Model>): Promise<Model | null> => {
    try {
      const { data, error } = await supabase
        .from('models')
        .update(modelData)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      // Update model in state
      setModels(prev => prev.map(model => model.id === id ? data : model))
      return data
    } catch (error) {
      console.error('Error updating model:', error)
      throw error
    }
  }

  const deleteModel = async (id: string) => {
    try {
      const { error } = await supabase
        .from('models')
        .delete()
        .eq('id', id)

      if (error) throw error
      setModels(prev => prev.filter(model => model.id !== id))
      return true
    } catch (error) {
      setError(error instanceof Error ? error : new Error(String(error)))
      return false
    }
  }

  return { models, loading, error, addModel, updateModel, deleteModel, fetchModels }
} 