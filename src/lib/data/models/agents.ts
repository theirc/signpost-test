import { agents } from "@/lib/agents"
import { supabase } from "../db"
import { createSupabaseModel } from "../model"
import { workerRegistry } from "@/lib/agents/registry"

declare global {
  type AgentDatabase = Partial<typeof model.defaultValue>
}

const model: SupabaseModel<"agents"> = {
  title: "Agents",
  fields: {
    id: { title: "ID", type: "string" },
    title: { title: "Title", type: "string" },
    created_at: { title: "Created At", type: "string" },
    edges: { title: "Edges", type: "json", hidden: true },
    workers: { title: "Workers", type: "json", hidden: true },
    description: { title: "Description", type: "string" },
    type: { title: "Type", type: "string", list: [{ value: "conversational", label: "Conversational" }, { value: "data", label: "Data" }] },
    team_id: { title: "Team ID", type: "string" },
    debuguuid: { title: "Debug Uuid", type: "string" },
    versions: { title: "Debug Uuid", type: "json" },
  },
}




export const agentsModel = createSupabaseModel(model, supabase.from("agents"), "agents")

