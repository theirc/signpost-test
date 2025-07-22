import { Link, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Plus, Copy, Trash2, ArrowUpDown, ChevronDown } from "lucide-react"
import PaginatedSupabaseTableWrapper from "@/components/ui/PaginatedSupabaseTableWrapper"
import { EnhancedDataTable } from "@/components/ui/enhanced-data-table"
import { ColumnDef } from "@tanstack/react-table"
import { useState } from "react"
import { format } from "date-fns"
import { useTeamStore } from "@/lib/hooks/useTeam"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { supabase } from "@/lib/agents/db"
import { useQueryClient } from "@tanstack/react-query"
import { usePermissions } from "@/lib/hooks/usePermissions"

export function AgentList() {
  const navigate = useNavigate()
  const { selectedTeam } = useTeamStore()
  const { toast } = useToast()
  const [agentToDelete, setAgentToDelete] = useState<any | null>(null)
  const [templatePopoverOpen, setTemplatePopoverOpen] = useState(false)
  const queryClient = useQueryClient()
  const { canCreate, canDelete } = usePermissions()

  const columns: ColumnDef<any>[] = [
    { 
      id: "id", 
      accessorKey: "id", 
      header: ({ column, table }) => (
        <Button
          variant="ghost"
          onClick={() => {
            const current = column.getIsSorted();
            let next: 'asc' | 'desc';
            if (current === 'asc') next = 'desc';
            else next = 'asc';
            const meta = table.options.meta as any;
            if (meta?.onSort) meta.onSort('id', next);
          }}
          className="h-auto p-0 font-semibold"
        >
          ID
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      enableResizing: true, 
      enableHiding: true, 
      enableSorting: true 
    },
    { 
      id: "title", 
      accessorKey: "title", 
      header: ({ column, table }) => (
        <Button
          variant="ghost"
          onClick={() => {
            const current = column.getIsSorted();
            let next: 'asc' | 'desc';
            if (current === 'asc') next = 'desc';
            else next = 'asc';
            const meta = table.options.meta as any;
            if (meta?.onSort) meta.onSort('title', next);
          }}
          className="h-auto p-0 font-semibold"
        >
          Title
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      enableResizing: true, 
      enableHiding: true, 
      enableSorting: true 
    },
    { 
      id: "created_at", 
      accessorKey: "created_at", 
      header: ({ column, table }) => (
        <Button
          variant="ghost"
          onClick={() => {
            const current = column.getIsSorted();
            let next: 'asc' | 'desc';
            if (current === 'asc') next = 'desc';
            else next = 'asc';
            const meta = table.options.meta as any;
            if (meta?.onSort) meta.onSort('created_at', next);
          }}
          className="h-auto p-0 font-semibold"
        >
          Created At
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      enableResizing: true, 
      enableHiding: true, 
      enableSorting: true,
      cell: (info) => format(new Date(info.getValue() as string), "MMM dd, yyyy")
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex items-center">
          {canCreate("agents") && <span
            title="Duplicate agent"
            onClick={(e) => {
              e.stopPropagation();
              handleDuplicate(row.original, e);
            }}
            className="cursor-pointer hover:text-blue-600"
          >
            <Copy className="h-4 w-4" />
          </span>}
          {canDelete("agents") && <span
            title="Delete agent"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(row.original, e);
            }}
            className="cursor-pointer hover:text-red-600 ml-6"
          >
            <Trash2 className="h-4 w-4" />
          </span>}
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
      size: 60,
      minSize: 40,
      maxSize: 80,
    }
  ]

  function handleRowClick(agentId: string) {
    navigate(`/agent/${agentId}`)
  }

  async function handleDuplicate(agent: any, e: React.MouseEvent) {
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
      queryClient.invalidateQueries({ queryKey: ['supabase-table', 'agents'] })
    } catch (error) {
      console.error('Error duplicating agent:', error)
      toast({
        title: "Error duplicating agent",
        description: (error as Error)?.message || "Could not duplicate the agent.",
        variant: "destructive",
      })
    }
  }

  function handleDelete(agent: any, e: React.MouseEvent) {
    e.stopPropagation()
    setAgentToDelete(agent)
  }

  async function confirmDelete() {
    if (!agentToDelete) return
    try {
      const { error } = await supabase
        .from('agents')
        .delete()
        .eq('id', agentToDelete.id)
      if (error) throw error
      toast({
        title: 'Agent deleted',
        description: `'${agentToDelete.title}' has been successfully deleted.`,
      })
      queryClient.invalidateQueries({ queryKey: ['supabase-table', 'agents'] })
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
        <div className="flex-1 p-8 pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Agents</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Manage your agents and their configurations.
              </p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Agent
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => navigate('/agent/new')}>
                  New Agent
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTemplatePopoverOpen(true)}>
                  From Template
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Dialog open={templatePopoverOpen} onOpenChange={setTemplatePopoverOpen}>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>From Template</DialogTitle>
                  <DialogDescription>
                    Select a template to create a new agent from.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <p className="text-sm text-muted-foreground">
                    Templates will be available soon.
                  </p>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <PaginatedSupabaseTableWrapper
            table="agents"
            columns={columns}
            tableComponent={EnhancedDataTable}
            filters={{ team_id: selectedTeam?.id }}
            searchKey="title"
            onRowClick={(row) => handleRowClick(row.id)}
            placeholder="No agents found"
            searchPlaceholder="Search agents..."
          />
        </div>
      </div>
    </>
  )
}