import { createClient } from '@supabase/supabase-js'
import type { Database } from '../agents/supabase'
import { env } from '../env'

export const supabase = createClient<Database>(env.SUPABASE_URL, env.SUPABASE_ANON_KEY)

declare global {

  type TableKeys = keyof Database["public"]["Tables"]
  type Table<T extends TableKeys> = Database["public"]["Tables"][T]["Row"]

}

