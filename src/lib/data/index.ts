import { supabase } from "../agents/db"
export { supabase }

const sb = supabase.from("" as any)

declare global {
  type SupabaseQueryBuilder = typeof sb
}

export * from "./models/agents"

// const { data, error } = await supabase.from("agents").select()