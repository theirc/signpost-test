import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ChevronUp, ChevronDown } from "lucide-react"
import { useState } from "react"
import { Link } from "react-router-dom"

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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {team.members.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={`https://avatar.vercel.sh/${member.email}`} />
                        <AvatarFallback>{member.name[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{member.name}</div>
                        <div className="text-sm text-muted-foreground">{member.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="capitalize">{member.role}</span>
                    </TableCell>
                    <TableCell>{new Date(member.joined).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(member.lastLogin).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <Link to={`users/${member.id}`}>Edit User</Link>
                      <Button variant="ghost" size="sm" className="text-red-600">Remove</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      ))}
    </div>
  )
} 