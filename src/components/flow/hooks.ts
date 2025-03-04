import { app } from "@/lib/app"
import { useMemo } from "react"


export function useWorker(id: string) {
  // const worker = useMemo(() => app.agent.workers[id], [id])
  const worker = app.agent.workers[id]
  return worker
}