import { app } from "@/lib/app"

export function useWorker<T = AIWorker>(id: string): T {
  const worker = app.agent.workers[id]
  return worker as T
}