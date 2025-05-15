import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
import { ColumnDef } from "@tanstack/react-table"
import CustomTable from "@/components/ui/custom-table"
import { useNavigate } from "react-router-dom"
import { format } from "date-fns"
import { usePermissions } from "@/lib/hooks/usePermissions"
import { useTeamStore } from "@/lib/hooks/useTeam"
import { Loader2 } from "lucide-react"
import { useSupabase } from "@/hooks/use-supabase"

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
  const { selectedTeam } = useTeamStore()
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const fetchProject = async () => {
    setIsLoading(true)
    const { data, error } = await useSupabase().from("projects").select("*").eq("team", selectedTeam?.id)
    if (error) {
      console.error('Error fetching projects:', error)
    }
    const formattedProjects = data.map(project => ({
      ...project,
      created_at: project.created_at || new Date().toISOString()
    }))
    setProjects(formattedProjects)
    setIsLoading(false)
  }

  const handleEdit = (id: string) => {
    navigate(`/settings/projects/${id}`)
  }

  const columns: ColumnDef<any>[] = [
    { id: "name", accessorKey: "name", header: "Name", enableResizing: true, enableHiding: true, enableSorting: true, cell: (info) => info.getValue() },
    { id: "description", enableResizing: true, enableHiding: true, accessorKey: "description", header: "Description", enableSorting: false, cell: (info) => info.getValue() },
    { id: "team_name", enableResizing: true, enableHiding: true, accessorKey: "team_name", header: "Team", enableSorting: false, cell: (info) => info.getValue() },
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
  }, [selectedTeam])

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
      {isLoading ? (
        <div className="flex items-center justify-center h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <CustomTable
          tableId="projects-table"
          columns={columns as any}
          data={projects}
          onRowClick={(row) => {
            canUpdate("projects") ? handleEdit(row.id) : undefined
          }}
          placeholder="No projects found" />
      )}
    </div>
  )
} 