import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { usePermissions } from "@/lib/hooks/usePermissions"
import CustomTable from "@/components/ui/custom-table"
import { ColumnDef } from "@tanstack/react-table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Checkbox } from "@/components/ui/checkbox"
import { useSupabase } from "@/hooks/use-supabase"

export function AddTeamMembers() {
    const navigate = useNavigate()
    const { id } = useParams()
    const { canCreate } = usePermissions()
    const [isLoading, setIsLoading] = useState(false)
    const [users, setUsers] = useState([])
    const [selectedUsers, setSelectedUsers] = useState<string[]>([])

    const fetchAvailableUsers = async () => {
        setIsLoading(true)
        try {
            const { data, error } = await useSupabase().from("users").select(`
                *,
                roles(name)
              `)
              .order('first_name', { ascending: true })
            if (error) {
                console.error('Error fetching users:', error)
                return
            }

            const transformedData = data?.map(user => ({
                ...user,
                role_name: user.roles?.name,
              })) || []

            const usersWithTeams = await Promise.all(
                transformedData.map(async (user) => {
                    const { data: teamsData } = await useSupabase().from("teams").select(`
                        *,
                        user_teams!inner(user_id)
                    `).eq('user_teams.user_id', user.id)
                    return {
                        ...user,
                        teams: teamsData || []
                    }
                })
            )

            const availableUsers = usersWithTeams.filter(user => !user.teams?.some(team => team.id === id))
            setUsers(availableUsers)
        } catch (error) {
            console.error('Error loading users:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleAddMembers = async () => {
        if (selectedUsers.length === 0) return

        setIsLoading(true)
        try {
            const addPromises = selectedUsers.map(userId => useSupabase().from("user_teams").insert({ user_id: userId, team_id: id }))
            await Promise.all(addPromises)
            navigate(`/settings/teams`)
        } catch (error) {
            console.error('Error adding team members:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleToggleSelect = (userId: string) => {
        setSelectedUsers(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        )
    }

    const handleSelectAll = () => {
        setSelectedUsers(prev => prev.length === users.length ? [] : users.map(user => user.id))
    }

    const columns: ColumnDef<any>[] = [
        {
            id: "select",
            header: ({ table }) => (
                <Checkbox
                    checked={selectedUsers.length === users.length}
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

    useEffect(() => {
        fetchAvailableUsers()
    }, [id])

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
                ) : (
                    <CustomTable
                        columns={columns}
                        data={users}
                        tableId="add-team-members-table"
                    />
                )}
            </div>
        </div>
    )
} 