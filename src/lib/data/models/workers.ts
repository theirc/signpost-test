import { supabase } from "../db"
import { createSupabaseModel } from "../model"

declare global {
  type WorkerConfig = Omit<Partial<typeof model.defaultValue>, "handles"> & { handles?: WorkerHandles, type: WorkerTypes }
}

const model: SupabaseModel<"workers"> = {
  title: "Agents",
  fields: {
    id: { title: "ID" },
    created_at: { title: "Created At" },
    handles: { title: "Handles" },
    type: { title: "Type" },
    x: { title: "X" },
    y: { title: "Y" },
    agent: { title: "Agent" },
    parameters: { title: "Parameters" },
  },
}

export const workers = createSupabaseModel(model, supabase.from("workers"), "workers")


