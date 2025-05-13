import { Link, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Plus, Copy, Trash2 } from "lucide-react"
import CustomTable from "@/components/ui/custom-table"
import { ColumnDef } from "@tanstack/react-table"
import { useEffect, useState, useCallback } from "react"
import { format } from "date-fns"
import { useTeamStore } from "@/lib/hooks/useTeam"
import { supabase } from "@/lib/data/supabaseFunctions"
import { useToast } from "@/hooks/use-toast"
import {
  AlertDialog,
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
  const { toast } = useToast()
  const [agentToDelete, setAgentToDelete] = useState<any | null>(null)

  const fetchAgents = useCallback(async () => {
    if (!selectedTeam) {
      setAgents([])
      return
    }
    try {
      const { data, error } = await supabase
        .from('agents')
        .select("*")
        .eq('team_id', selectedTeam.id)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setAgents(data || [])
    } catch (error) {
      console.error('Error fetching agents:', error)
      setAgents([])
    }
  }, [selectedTeam, toast])

  useEffect(() => {
    fetchAgents()
  }, [fetchAgents])

  const handleRowClick = (agentId: string) => {
    navigate(`/agent/${agentId}`)
  }

  const handleDuplicate = async (agent: any, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const { id, created_at, ...agentData } = agent
      const newAgentPayload = {
        ...agentData,
        title: `${agentData.title} (Copy)`,
        team_id: selectedTeam.id,
      }
      const { data: newAgent, error } = await supabase
        .from('agents')
        .insert([newAgentPayload])
        .select()
        .single()

      if (error) throw error
      
      fetchAgents()
      toast({
        title: 'Agent duplicated',
        description: (
          <span>
            {`A copy of '${agent.title}' was created.`} 
            <Link to={`/agent/${newAgent.id}`} className="underline text-blue-600 hover:text-blue-800 ml-1">
              View new agent
            </Link>
          </span>
        ),
      })
    } catch (error) {
      console.error('Error duplicating agent:', error)
      toast({
        title: "Error duplicating agent",
        description: (error as Error)?.message || "Could not duplicate the agent.",
        variant: "destructive",
      })
    }
  }

  const handleDelete = (agent: any, e: React.MouseEvent) => {
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
      toast({
        title: 'Agent deleted',
        description: `'${agentToDelete.title}' has been successfully deleted.`,
      })
    } catch (error) {
      console.error('Error deleting agent:', error)
      toast({
        title: "Error deleting agent",
        description: (error as Error)?.message || "Could not delete the agent.",
        variant: "destructive",
      })
    } finally {
      setAgentToDelete(null)
    }
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
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="icon"
            title="Duplicate agent"
            onClick={(e) => handleDuplicate(row.original, e)}
          >
            <Copy className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            title="Delete agent"
            onClick={(e) => handleDelete(row.original, e)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
    }
  ]

  return (
    <>
      <AlertDialog open={!!agentToDelete} onOpenChange={(open) => { if (!open) setAgentToDelete(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Agent?</AlertDialogTitle>
            <AlertDialogDescription>
              {`Are you sure you want to delete '${agentToDelete?.title}'? This action cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setAgentToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
    </>
  )
}