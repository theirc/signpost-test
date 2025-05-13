import { Link, useNavigate } from "react-router-dom"
import { agentsModel } from "@/lib/data"
import { Button } from "@/components/ui/button"
import { Plus, Copy, Trash2 } from "lucide-react"
import CustomTable from "@/components/ui/custom-table"
import { ColumnDef, SortingState } from "@tanstack/react-table"
import { useEffect, useState } from "react"
import { format } from "date-fns"
import { useTeamStore } from "@/lib/hooks/useTeam"
import { supabase } from "@/lib/data/supabaseFunctions"
import { useToast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction
} from "@/components/ui/alert-dialog"

export function AgentList() {
  const navigate = useNavigate()
  const [agents, setAgents] = useState<any[]>([])
  const { selectedTeam } = useTeamStore()
  const [sorting, setSorting] = useState<SortingState>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null)
  const { toast } = useToast()
  const [agentToDelete, setAgentToDelete] = useState<any | null>(null)

  useEffect(() => {
    if (selectedTeam) {
      fetchAgents()
    }
  }, [selectedTeam, sorting])

  const fetchAgents = async () => {
    try {
      let query = supabase
        .from('agents')
        .select('*')
        .eq('team_id', selectedTeam?.id)

      // Apply sorting
      if (sorting.length > 0) {
        const { id, desc } = sorting[0]
        query = query.order(id, { ascending: !desc })
      } else {
        // Default sorting by created_at desc
        query = query.order('created_at', { ascending: false })
      }

      const { data, error } = await query

      if (error) throw error
      setAgents(data || [])
    } catch (error) {
      console.error('Error fetching agents:', error)
    }
  }

  const handleRowClick = (agent: any) => {
    setSelectedAgentId(agent.id)
    navigate(`/agent/${agent.id}`)
  }

  const handleDuplicate = async (agent: any, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const { id, created_at, ...agentData } = agent
      const newAgent = {
        ...agentData,
        title: `${agentData.title} (Copy)`,
        team_id: selectedTeam?.id
      }
      const { data, error } = await supabase
        .from('agents')
        .insert([newAgent])
        .select()
        .single()
      if (error) throw error
      fetchAgents()
      toast({
        title: 'Agent cloned',
        description: (
          <span>
            A copy of the agent was created. <a href={`/agent/${data.id}`} style={{ color: '#2563eb', textDecoration: 'underline' }}>View new agent</a>
          </span>
        )
      })
    } catch (error) {
      console.error('Error duplicating agent:', error)
    }
  }

  const handleDelete = async (agent: any, e: React.MouseEvent) => {
    e.stopPropagation()
    setAgentToDelete(agent)
  }

  const confirmDelete = async () => {
    if (!agentToDelete) return
    try {
      const { error } = await supabase
        .from('agents')
        .delete()
        .eq('id', agentToDelete.id)
      if (error) throw error
      fetchAgents()
    } catch (error) {
      console.error('Error deleting agent:', error)
    } finally {
      setAgentToDelete(null)
    }
  }

  const handleSortingChange = (newSorting: SortingState) => {
    setSorting(newSorting)
    setCurrentPage(1) // Reset to first page when sorting changes
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
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => handleDuplicate(row.original, e)}
          >
            <Copy className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => handleDelete(row.original, e)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ]

  return (
    <>
      <AlertDialog open={!!agentToDelete} onOpenChange={open => { if (!open) setAgentToDelete(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Agent?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this agent? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <div className="flex flex-col h-full">
        <div className="flex-1 space-y-4 p-8 pt-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight">Agents</h1>
            <Link to={`/flow/agents/new`}>
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
                onRowClick={handleRowClick}
                placeholder="No agents found"
                sorting={sorting}
                onSortingChange={handleSortingChange}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
                selectedRows={selectedAgentId ? [selectedAgentId] : []}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

