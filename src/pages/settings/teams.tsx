import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { EnhancedDataTable } from "@/components/ui/enhanced-data-table"
import { supabase } from "@/lib/agents/db"
import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { ChevronDown, Loader2, UserPlus } from "lucide-react"
import { useState, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useQuery } from "@tanstack/react-query"
import { usePermissions } from "@/lib/hooks/usePermissions"

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
  const navigate = useNavigate()
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editTeam, setEditTeam] = useState<Team | null>(null)
  const [editName, setEditName] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [editLoading, setEditLoading] = useState(false)
  const { canCreate, canUpdate } = usePermissions()

  const { data: usersData, isLoading, error } = useQuery({
    queryKey: ['users_with_teams'],
    queryFn: async () => {
      const { data, error } = await supabase.from("users_with_teams").select("*")
      if (error) throw error
      return data || []
    },
  })

  const teamsWithUsers = useMemo(() => {
    if (!usersData) return []
    
    const teamMap = {};
    usersData.forEach(user => {
      (user.team_ids || []).forEach((teamId, idx) => {
        const teamNamesArr = (user.team_names || '').split(',');
        const teamName = teamNamesArr[idx] || teamId;
        if (!teamMap[teamId]) {
          teamMap[teamId] = { id: teamId, name: teamName, users: [] };
        }
        teamMap[teamId].users.push(user);
      });
    });
    return Object.values(teamMap) as TeamWithUsers[];
  }, [usersData])

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

  const openEditDialog = (team: Team) => {
    setEditTeam(team)
    setEditName(team.name)
    setEditDescription(team.description || "")
    setEditDialogOpen(true)
  }

  const handleEditSubmit = async () => {
    if (!editTeam) return
    setEditLoading(true)
    const { error } = await supabase.from("teams").update({ name: editName, description: editDescription }).eq("id", editTeam.id)
    setEditLoading(false)
    if (!error) {
      setEditDialogOpen(false)
    } else {
      alert("Failed to update team")
    }
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

  if (error) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="text-center">
          <p className="text-red-600">Error loading teams: {error.message}</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Teams</h3>
          <p className="text-sm text-muted-foreground">
            Manage your organization's teams and their members
          </p>
        </div>
        {canCreate("teams") && (
          <Button onClick={() => navigate("/settings/teams/new")}>Create Team</Button>
        )}
      </div>
      {isLoading ? (
        <div className="flex items-center justify-center h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-4">
          {teamsWithUsers.map((team) => (
            <div key={team.id} className="space-y-4">
              <div className="flex items-center justify-between p-4 cursor-pointer">
                <div className="flex items-center" onClick={() => toggleTeam(team.id)}>
                  <Button variant="ghost" size="icon">
                    <ChevronDown
                      className={`h-4 w-4 transform transition-transform ${isTeamExpanded(team.id) ? "rotate-180" : ""}`}
                    />
                  </Button>
                  <div>
                    <div className="font-medium">{team.name}</div>
                    <div className="text-sm text-muted-foreground">{team.description}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {canUpdate("teams") && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(team)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/settings/teams/members/${team.id}`)}
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Add Team Member
                      </Button>
                    </>
                  )}
                </div>
              </div>
              {isTeamExpanded(team.id) && (
                <EnhancedDataTable
                  data={team.users || []}
                  columns={columns}
                  onRowClick={(row) => handleEdit(row.id)}
                  pageSize={5}
                  placeholder="No team members found"
                />
              )}
            </div>
          ))}
        </div>
      )}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Team</DialogTitle>
            <DialogDescription>Edit the team name and description.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              value={editName}
              onChange={e => setEditName(e.target.value)}
              placeholder="Team name"
              disabled={editLoading}
            />
            <Textarea
              value={editDescription}
              onChange={e => setEditDescription(e.target.value)}
              placeholder="Team description"
              disabled={editLoading}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditDialogOpen(false)} disabled={editLoading}>Cancel</Button>
              <Button onClick={handleEditSubmit} disabled={editLoading}>Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 