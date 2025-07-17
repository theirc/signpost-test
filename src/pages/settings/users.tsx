import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
import { ColumnDef } from "@tanstack/react-table"
import { EnhancedDataTable } from "@/components/ui/enhanced-data-table"
import { useNavigate } from "react-router-dom"
import { format } from "date-fns"
import { usePermissions } from "@/lib/hooks/usePermissions"
import { Loader2 } from "lucide-react"
import { User } from "./teams"
import { supabase } from "@/lib/agents/db"

export function UsersSettings() {
    const navigate = useNavigate()
    const { canCreate, canUpdate } = usePermissions()
    const [users, setUsers] = useState<User[]>([])
    const [isLoading, setIsLoading] = useState(false)

    const fetchUser = async () => {
        setIsLoading(true)
        const { data, error } = await supabase.from("users").select(`
            *,
            roles(name)
          `)
          .order('first_name', { ascending: true })
        if (error) {
            console.error('Error fetching users:', error)
        }

        const transformedData = data?.map(user => ({
            ...user,
            role_name: user.roles?.name,
          })) || []

        const usersWithTeams = await Promise.all(
            transformedData.map(async (user) => {
                const { data: teamsData } = await supabase.from("user_teams").select(`
                    teams!inner(*)
                `)
                    .eq('user_id', user.id)
                return {
                    ...user,
                    teams: teamsData?.map(team => team.teams) || []
                }
            })
        )

        const formattedUsers = usersWithTeams.map(user => ({
            ...user,
            created_at: user.created_at || new Date().toISOString()
        }))
        setUsers(formattedUsers as unknown as User[] || [])
        setIsLoading(false)
    }

    const handleEdit = (id: string) => {
        navigate(`/settings/users/${id}`)
    }

    const columns: ColumnDef<any>[] = [
        { id: "first_name", accessorKey: "first_name", header: "First Name", enableResizing: true, enableHiding: true, enableSorting: true, cell: (info) => info.getValue() },
        { id: "last_name", accessorKey: "last_name", header: "Last Name", enableResizing: true, enableHiding: true, enableSorting: true, cell: (info) => info.getValue() },
        { id: "role_name", enableResizing: true, enableHiding: true, accessorKey: "role_name", header: "Role", enableSorting: true, cell: (info) => info.getValue() },
        {
            id: "teams", enableResizing: true, enableHiding: true, accessorKey: "teams", header: "Teams", enableSorting: true, cell: ({ row }) => (
                row.original.teams.map((team: any) => team.name).join(', ')
            )
        },
        { id: "created_at", enableResizing: true, enableHiding: true, accessorKey: "created_at", header: "Created", enableSorting: false, cell: (info) => format(new Date(info.getValue() as string), "MMM dd, yyyy") },
    ]

    useEffect(() => {
        fetchUser()
    }, [])

    return (
        <div>
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-medium">Users</h3>
                    <p className="text-sm text-muted-foreground">
                        Manage your organization's users
                    </p>
                </div>
                {canCreate("users") && (
                    <Button onClick={() => navigate("/settings/users/new")}>Create User</Button>
                )}
            </div>
            {isLoading ? (
                <div className="flex items-center justify-center h-[400px]">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : (
                <EnhancedDataTable
                    columns={columns as any}
                    data={users}
                    onRowClick={(row) => {
                        canUpdate("users") ? handleEdit(row.id) : undefined
                    }}
                    placeholder="No users found" />
            )}
        </div>
    )
} 