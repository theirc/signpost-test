import { ai } from "./workers/ai"
import { combine } from "./workers/combine"
import { display } from "./workers/display"
import { request } from "./workers/input"
import { mock } from "./workers/mock"
import { response } from "./workers/response"
import { schema } from "./workers/schema"
import { search } from "./workers/search"
import { text } from "./workers/text"
// import { stt } from "./workers/tts"
// import { background } from "./workers/background"
// import { condition } from "./workers/condition"

declare global {

  type WorkerTypes = keyof typeof workerRegistry

  interface WorkerRegistryItem {
    title: string
    icon?: any
    execute(worker: AIWorker, p: AgentParameters): Promise<void>
    create(agent: Agent): AIWorker
    registry?: this
  }

}

export const workerRegistry = {
  request,
  schema,
  response,
  // condition,
  text,
  ai,
  // stt,
  // background,
  combine,
  display,
  mock,
  search,
} satisfies { [index: string]: WorkerRegistryItem }
