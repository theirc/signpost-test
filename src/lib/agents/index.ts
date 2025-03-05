import { buildWorker } from "./worker"
import { ulid } from 'ulid'

declare global {

  type LiteralUnion<KnownValues extends string> = (string & {}) | KnownValues

  interface AgentConfig {
    id: string
    title: string
    workers: { [index: string]: WorkerConfig }
  }

  type Agent = ReturnType<typeof buildAgent>

}

export function buildAgent(config: AgentConfig) {

  const workers: { [index: string]: AIWorker } = {}

  for (const key in config.workers) {
    workers[key] = buildWorker(config.workers[key])
  }

  const agent = {
    config,
    hasInput() {
      for (const key in workers) {
        if (workers[key].config.type === "request") return true
      }
      return false
    },
    get workers() {
      return workers
    },


    addWorker(config: WorkerConfig): AIWorker {
      config.id = `NODE_${ulid()}`
      console.log(config)

      // config.id = `NODE_${makeReadeableId()}`
      config.handles ||= {}
      const worker = buildWorker(config)
      workers[config.id] = worker
      return worker
    },

    deleteWorker(id: string) {
      delete workers[id]
      delete config.workers[id]
    },


  }

  return agent


}



