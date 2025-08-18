import { CheckCircle } from "lucide-react"
import { Label } from "../label"

interface TelerivetProject {
  id: string
  name: string
  default_route_id: string
  timezone_id: string
}

interface TelerivetProjectSelectorProps {
  projects: TelerivetProject[]
  selectedProject: TelerivetProject | null
  onProjectSelect: (project: TelerivetProject) => void
}

export function TelerivetProjectSelector({
  projects,
  selectedProject,
  onProjectSelect
}: TelerivetProjectSelectorProps) {
  if (projects.length === 0) return null

  return (
    <div className="space-y-2">
      <Label>Select Project</Label>
      <div className="max-h-48 overflow-y-auto border rounded-md">
        {projects.map((project) => (
          <div
            key={project.id}
            className={`p-3 border-b cursor-pointer hover:bg-gray-50 ${
              selectedProject?.id === project.id ? 'bg-blue-50 border-blue-200' : ''
            }`}
            onClick={() => onProjectSelect(project)}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{project.name}</div>
                <div className="text-sm text-gray-600">
                  ID: {project.id} • Route: {project.default_route_id}
                </div>
              </div>
              {selectedProject?.id === project.id && (
                <CheckCircle className="h-5 w-5 text-blue-600" />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 