import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import CustomTable from "@/components/ui/custom-table"
import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { ChevronUp, ChevronDown } from "lucide-react"
import { useState } from "react"
import { useNavigate } from "react-router-dom"

interface Team {
  id: string
  name: string
  description: string
  members: TeamMember[]
  createdAt: string
}

interface TeamMember {
  id: string
  name: string
  email: string
  role: "owner" | "admin" | "member"
  joined: string
  lastLogin: string
}

export function TeamSettings() {
  const [expandedTeams, setExpandedTeams] = useState<string[]>([])
  const navigate = useNavigate();

  const handleEdit = (id: string) => {
    const member = teams.find(team => team.members.find(member => member.id === id))?.members.find(member => member.id === id)
    if (!member) return;
    navigate(`users/${member.id}`);
  }

  const toggleTeam = (teamId: string) => {
    setExpandedTeams((prevExpanded) =>
      prevExpanded.includes(teamId)
        ? prevExpanded.filter((id) => id !== teamId)
        : [...prevExpanded, teamId]
    )
  }

  const isTeamExpanded = (teamId: string) => expandedTeams.includes(teamId)
  const teams: Team[] = [
    {
      id: "1",
      name: "Emergency Response Team",
      description: "Coordinating rapid response to humanitarian crises",
      createdAt: "2024-01-01",
      members: [
        {
          id: "1",
          name: "John Doe",
          email: "john@example.com",
          role: "owner",
          joined: "2024-01-01",
          lastLogin: "2025-01-21"
        },
        {
          id: "2",
          name: "Jane Smith",
          email: "jane@example.com",
          role: "admin",
          joined: "2024-01-15",
          lastLogin: "2025-02-01"
        }
      ]
    },
    {
      id: "2",
      name: "Refugee Support Team",
      description: "Supporting displaced populations and asylum seekers",
      createdAt: "2024-02-01",
      members: [
        {
          id: "3",
          name: "Alice Johnson",
          email: "alice@example.com",
          role: "admin",
          joined: "2024-02-01",
          lastLogin: "2024-02-10"
        }
      ]
    },
    {
      id: "3",
      name: "Medical Aid Team",
      description: "Coordinating medical assistance and healthcare support",
      createdAt: "2024-02-15",
      members: [
        {
          id: "4",
          name: "David Wilson",
          email: "david@example.com",
          role: "admin",
          joined: "2024-02-15",
          lastLogin: "2025-02-20"
        }
      ]
    }
  ]

  const columns: ColumnDef<any>[] = [
    {
      id: "member", accessorKey: "member", header: "Member", enableResizing: true, enableHiding: true, enableSorting: false, cell: ({ row }) => (
        <>
          <Avatar className="h-8 w-8">
            <AvatarImage src={`https://avatar.vercel.sh/${row.original.email}`} />
            <AvatarFallback>{row.original.name[0]}</AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{row.original.name}</div>
            <div className="text-sm text-muted-foreground">{row.original.email}</div>
          </div>
        </>
      )
    },
    { id: "role", enableResizing: true, enableHiding: true, accessorKey: "role", header: "Role", enableSorting: false, cell: (info) => info.getValue() },
    { id: "joined", enableResizing: true, enableHiding: true, accessorKey: "joined", header: "Joined", enableSorting: false, cell: (info) => format(new Date(info.getValue() as string), "MMM dd, yyyy") },
    { id: "lastLogin", enableResizing: true, enableHiding: true, accessorKey: "lastLogin", header: "Last Login", enableSorting: false, cell: (info) => format(new Date(info.getValue() as string), "MMM dd, yyyy") },
  ]

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Teams</h3>
          <p className="text-sm text-muted-foreground">
            Manage your organization's teams and their members
          </p>
        </div>
        <Button>Create Team</Button>
      </div>

      {teams.map((team) => (
        <div key={team.id} className="space-y-4">
          <div className="flex justify-between items-center cursor-pointer" onClick={() => toggleTeam(team.id)}>
            <div className="flex items-center">
              {isTeamExpanded(team.id) ? (
                <ChevronUp className="h-4 w-4 mr-2" />
              ) : (
                <ChevronDown className="h-4 w-4 mr-2" />
              )}
              <div>
                <h4 className="text-md font-medium">{team.name}</h4>
                <p className="text-sm text-muted-foreground">{team.description}</p>
              </div>
            </div>
            <Button variant="outline">Add Member</Button>
          </div>

          {isTeamExpanded(team.id) && (
            <CustomTable tableId="team-members-table" columns={columns as any} data={team.members} placeholder="No members found" onEdit={handleEdit} />
          )}
        </div>
      ))}
    </div>
  )
} 