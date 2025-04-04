import { ulid } from "ulid"
import { app } from "../app"

export const inputOutputTypes = {
  string: "Text",
  number: "Number",
  boolean: "Boolean",
  unknown: "Unknown",
  doc: "Documents",
  references: "References",
  // chat: "Chat",
  // audio: "Audio",
  // image: "Image",
  // video: "Video",
  execute: "Execute",
}


declare global {

  type AIWorker = ReturnType<typeof buildWorker>

  type WorkerHandles = { [index: string]: NodeIO }
  type IOTypes = keyof typeof inputOutputTypes

  interface NodeIO {
    id?: string
    title?: string
    name: string
    prompt?: string
    direction: "output" | "input"
    type: IOTypes
    system?: boolean
    persistent?: boolean
    value?: any
  }
}


export function buildWorker(w: WorkerConfig) {

  w.handles = w.handles || {}
  const fields: { [index: string]: NodeIO } = {}

  const worker = {
    config: w,
    lastUpdate: 0,
    registry: null as WorkerRegistryItem,
    executed: false,

    get id() {
      return w.id
    },

    get handles() {
      return w.handles
    },

    parameters: w.parameters as any || {},
    values: {},
    fields,

    async execute(p: AgentParameters) {
      if (worker.executed) return
      worker.executed = true


      await worker.getValues(p)

      console.log("Worker - Executing: ", w.type)

      p.agent.currentWorker = worker
      worker.updateWorker()
      p.agent.update()

      await worker.registry.execute(worker, p)
      p.agent.update()

      worker.updateWorker()
      p.agent.currentWorker = null
      p.agent.update()
    },

    // async execute(p: AgentParameters) {
    //   console.log("Worker - Setting currentWorker to: ", w.type)
    //   p.agent.currentWorker = worker
    //   worker.updateWorker()
    //   p.agent.update()
    //   if (!worker.executed) {
    //     console.log("Worker - Executing: ", w.type)
    //     await worker.getValues(p)
    //     await worker.registry.execute(worker, p)
    //     worker.executed = true
    //     p.agent.update()
    //   } else {
    //     console.log(`Worker '${w.type}' already executed`)
    //   }
    //   worker.updateWorker()
    //   console.log("Worker - Setting currentWorker to: ", null)
    //   p.agent.currentWorker = null
    //   p.agent.update()
    // },

    async getValues(p: AgentParameters) {
      const connw = worker.getConnectedWokers()
      for (const { worker, source, target } of connw) {
        await worker.execute(p)
        target.value = source.value
      }
    },

    getConnectedHandlers(h?: NodeIO) {
      const { agent, agent: { workers } } = app

      const connected: AIWorker[] = []
      const connwh: NodeIO[] = []

      for (const e of Object.values(agent.edges)) {
        if (h && e.targetHandle !== h.id) continue
        if (e.targetHandle in w.handles) {
          const cw = workers[e.source]
          connected.push(cw)
          connwh.push(cw.handles[e.sourceHandle],)
        }
      }
      return connwh
    },

    getConnectedHandler(h?: NodeIO) {
      return worker.getConnectedHandlers(h)[0] || null
    },


    inferType(h: NodeIO): IOTypes {
      const c = worker.getConnectedHandler(h)
      return c?.type || "unknown"
    },

    getConnectedWokers() {
      const { agent, agent: { workers } } = app

      const connected: AIWorker[] = []
      const connwh: { worker: AIWorker, source: NodeIO, target: NodeIO }[] = []

      for (const e of Object.values(agent.edges)) {
        if (e.targetHandle in w.handles) {
          const cw = workers[e.source]
          connected.push(cw)
          connwh.push({
            worker: cw,
            source: cw.handles[e.sourceHandle],
            target: w.handles[e.targetHandle]
          })

        }
      }
      return connwh
    },

    updateWorker() {
      worker.lastUpdate = Date.now().valueOf()
    },

    addHandler(h: NodeIO): NodeIO {
      if (!h.id) h.id = ulid()
      w.handles[h.id] = h
      fields[h.name] = h
      worker.lastUpdate = Date.now().valueOf()
      return h
    },

    addHandlers(handlers: NodeIO[]) {
      for (const h of handlers) {
        worker.addHandler(h)
      }
    },

    updateHandler(id: string, h: Partial<NodeIO>) {
      if (w.handles[id]) {
        Object.assign(w.handles[id], h)
      }
      worker.lastUpdate = Date.now().valueOf()
    },

    deleteHandler(id: string) {
      delete w.handles[id]
      worker.lastUpdate = Date.now().valueOf()
    },

    getUserHandlers() {
      return Object.values(w.handles || {}).filter(h => !h.system)
    },


  }

  return worker
}






