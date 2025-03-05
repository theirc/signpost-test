import { supabase } from "../db"
import { createSupabaseModel } from "../model"

const model: SupabaseModel<"agents"> = {
  title: "Agents",
  fields: {
    id: { title: "ID", type: "string" },
    created_at: { title: "Created At", type: "string" },
    title: { title: "Title", type: "string" },
  }
}

export const agents = createSupabaseModel(model, supabase.from("agents"))





