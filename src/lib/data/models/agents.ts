import { buildAgent } from "@/lib/agents"
import { supabase } from "../db"
import { createSupabaseModel } from "../model"
import { workerRegistry } from "@/lib/agents/registry"
// import { synced } from "../../agents/synced/synced"
// import axios from "axios"

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
    workers: { title: "Workers", type: "json", hidden: true },
  },
}


async function saveAgent(agent: Agent) {

  const agentData: AgentConfig = {
    title: agent.title,
    edges: agent.edges
  }
  const workerlist = []


  for (const key in agent.workers) {
    const w = agent.workers[key].config
    const wc: WorkerConfig = {
      id: w.id,
      type: w.type,
      handles: {},
      x: w.x,
      y: w.y,
      parameters: w.parameters || {},
      condition: w.condition || {}
    }
    for (const key in w.handles) {
      const h = w.handles[key]
      delete h.value
      delete h.value
      wc.handles[key] = h
    }

    workerlist.push(wc)

    // await workers.data.upsert(wc as any)

  }

  agentData.workers = workerlist


  if (agent.id) {
    await agents.data.update(agentData).eq("id", agent.id)
  } else {
    const { data } = await agents.data.insert(agentData).select()
    agent.id = data[0].id
  }


  console.log(workerlist)


}

async function loadAgent(id: number): Promise<Agent> {

  console.log("Loading agent: ", id)

  const { data } = await agents.data.select("*").eq("id", id).single()
  const workers: WorkerConfig[] = (data.workers || []) as any
  const agent = buildAgent(data)

  for (const w of workers) {
    const { handles, ...rest } = w

    console.log("Loading worker: ", w.type)

    const factory = (workerRegistry[w.type] as WorkerRegistryItem)
    if (!factory) continue
    const wrk = factory.create(agent)
    Object.assign(wrk.config, rest)

    wrk.parameters = w.parameters || {}
    wrk.condition = w.condition || {}

    for (const key in (handles as unknown as WorkerHandles)) {
      const h = handles[key] as NodeIO
      const existingHandler = wrk.fields[h.name]
      if (existingHandler) {
        existingHandler.id = h.id
        existingHandler.default = h.default
        // if (h.persistent) existingHandler.value = h.value
        continue
      }
      wrk.addHandler(h)
    }

    for (const key in wrk.handles) {
      const h = wrk.handles[key]
      delete wrk.handles[key]
      wrk.handles[h.id] = h
    }
  }

  for (const key in agent.workers) {
    const ew = agent.workers[key]
    delete agent.workers[key]
    agent.workers[ew.config.id] = ew
  }

  return agent

}



export const agents = createSupabaseModel(model, supabase.from("agents"), "agents").withFunctions({
  saveAgent,
  loadAgent,
})






