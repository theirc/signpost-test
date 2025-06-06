import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import CustomTable from "@/components/ui/custom-table"
import { supabase } from "@/lib/agents/db"
import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { ChevronDown, Loader2, UserPlus } from "lucide-react"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"

interface TeamWithUsers extends Team {
  users: User[]
}

export interface Team {
  id: string
  name: string
  description?: string
  status?: string
  created_at?: string
  users?: User[]
}

export interface User {
  id: string
  email: string
  first_name?: string
  last_name?: string
  password?: string
  location?: string
  title?: string
  description?: string
  language?: {
    code: string
    name: string
  }
  role?: string
  role_name?: string
  status?: string
  team?: string
  team_name?: string
  created_at?: string
  teams?: Team[]
}

export function TeamSettings() {
  const [expandedTeams, setExpandedTeams] = useState<string[]>([])
  const [teams, setTeams] = useState<TeamWithUsers[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()

  const fetchTeam = async () => {
    setIsLoading(true)
    const { data: teamsData, error: teamsError } = await supabase.from("teams").select("*")
    if (teamsError) {
      console.error('Error fetching teams:', teamsError)
      return
    }

    const teamsWithUsers = await Promise.all(
      teamsData.map(async (team) => {
        const { data } = await supabase.from("users").select(`
          *,
          user_teams!inner(team_id),
          roles:role (*)
        `).eq("user_teams.team_id", team.id)

        const transformedData = data?.map(user => ({
          ...user,
          role_name: user.roles?.name
        })) || []

        return {
          ...team,
          users: transformedData || []
        }
      })
    )

    setTeams(teamsWithUsers as unknown as TeamWithUsers[])
    setIsLoading(false)
  }

  const isTeamExpanded = (teamId: string) => expandedTeams.includes(teamId)

  const toggleTeam = (teamId: string) => {
    setExpandedTeams(prev =>
      prev.includes(teamId)
        ? prev.filter(id => id !== teamId)
        : [...prev, teamId]
    )
  }

  const handleEdit = (id: string) => {
    navigate(`/settings/users/${id}`)
  }

  const columns: ColumnDef<{ id: any }>[] = [
    {
      id: "member",
      accessorKey: "name",
      accessorFn: (row) => (row as User).first_name,
      header: "Member",
      enableResizing: true,
      enableHiding: true,
      enableSorting: false,
      cell: ({ row }) => {
        const user = row.original as User;
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
        );
      }
    },
    {
      id: "role",
      enableResizing: true,
      enableHiding: true,
      accessorKey: "role",
      accessorFn: (row) => (row as User).role_name,
      header: "Role",
      enableSorting: false,
      cell: (info) => info.getValue()
    },
    {
      id: "joined",
      enableResizing: true,
      enableHiding: true,
      accessorKey: "created_at",
      accessorFn: (row) => (row as User).created_at,
      header: "Joined",
      enableSorting: false,
      cell: (info) => format(new Date(info.getValue() as string), "MMM dd, yyyy")
    },
    {
      id: "status",
      enableResizing: true,
      enableHiding: true,
      accessorKey: "status",
      accessorFn: (row) => (row as User).status,
      header: "Status",
      enableSorting: false,
      cell: ({ row }) => {
        const user = row.original as User;
        return (
          <span className={`capitalize ${user.status === 'active' ? 'text-green-600' : 'text-gray-500'}`}>
            {user.status}
          </span>
        );
      }
    },
  ]

  useEffect(() => {
    fetchTeam()
  }, [])

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Teams</h3>
          <p className="text-sm text-muted-foreground">
            Manage your organization's teams and their members
          </p>
        </div>
        <Button onClick={() => navigate("/settings/teams/new")}>Create Team</Button>
      </div>
      {isLoading ? (
        <div className="flex items-center justify-center h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-4">
          {teams.map((team) => (
            <div key={team.id} className="space-y-4">
              <div className="flex items-center justify-between p-4 cursor-pointer">
                <div className="flex items-center" onClick={() => toggleTeam(team.id)}>
                  <Button variant="ghost" size="icon">
                    <ChevronDown
                      className={`h-4 w-4 transform transition-transform ${isTeamExpanded(team.id) ? "rotate-180" : ""
                        }`}
                    />
                  </Button>
                  <div>
                    <div className="font-medium">{team.name}</div>
                    <div className="text-sm text-muted-foreground">{team.description}</div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/settings/teams/members/${team.id}`)}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Team Member
                </Button>
              </div>
              {isTeamExpanded(team.id) && (
                <CustomTable
                  data={team.users || []}
                  columns={columns}
                  tableId={`team-${team.id}-users`}
                  pageSize={5}
                  onRowClick={(row) => handleEdit(row.id)}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
} 