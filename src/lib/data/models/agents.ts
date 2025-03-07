import { buildAgent } from "@/lib/agents"
import { supabase } from "../db"
import { createSupabaseModel } from "../model"
import { workers } from "./workers"

declare global {
  type AgentConfig = Partial<typeof model.defaultValue>
  // export type Json<D extends number = 9, DA extends any[] = []> =
  //   | string
  //   | number
  //   | boolean
  //   | null
  //   | (D extends DA['length'] ? any : { [key: string]: Json<D, [0, ...DA]> | undefined })
  //   | (D extends DA['length'] ? any : Json<D, [0, ...DA]>[])
}

const model: SupabaseModel<"agents"> = {
  title: "Agents",
  fields: {
    id: { title: "ID", type: "string" },
    title: { title: "Title", type: "string" },
    created_at: { title: "Created At", type: "string" },
    edges: { title: "Edges", type: "json", hidden: true },
  },
}


async function saveAgent(agent: Agent) {

  for (const key in agent.workers) {
    const w = agent.workers[key].config
    const wc = {
      id: w.id,
      type: w.type,
      handles: {},
      x: w.x,
      y: w.y,
      agent: agent.id
    }
    for (const key in w.handles) {
      const h = w.handles[key]
      const { worker, ...rest } = h
      wc.handles[key] = rest
    }
    const { data, error } = await workers.upsert(wc as any).select()
  }

  const updateAgent: AgentConfig = {
    title: agent.title,
    edges: agent.edges
  }

  if (agent.id) {
    await agents.update(updateAgent).eq("id", agent.id)
  } else {
    const { data } = await agents.insert(updateAgent).select()
    agent.id = data[0].id
  }

}

async function loadAgent(id: number): Promise<Agent> {

  const { data } = await agents.select(`
    *,
    workers (
      *
    )
  `).eq("id", id).single()

  let { workers, ...agentdata } = data

  const agent = buildAgent(agentdata)

  workers = workers || []

  for (const w of workers) {
    const { handles, ...rest } = w
    const wrk = agent.addWorker(rest as WorkerConfig)
    for (const key in (handles as unknown as WorkerHandles)) {
      const h = handles[key] as NodeIO
      wrk.addHandler(h)
    }
  }


  return agent
}



export const agents = createSupabaseModel(model, supabase.from("agents")).withFunctions({
  saveAgent,
  loadAgent,
})






