import { useSupabase } from "./use-supabase"
import { useState, useCallback } from "react"

export interface SystemPrompt {
    id: string
    name: string
    content: string
    version: string
    language: string
    created_at: string
    updated_at: string
    created_by?: string
    status?: string
}

export function useSystemPrompts() {
    const supabase = useSupabase()
    const [loading, setLoading] = useState(false)

    const fetchPrompts = useCallback(async () => {
        try {
            setLoading(true)
            console.log("Fetching prompts from Supabase...")
            
            // First verify the connection and table
            const { error: tableError } = await supabase
                .from('system_prompts')
                .select('count')
                .limit(1)
            
            if (tableError) {
                console.error("Error verifying system_prompts table:", tableError)
                throw new Error("Could not verify system_prompts table. Please ensure it exists in your database.")
            }

            const { data, error } = await supabase
                .from('system_prompts')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) {
                console.error("Supabase error fetching prompts:", error)
                throw error
            }
            console.log("Supabase returned data:", data)
            return data || []
        } catch (error) {
            console.error('Error fetching system prompts:', error)
            return []
        } finally {
            setLoading(false)
        }
    }, [supabase])

    const addPrompt = useCallback(async (prompt: Omit<SystemPrompt, 'id' | 'created_at' | 'updated_at'>) => {
        try {
            setLoading(true)
            console.log("Adding prompt to Supabase:", prompt)
            
            // Verify we can access the table before inserting
            const { error: tableError } = await supabase
                .from('system_prompts')
                .select('count')
                .limit(1)
            
            if (tableError) {
                console.error("Error verifying system_prompts table:", tableError)
                throw new Error("Could not verify system_prompts table. Please ensure it exists in your database.")
            }

            const { data, error } = await supabase
                .from('system_prompts')
                .insert([{
                    ...prompt,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }])
                .select()
                .single()

            if (error) {
                console.error("Supabase error adding prompt:", error)
                throw error
            }
            console.log("Supabase returned new prompt:", data)
            return data
        } catch (error) {
            console.error('Error adding system prompt:', error)
            alert('Error creating prompt: ' + (error instanceof Error ? error.message : 'Unknown error'))
            return null
        } finally {
            setLoading(false)
        }
    }, [supabase])

    const updatePrompt = useCallback(async (id: string, updates: Partial<SystemPrompt>) => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('system_prompts')
                .update(updates)
                .eq('id', id)
                .select()
                .single()

            if (error) throw error
            return data
        } catch (error) {
            console.error('Error updating system prompt:', error)
            return null
        } finally {
            setLoading(false)
        }
    }, [supabase])

    const deletePrompt = useCallback(async (id: string) => {
        try {
            setLoading(true)
            const { error } = await supabase
                .from('system_prompts')
                .delete()
                .eq('id', id)

            if (error) throw error
            return true
        } catch (error) {
            console.error('Error deleting system prompt:', error)
            return false
        } finally {
            setLoading(false)
        }
    }, [supabase])

    return {
        loading,
        fetchPrompts,
        addPrompt,
        updatePrompt,
        deletePrompt
    }
} 