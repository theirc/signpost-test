import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
import { ColumnDef } from "@tanstack/react-table"
import CustomTable from "@/components/ui/custom-table"
import { fetchProjects } from "@/lib/data/supabaseFunctions"
import { useNavigate } from "react-router-dom"
import { format } from "date-fns"
import { usePermissions } from "@/lib/hooks/usePermissions"

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
  const navigate = useNavigate()
  const { canCreate, canUpdate } = usePermissions()
  const [projects, setProjects] = useState<Project[]>([])

  const fetchProject = async () => {
    const { data, error } = await fetchProjects()
    if (error) {
      console.error('Error fetching projects:', error)
    }
    const formattedProjects = data.map(project => ({
      ...project,
      created_at: project.created_at || new Date().toISOString()
    }))
    setProjects(formattedProjects)
  }

  const handleEdit = (id: string) => {
    navigate(`/settings/projects/${id}`)
  }

  const columns: ColumnDef<any>[] = [
    { id: "name", accessorKey: "name", header: "Name", enableResizing: true, enableHiding: true, enableSorting: true, cell: (info) => info.getValue() },
    { id: "description", enableResizing: true, enableHiding: true, accessorKey: "description", header: "Team", enableSorting: false, cell: (info) => info.getValue() },
    { id: "created_at", enableResizing: true, enableHiding: true, accessorKey: "created_at", header: "Created", enableSorting: false, cell: (info) => format(new Date(info.getValue() as string), "MMM dd, yyyy") },
    {
      id: "status", enableResizing: true, enableHiding: true, accessorKey: "status", header: "Status", enableSorting: true, cell: ({ row }) => (
        <span className={`capitalize ${row.original.status === 'active' ? 'text-green-600' : 'text-gray-500'}`}>
          {row.original.status}
        </span>
      )
    },
  ]

  useEffect(() => {
    fetchProject()
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Projects</h3>
          <p className="text-sm text-muted-foreground">
            Manage your organization's projects and team assignments
          </p>
        </div>
        {canCreate("projects") && (
          <Button onClick={() => navigate("/settings/projects/new")}>Create Project</Button>
        )}
      </div>
      <CustomTable
        tableId="projects-table"
        columns={columns as any}
        data={projects}
        onRowClick={(row) => {
          canUpdate("projects") ? handleEdit(row.id) : undefined
        }}
        placeholder="No projects found" />
    </div>
  )
} 