import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Copy, Plus, Trash2 } from "lucide-react"
import { ColumnDef } from "@tanstack/react-table"
import { useState, } from "react"
import { format } from "date-fns"
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
import { supabase } from "@/lib/agents/db"
import { useQuery } from "@tanstack/react-query"
import { Loader2 } from "lucide-react"
import { EnhancedDataTable } from "@/components/ui/enhanced-data-table"
import { usePermissions } from "@/lib/hooks/usePermissions"
import { HighlightText } from "@/components/ui/shadcn-io/highlight-text"

export function AgentList() {
    const navigate = useNavigate()
    const { toast } = useToast()
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [agentToDelete, setAgentToDelete] = useState(null)
    const { canCreate, canDelete } = usePermissions()

    const fetchAgents = async () => {
        const { data, error } = await supabase
            .from("agents")
            .select("id, title, description, type, created_at")
            .is("team_id", null)
            .order("created_at", { ascending: false })

        if (error) {
            console.error('Error fetching agents:', error)
            return []
        }
        return data
    }

    const { data: agents, isLoading, refetch } = useQuery({
        queryKey: ["agents-template",],
        queryFn: fetchAgents,
    })

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
                <div className="flex items-center">
                  {canCreate("templates") && <span
                    title="Duplicate agent"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDuplicate(row.original, e);
                    }}
                    className="cursor-pointer hover:text-blue-600"
                  >
                    <Copy className="h-4 w-4" />
                  </span>}
                  {canDelete("templates") && <span
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
        navigate(`/agents/${agentId}`)
    }

    async function handleDuplicate(agent: any, e: React.MouseEvent) {
        e.stopPropagation()
        const newAgent = { ...agent, title: `${agent.title} (copy)` }
        delete newAgent.id
        const { data, error } = await supabase.from("agents").insert(newAgent).select()
        if (error) {
            console.error('Error duplicating agent:', error)
            toast({
                title: "Error duplicating agent",
                description: error.message,
                variant: "destructive"
            })
        } else {
            refetch()
            toast({
                title: "Agent duplicated",
                description: `A copy of '${agent.title}' was created.`
            })
        }
    }

    function handleDelete(agent: any, e: React.MouseEvent) {
        e.stopPropagation()
        setAgentToDelete(agent)
        setShowDeleteConfirm(true)
    }

    async function confirmDelete() {
        if (agentToDelete) {
            const { error } = await supabase.from("agents").delete().eq("id", agentToDelete.id)
            if (error) {
                console.error('Error deleting agent:', error)
                toast({
                    title: "Error deleting agent",
                    description: error.message,
                    variant: "destructive"
                })
            } else {
                refetch()
                toast({
                    title: "Agent deleted",
                    description: `'${agentToDelete.title}' has been deleted.`
                })
            }
            setShowDeleteConfirm(false)
            setAgentToDelete(null)
        }
    }

    return (
        <div>
            <div className="p-8 pt-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-3"><HighlightText text="Templates" className="text-4xl font-bold" /></h1>
                    <Button onClick={() => navigate("/agents/new")} className="rounded-lg">
                        <Plus className="h-4 w-4 mr-2" /> Add Agent
                    </Button>
                </div>
                <div className="mt-6">
                    {isLoading ? (
                        <div className="flex justify-center items-center">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                    ) : (
                        <EnhancedDataTable
                            columns={columns}
                            data={agents ?? []}
                            onRowClick={(row) => handleRowClick(row.id)}
                            placeholder="No agent templates found."
                        />
                    )}
                </div>
            </div>
            <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the agent
                            template and remove all associated data.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete}>Continue</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}