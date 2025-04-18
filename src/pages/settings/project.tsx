import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { fetchTeams, Team, fetchProjectById, updateProject, addProject } from "@/lib/data/supabaseFunctions"
import { Loader2 } from "lucide-react"
import { usePermissions } from "@/lib/hooks/usePermissions"

export function ProjectForm() {
    const navigate = useNavigate()
    const { id } = useParams()
    const { canCreate, canUpdate } = usePermissions()
    const [isLoading, setIsLoading] = useState(false)
    const [isFetching, setIsFetching] = useState(false)
    const [teams, setTeams] = useState<Team[]>([])
    const [selectedTeam, setSelectedTeam] = useState<string>("")
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        team: "",
        status: "",
    })

    useEffect(() => {
        const loadData = async () => {
            setIsFetching(true)
            const teamsResponse = await fetchTeams()

            if (teamsResponse.error) {
                console.error("Error loading teams:", teamsResponse.error)
            } else {
                setTeams(teamsResponse.data)
            }

            if (id && id !== "new") {
                const { data: project, error } = await fetchProjectById(id)
                if (error) {
                    console.error("Error loading project:", error)
                } else if (project) {
                    setSelectedTeam(project.team || "")
                    setFormData({
                        name: project.name,
                        description: project.description,
                        status: project.status,
                        team: project.team
                    })
                } else {
                    console.log("No project found with ID:", id)
                }
            }
            setIsFetching(false)
        }
        loadData()
    }, [id])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if ((id === "new" && !canCreate("projects")) || (id !== "new" && !canUpdate("projects"))) {
            return
        }

        setIsLoading(true)
        try {
            if (id && id !== "new") {
                const { error } = await updateProject(id, {
                    ...formData,
                    team: selectedTeam
                })
                if (error) throw error
            } else {
                const { error } = await addProject({
                    ...formData,
                    team: selectedTeam
                })
                if (error) throw error
            }
            navigate("/settings/projects")
        } catch (error) {
            console.error("Error saving project:", error)
        } finally {
            setIsLoading(false)
        }
    }

    if (isFetching) {
        return (
            <div className="container mx-auto py-8">
                <div className="max-w-2xl mx-auto flex items-center justify-center h-[50vh]">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </div>
        )
    }

    return (
        <div className="container mx-auto py-8">
            <div className="max-w-2xl mx-auto">
                <h1 className="text-2xl font-bold mb-6">{id && id !== "new" ? "Edit Project" : "Add New Project"}</h1>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            required
                            disabled={!canCreate("projects") && !canUpdate("projects")}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="team">Team</Label>
                        <Select
                            value={selectedTeam}
                            onValueChange={setSelectedTeam}
                            required
                            disabled={!canCreate("projects") && !canUpdate("projects")}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select a team" />
                            </SelectTrigger>
                            <SelectContent>
                                {teams.map((team) => (
                                    <SelectItem key={team.id} value={team.id}>
                                        {team.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Input
                            id="description"
                            value={formData.description}
                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            disabled={!canCreate("projects") && !canUpdate("projects")}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="status">Status</Label>
                        <Input
                            id="status"
                            value={formData.status}
                            onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                            disabled={!canCreate("projects") && !canUpdate("projects")}
                        />
                    </div>

                    <div className="flex justify-end space-x-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => navigate("/settings/projects")}
                        >
                            Cancel
                        </Button>
                        {(canCreate("projects") || canUpdate("projects")) && (
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    "Save"
                                )}
                            </Button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    )
} 