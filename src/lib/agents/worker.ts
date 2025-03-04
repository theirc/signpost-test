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

// type IOTypes =
//   "string" |
//   "number" |
//   "boolean" |
//   "any" |
//   "execute" |
//   "audio" |
//   "image" |
//   "video" |
//   "chat"

type IOTypes = keyof typeof inputOutputTypes

declare global {
  type AIWorker = ReturnType<typeof buildWorker>

  interface WorkerConfig {
    id?: string
    type: WorkerTypes
    handles?: { [index: string]: NodeIO }
    payload?: any
    x?: number
    y?: number
  }

  interface NodeIO {
    id?: string
    title: string
    name?: string
    value?: any
    direction: "output" | "input"
    type: IOTypes
    persistent?: boolean
    worker?: AIWorker
  }
}

function createIdentifier(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-zA-Z0-9]/g, ' ')
    .split(' ')
    .map((word) => word.toLowerCase())
    .join('_')
}

export function buildWorker(w: WorkerConfig) {

  w.handles = w.handles || {}
  w.payload = w.payload || {}

  const aiw = {
    config: w,

    get payload() {
      return w.payload
    },

    get handlers() {
      return w.handles
    },

    addHandler(h: NodeIO): NodeIO {
      if (!h.id) h.id = ulid()
      w.handles[h.id] = h
      h.worker = aiw
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






