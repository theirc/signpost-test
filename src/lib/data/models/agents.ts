import { agents } from "@/lib/agents"
import { supabase } from "../db"
import { createSupabaseModel } from "../model"
import { workerRegistry } from "@/lib/agents/registry"

declare global {
  type AgentConfig = Partial<typeof model.defaultValue>
}

const model: SupabaseModel<"agents"> = {
  title: "Agents",
  fields: {
    id: { title: "ID", type: "string" },
    title: { title: "Title", type: "string" },
    created_at: { title: "Created At", type: "string" },
    edges: { title: "Edges", type: "json", hidden: true },
    workers: { title: "Workers", type: "json", hidden: true },
  },
}




export const agentsModel = createSupabaseModel(model, supabase.from("agents"), "agents")

