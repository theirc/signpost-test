import { buildWorker } from "./worker"
import { ulid } from 'ulid'

declare global {
  type LiteralUnion<KnownValues extends string> = (string & {}) | KnownValues
  type Agent = ReturnType<typeof buildAgent>
  type EdgeConnections = { [index: string]: { source: string, target: string, sourceHandle: string, targetHandle: string } }
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

    hasInput() {
      for (const key in workers) {
        if (workers[key].config.type === "request") return true
      }
      return false
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




