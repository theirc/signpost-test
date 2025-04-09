import { app } from "@/lib/app"
import { createContext, useContext } from "react"

interface WorkerContextType<T = AIWorker> {
  worker: T
  onEdit?: (handle: NodeIO) => void
}

export const WorkerContext = createContext({ worker: null } as WorkerContextType)

export function useWorker<T = AIWorker>(id: string): T {
  const worker = app.agent.workers[id]
  return worker as T
}

export function useWorkerContext<T = AIWorker>(): WorkerContextType<T> {
  return useContext<WorkerContextType>(WorkerContext as any) || {} as any
}