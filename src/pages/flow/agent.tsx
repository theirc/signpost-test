import { FlowDesigner } from "@/components/flow/flow"
import { useParams } from "react-router-dom"


export function Agent() {
  const p = useParams()
  return <FlowDesigner id={p.id} />
}