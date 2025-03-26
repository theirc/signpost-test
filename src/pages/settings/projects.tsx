import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState } from "react"
import { ColumnDef } from "@tanstack/react-table"
import CustomTable from "@/components/ui/custom-table"

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

  const projectData = projects.map(project => ({
    id: project.id,
    name: project.name,
    team: getTeamName(project.teamId),
    createdAt: new Date(project.createdAt).toLocaleDateString(),
    status: project.status
  }))

  const columns: ColumnDef<any>[] = [
    { id: "name", accessorKey: "name", header: "Name", enableResizing: true, enableHiding: true, enableSorting: true, cell: (info) => info.getValue() },
    { id: "team", enableResizing: true, enableHiding: true, accessorKey: "team", header: "Team", enableSorting: false, cell: (info) => info.getValue() },
    { id: "createdAt", enableResizing: true, enableHiding: true, accessorKey: "createdAt", header: "Created", enableSorting: false, cell: (info) => info.getValue() },
    {
      id: "status", enableResizing: true, enableHiding: true, accessorKey: "status", header: "Status", enableSorting: true, cell: ({ row }) => (
        <span className={`capitalize ${row.original.status === 'active' ? 'text-green-600' : 'text-gray-500'}`}>
          {row.original.status}
        </span>
      )
    },
  ]

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
      <CustomTable tableId="projects-table" columns={columns as any} data={projectData} placeholder="No projects found" />
    </div>
  )
} 