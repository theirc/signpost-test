import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState } from "react"

interface Project {
  id: string
  name: string
  createdAt: string
  teamId: string
  status: "active" | "archived"
}

interface Team {
  id: string
  name: string
  members: number
}

export function ProjectsSettings() {
  const [teams] = useState<Team[]>([
    { id: "1", name: "Emergency Response Team", members: 5 },
    { id: "2", name: "Refugee Support Team", members: 3 },
    { id: "3", name: "Medical Aid Team", members: 4 }
  ])

  const [projects, setProjects] = useState<Project[]>([
    {
      id: "1",
      name: "Syria Crisis Response",
      createdAt: "2024-01-01",
      teamId: "1",
      status: "active"
    },
    {
      id: "2",
      name: "Mediterranean Rescue Operations",
      createdAt: "2024-02-15",
      teamId: "2",
      status: "active"
    },
    {
      id: "3",
      name: "Gaza Medical Support",
      createdAt: "2024-03-01",
      teamId: "3",
      status: "active"
    },
    {
      id: "4",
      name: "Ukraine Aid Coordination",
      createdAt: "2024-02-01",
      teamId: "1",
      status: "active"
    }
  ])

  const getTeamName = (teamId: string) => {
    return teams.find(team => team.id === teamId)?.name || 'Unassigned'
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Projects</h3>
          <p className="text-sm text-muted-foreground">
            Manage your organization's projects and team assignments
          </p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>Create Project</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label htmlFor="name">Project Name</label>
                <Input id="name" placeholder="Enter project name" />
              </div>
              <div className="space-y-2">
                <label>Assigned Team</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a team" />
                  </SelectTrigger>
                  <SelectContent>
                    {teams.map(team => (
                      <SelectItem key={team.id} value={team.id}>
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button>Create Project</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Team</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.map((project) => (
            <TableRow key={project.id}>
              <TableCell>{project.name}</TableCell>
              <TableCell>{getTeamName(project.teamId)}</TableCell>
              <TableCell>{new Date(project.createdAt).toLocaleDateString()}</TableCell>
              <TableCell>
                <span className={`capitalize ${project.status === 'active' ? 'text-green-600' : 'text-gray-500'}`}>
                  {project.status}
                </span>
              </TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="sm">Edit</Button>
                <Button variant="ghost" size="sm" className="text-red-600">Archive</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
} 