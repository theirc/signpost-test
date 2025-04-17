import { Link, useNavigate } from "react-router-dom"
import { agentsModel } from "@/lib/data"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import CustomTable from "@/components/ui/custom-table"
import { ColumnDef } from "@tanstack/react-table"
import { useEffect, useState } from "react"
import { format } from "date-fns"

export function AgentList() {
  const navigate = useNavigate()
  const [agents, setAgents] = useState<any[]>([])

  useEffect(() => {
    const fetchAgents = async () => {
      const { data } = await agentsModel.data.select("*")
      setAgents(data || [])
    }
    fetchAgents()
  }, [])

  const handleRowClick = (agentId: string) => {
    navigate(`/agent/${agentId}`)
  }

  const columns: ColumnDef<any>[] = [
    { 
      id: "id", 
      accessorKey: "id", 
      header: "ID", 
      enableResizing: true, 
      enableHiding: true, 
      enableSorting: true 
    },
    { 
      id: "title", 
      accessorKey: "title", 
      header: "Title", 
      enableResizing: true, 
      enableHiding: true, 
      enableSorting: true 
    },
    { 
      id: "created_at", 
      accessorKey: "created_at", 
      header: "Created At", 
      enableResizing: true, 
      enableHiding: true, 
      enableSorting: true,
      cell: (info) => format(new Date(info.getValue() as string), "MMM dd, yyyy")
    }
  ]

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Agents</h1>
          <Link to={`/agent/new`}>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Agent
            </Button>
          </Link>
        </div>

        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Manage your agents and their configurations.
          </div>

          <div className="flex-grow">
            <CustomTable 
              tableId="agents-table"
              columns={columns}
              data={agents}
              onRowClick={(row) => handleRowClick(row.id)}
              placeholder="No agents found"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

