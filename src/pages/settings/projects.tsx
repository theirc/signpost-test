import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useEffect, useState } from "react"
import { ColumnDef } from "@tanstack/react-table"
import CustomTable from "@/components/ui/custom-table"
import { deleteProject, fetchProjects } from "@/lib/data/supabaseFunctions"
import { useNavigate } from "react-router-dom"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { format } from "date-fns"

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
  const [projects, setProjects] = useState<Project[]>([])
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null)

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

  const handleDelete = async (id: string) => {
    setProjectToDelete(id)
    setIsDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!projectToDelete) return

    const { error } = await deleteProject(projectToDelete)
    if (error) {
      console.error('Error deleting log:', error)
    } else {
      await fetchProject()
    }
    setIsDeleteDialogOpen(false)
    setProjectToDelete(null)
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
    <div>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-medium">Projects</h3>
            <p className="text-sm text-muted-foreground">
              Manage your organization's projects and team assignments
            </p>
          </div>
          <Button onClick={() => navigate("/settings/projects/new")}>Create Project</Button>
        </div>
        <CustomTable
          tableId="projects-table"
          columns={columns as any}
          data={projects}
          onEdit={handleEdit}
          onDelete={handleDelete}
          placeholder="No projects found" />
      </div>
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action is irreversible. This will permanently delete the project.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
} 