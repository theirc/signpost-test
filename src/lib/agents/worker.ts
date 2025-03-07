import { ulid } from "ulid"

export const inputOutputTypes = {
  string: "String",
  number: "Number",
  boolean: "Boolean",
  any: "Any",
  chat: "Chat",
  audio: "Audio",
  image: "Image",
  video: "Video",
  execute: "Execute",
}

type IOTypes = keyof typeof inputOutputTypes

declare global {
  type AIWorker = ReturnType<typeof buildWorker>

  // interface WorkerConfig {
  //   id?: string
  //   type: WorkerTypes
  //   handles?: WorkerHandles
  //   x?: number
  //   y?: number
  // }

  type WorkerHandles = { [index: string]: NodeIO }

  interface NodeIO {
    id?: string
    title: string
    name: string
    value?: any
    direction: "output" | "input"
    type: IOTypes
    persistent?: boolean
    worker?: AIWorker
  }
}


export function buildWorker(w: WorkerConfig) {

  w.handles = w.handles || {}
  const fields = {}

  const aiw = {
    config: w,
    lastUpdate: 0,

    get handles() {
      return w.handles
    },

    fields,

    addHandler(h: NodeIO): NodeIO {
      if (!h.id) h.id = ulid()
      w.handles[h.id] = h
      fields[h.name] = h
      h.worker = aiw
      aiw.lastUpdate = Date.now().valueOf()
      return h
    },

    addHandlers(handlers: NodeIO[]) {
      for (const h of handlers) {
        aiw.addHandler(h)
      }
    },
  }

  return aiw
}






