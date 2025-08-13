import { useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { usePermissions } from "@/lib/hooks/usePermissions"
import CustomTable from "@/components/ui/custom-table"
import { ColumnDef } from "@tanstack/react-table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Checkbox } from "@/components/ui/checkbox"
import { supabase } from "@/lib/agents/db"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useToast } from "@/hooks/use-toast"
import { invalidateTeamCache } from "./teams"

export function AddTeamMembers() {
    const navigate = useNavigate()
    const { id: teamId } = useParams<{ id: string }>()
    const { canCreate } = usePermissions()
    const [selectedUsers, setSelectedUsers] = useState<string[]>([])
    const { toast } = useToast()
    const queryClient = useQueryClient()

    const fetchAvailableUsers = async () => {
        if (!teamId) return []

        const { data: allUsers, error: usersError } = await supabase
            .from("users")
            .select("*, roles(name)")
            .order('first_name', { ascending: true })

        if (usersError) {
            console.error('Error fetching users:', usersError)
            throw new Error(usersError.message)
        }

        const transformedData = allUsers?.map(user => ({
            ...user,
            role_name: user.roles?.name,
        })) || []

        const { data: teamMembers, error: teamMembersError } = await supabase
            .from("user_teams")
            .select("user_id")
            .eq("team_id", teamId)

        if (teamMembersError) {
            console.error('Error fetching team members:', teamMembersError)
            throw new Error(teamMembersError.message)
        }

        const memberIds = new Set(teamMembers.map(m => m.user_id))
        return transformedData.filter(user => !memberIds.has(user.id))
    }

    const { data: users, isLoading, isError, refetch } = useQuery({
        queryKey: ["availableUsers", teamId],
        queryFn: fetchAvailableUsers,
        enabled: !!teamId,
    })

    const handleAddMembers = async () => {
        if (selectedUsers.length === 0 || !teamId) return

        const { error } = await supabase
            .from("user_teams")
            .insert(selectedUsers.map(userId => ({ user_id: userId, team_id: teamId })))

        if (error) {
            console.error('Error adding team members:', error)
            toast({
                title: "Error",
                description: "Failed to add members.",
                variant: "destructive",
            })
        } else {
            invalidateTeamCache(queryClient)
            toast({
                title: "Success",
                description: "Members added successfully.",
            })
            setSelectedUsers([])
            refetch()
        }
        navigate(`/settings/teams`)
    }

    const handleToggleSelect = (userId: string) => {
        setSelectedUsers(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        )
    }

    const handleSelectAll = () => {
        if (users && users.length > 0) {
            if (selectedUsers.length === users.length) {
                setSelectedUsers([])
            } else {
                setSelectedUsers(users.map(user => user.id))
            }
        }
    }

    const columns: ColumnDef<any>[] = [
        {
            id: "select",
            header: () => (
                <Checkbox
                    checked={
                        users && users.length > 0 && selectedUsers.length === users.length
                            ? true
                            : selectedUsers.length > 0
                                ? 'indeterminate'
                                : false
                    }
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all"
                />
            ),
            cell: ({ row }) => (
                <Checkbox
                    checked={selectedUsers.includes(row.original.id)}
                    onCheckedChange={() => handleToggleSelect(row.original.id)}
                    aria-label="Select row"
                />
            ),
        },
        {
            id: "user",
            accessorKey: "first_name",
            header: "User",
            cell: ({ row }) => {
                const user = row.original
                return (
                    <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={`https://avatar.vercel.sh/${user.email}`} />
                            <AvatarFallback>{user.first_name?.[0] || 'U'}</AvatarFallback>
                        </Avatar>
                        <div>
                            <div className="font-medium">{`${user.first_name} ${user.last_name}` || 'Unnamed User'}</div>
                            <div className="text-sm text-muted-foreground">{user.email}</div>
                        </div>
                    </div>
                )
            }
        },
        {
            id: "role",
            accessorKey: "role_name",
            header: "Role",
            cell: (info) => info.getValue()
        },
        {
            id: "status",
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => {
                const user = row.original
                return (
                    <span className={`capitalize ${user.status === 'active' ? 'text-green-600' : 'text-gray-500'}`}>
                        {user.status}
                    </span>
                )
            }
        }
    ]

    return (
        <div className="container mx-auto py-8">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold">Add Team Members</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Select users to add to this team
                        </p>
                    </div>
                    <div className="flex gap-4">
                        <Button
                            variant="outline"
                            onClick={() => navigate(`/settings/teams`)}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleAddMembers}
                            disabled={isLoading || selectedUsers.length === 0}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Adding...
                                </>
                            ) : (
                                `Add ${selectedUsers.length} Member${selectedUsers.length !== 1 ? 's' : ''}`
                            )}
                        </Button>
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center h-[400px]">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : isError ? (
                    <div className="text-red-500 text-center p-4">Failed to load users.</div>
                ) : (
                    <CustomTable
                        columns={columns}
                        data={users ?? []}
                        tableId="add-team-members-table"
                    />
                )}
            </div>
        </div>
    )
} 