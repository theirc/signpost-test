import { buildWorker } from "./worker"
import { ulid } from 'ulid'

declare global {
  type LiteralUnion<KnownValues extends string> = (string & {}) | KnownValues
  type Agent = ReturnType<typeof buildAgent>
  type EdgeConnections = { [index: string]: { source: string, target: string, sourceHandle: string, targetHandle: string } }

  interface APIKeys {
    openai?: string
    anthropic?: string
    google?: string
    deepseek?: string
    groq?: string
    xai?: string
  }

  interface AgentParameters {
    debug?: boolean
    input: any
    output?: any
    agent?: Agent
    error?: string
    apikeys?: APIKeys
  }
}


export function buildAgent(config: AgentConfig) {

  const workers: { [index: string]: AIWorker } = {}
  const edges: EdgeConnections = (config.edges as EdgeConnections) || {}

  const agent = {

    get id() { return config.id },
    set id(v: number) { config.id = v },
    get title() { return config.title },
    set title(v: string) { config.title = v },
    edges,
    workers,

    currentWorker: null as AIWorker,
    update() {
      //Used to update the UI in front end
    },
    updateWorkers() {
      console.log("Updating All workers")
      for (const key in workers) {
        const w = workers[key]
        w.updateWorker()
      }
    },

    getResponseWorker() {
      for (const key in workers) {
        if (workers[key].config.type === "response") return workers[key]
      }
      return null
    },

    hasInput() {
      for (const key in workers) {
        if (workers[key].config.type === "request") return true
      }
      return false
    },

    hasResponse() {
      return agent.getResponseWorker() !== null
    },

    reset() {
      for (const key in workers) {
        const w = workers[key]
        w.executed = false
        for (const key in w.handles) {
          const h = w.handles[key]
          if (h.persistent) continue
          h.value = undefined
        }
      }
    },

    async execute(p: AgentParameters) {
      agent.reset()
      p.input ||= {}
      p.output ||= {}
      p.input ||= {}
      p.output ||= {}
      p.apikeys ||= {}
      p.agent = agent
      console.log("Executing agent...")
      try {
        const worker = agent.getResponseWorker()
        if (!worker) return
        await worker.execute(p)
      } catch (error) {
        console.error(error)
        p.error = error.toString()
      }
      agent.currentWorker = null
      agent.update()
    },

    initializeWorker(config: WorkerConfig, handlers: NodeIO[], registry: WorkerRegistryItem, parameters: object = {}) {
      const worker = agent.addWorker(config)
      worker.registry = registry
      for (const h of handlers) {
        h.system = true
      }
      worker.addHandlers(handlers)
      return worker
    },

    addWorker(w: WorkerConfig): AIWorker {
      w.id ||= `NODE_${ulid()}`
      w.handles ||= {}
      const worker = buildWorker(w)
      workers[w.id] = worker
      return worker
    },

    deleteWorker(id: string) {
      delete workers[id]
    },
  }

  return agent

}




