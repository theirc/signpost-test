import { app } from "@/lib/app"
import { createContext, useContext } from "react"

interface WorkerContextType {
  worker: AIWorker
  onEdit?: (handle: NodeIO) => void
}

export const WorkerContext = createContext({ worker: null } as WorkerContextType)

export function useWorker<T = AIWorker>(id: string): T {
  const worker = app.agent.workers[id]
  return worker as T
}

export function useWorkerContext(): WorkerContextType {
  return useContext<WorkerContextType>(WorkerContext as any) || {} as WorkerContextType
}