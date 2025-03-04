import { createClient } from '@supabase/supabase-js'
import { Database, Tables } from './supabase'
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
export const supabase = createClient<Database>(supabaseUrl, supabaseKey)

export * from "./models/agents"

// const { data, error } = await supabase.from("agents").select()