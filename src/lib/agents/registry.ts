import { ai } from "./workers/ai"
import { background } from "./workers/background"
import { condition } from "./workers/condition"
import { request } from "./workers/input"
import { response } from "./workers/response"
import { schema } from "./workers/schema"
import { select } from "./workers/select"
import { text } from "./workers/text"
import { stt } from "./workers/tts"

declare global {

  type WorkerTypes = keyof typeof workerRegistry

  interface WorkerRegistryItem {
    title: string
    icon?: any
    execute(worker: AIWorker): void
    create(agent: Agent): AIWorker
    registry?: this
  }

}

export const workerRegistry = {
  request,
  schema,
  select,
  response,
  condition,
  text,
  ai,
  stt,
  background,
} satisfies { [index: string]: WorkerRegistryItem }
