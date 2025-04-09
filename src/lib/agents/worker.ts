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

interface WorkerCondition {
  operator?: "equals"
  value?: any
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
    condition?: boolean
    persistent?: boolean
    value?: any
  }

  interface WorkerConfig {
    id?: string
    handles?: WorkerHandles
    type: WorkerTypes
    parameters?: object
    x?: number
    y?: number
    condition?: WorkerCondition
  }
}


export function buildWorker(w: WorkerConfig) {

  w.handles = w.handles || {}
  w.condition ||= {}
  const fields: { [index: string]: NodeIO } = {}

  const worker = {
    config: w,
    lastUpdate: 0,
    registry: null as WorkerRegistryItem,
    executed: false,

    get id() {
      return w.id
    },
    set id(v: string) {
      w.id = v
    },

    get handles() {
      return w.handles
    },

    get condition() {
      return w.condition
    },
    set condition(v: WorkerCondition) {
      w.condition = v
    },

    parameters: w.parameters as any || {},
    values: {},
    fields,

    async execute(p: AgentParameters) {
      if (worker.executed) return
      worker.executed = true

      await worker.getValues(p)

      console.log("Worker - Executing: ", w.type)

      const cond = Object.values(worker.handles).filter(h => h.condition)[0]
      if (cond) {
        // console.log("Worker - Condition: ", cond)
        if ((!!worker.condition.value) !== (!!cond.value)) {
          console.log(`Worker ${w.type} - Condition not met`)
          worker.updateWorker()
          p.agent.currentWorker = null
          p.agent.update()
          return
        }
      }


      p.agent.currentWorker = worker
      worker.updateWorker()
      p.agent.update()

      await worker.registry.execute(worker, p)
      p.agent.update()

      worker.updateWorker()
      p.agent.currentWorker = null
      p.agent.update()
    },

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

    getConnectedHandlerType(h?: NodeIO): IOTypes {
      let type: IOTypes = "unknown"
      const ch = worker.getConnectedHandler(h)
      if (ch) type = ch.type
      return type
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






