import { memo, useRef } from "react"

const InternalMemoizedWorker = memo((props: { worker: AIWorker, lastUpdate: number, children: React.ReactNode }) => <>{props.children}</>, (p, n) => p.lastUpdate === n.lastUpdate)

export function MemoizedWorker({ worker, children }: { worker: AIWorker, children: React.ReactNode }) {
  const lastUpdate = useRef(worker.lastUpdate)
  if (lastUpdate.current !== worker.lastUpdate) lastUpdate.current = worker.lastUpdate
  return <InternalMemoizedWorker worker={worker} lastUpdate={lastUpdate.current}>{children}</InternalMemoizedWorker>
}
