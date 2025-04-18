import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { fetchTeamById, updateTeam, addTeam } from "@/lib/data/supabaseFunctions"
import { Loader2 } from "lucide-react"
import { usePermissions } from "@/lib/hooks/usePermissions"

export function TeamForm() {
    const navigate = useNavigate()
    const { id } = useParams()
    const { canCreate, canUpdate } = usePermissions()
    const [isLoading, setIsLoading] = useState(false)
    const [isFetching, setIsFetching] = useState(false)
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        status: "",
    })

    useEffect(() => {
        const loadData = async () => {
            setIsFetching(true)
            if (id && id !== "new") {
                const { data: team, error } = await fetchTeamById(id)
                if (error) {
                    console.error("Error loading team:", error)
                } else if (team) {
                    setFormData({
                        name: team.name,
                        description: team.description,
                        status: team.status,
                    })
                } else {
                    console.log("No team found with ID:", id)
                }
            }
            setIsFetching(false)
        }
        loadData()
    }, [id])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if ((id === "new" && !canCreate("teams")) || (id !== "new" && !canUpdate("teams"))) {
            return
        }

        setIsLoading(true)
        try {
            if (id && id !== "new") {
                const { error } = await updateTeam(id, formData)
                if (error) throw error
            } else {
                const { error } = await addTeam(formData)
                if (error) throw error
            }
            navigate("/settings/teams")
        } catch (error) {
            console.error("Error saving team:", error)
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
                <h1 className="text-2xl font-bold mb-6">{id && id !== "new" ? "Edit Team" : "Add New Team"}</h1>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            required
                            disabled={!canCreate("teams") && !canUpdate("teams")}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Input
                            id="description"
                            value={formData.description}
                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            disabled={!canCreate("teams") && !canUpdate("teams")}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="status">Status</Label>
                        <Input
                            id="status"
                            value={formData.status}
                            onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                            disabled={!canCreate("teams") && !canUpdate("teams")}
                        />
                    </div>

                    <div className="flex justify-end space-x-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => navigate("/settings/teams")}
                        >
                            Cancel
                        </Button>
                        {(canCreate("teams") || canUpdate("teams")) && (
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