import { createClient } from '@supabase/supabase-js'
import { Database } from './agents/supabase'
import { env } from './env'

// Create a single, shared Supabase client instance
export const supabase = createClient<Database>(env.SUPABASE_URL, env.SUPABASE_ANON_KEY)

// Export the client as default for convenience
export default supabase 