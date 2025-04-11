import { Datagrid } from "@/components/forms"
import { Link } from "react-router-dom"
import { agentsModel } from "@/lib/data"
import { Button } from "@/components/ui/button"

export function AgentList() {

  return <div className="flex flex-col h-full"  >
    <div className="flex mb-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight ml-2">Agents</h1>
      </div>
      <div className="flex-grow"></div>
      <Link to={`/agent/new`}>
        <Button size="sm">New Agent</Button>
      </Link>
    </div>
    <div className="flex-grow">
      <Datagrid model={agentsModel} editPath="agent" />
    </div>
  </div>


}

