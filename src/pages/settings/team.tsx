import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { usePermissions } from "@/lib/hooks/usePermissions"
import { supabase } from "@/lib/agents/db"
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query"
import { invalidateTeamCache } from "./teams"

export function TeamForm() {
    const navigate = useNavigate()
    const { id } = useParams()
    const { canCreate, canUpdate } = usePermissions()
    const queryClient = useQueryClient()
    
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        status: "",
    })

    const { data: team, isLoading: isFetching, error: teamError } = useQuery({
        queryKey: ['team', id],
        queryFn: async () => {
            if (!id || id === "new") return null
            const { data, error } = await supabase.from("teams").select("*").eq("id", id).single()
            if (error) throw error
            return data
        },
        enabled: !!id && id !== "new"
    })

    const updateTeamMutation = useMutation({
        mutationFn: async (teamData: typeof formData) => {
            const { error } = await supabase.from("teams").update(teamData).eq("id", id!).select().single()
            if (error) throw error
            return { success: true }
        },
        onSuccess: () => {
            invalidateTeamCache(queryClient)
            navigate("/settings/teams")
        },
        onError: (error) => {
            console.error("Error updating team:", error)
        }
    })

    const createTeamMutation = useMutation({
        mutationFn: async (teamData: typeof formData) => {
            const { data, error } = await supabase.from("teams").insert(teamData).select().single()
            if (error) throw error

            const { data: roleData } = await supabase
                .from("roles")
                .select("teams_id")
                .eq("id", "12219f26-0293-4954-8dbd-c5ba3ecc2b14")
                .single()

            const { error: roleError } = await supabase
                .from("roles")
                .update({
                    teams_id: [...(roleData?.teams_id || []), data.id]
                })
                .eq("id", "12219f26-0293-4954-8dbd-c5ba3ecc2b14")

            if (roleError) throw roleError
            return { success: true }
        },
        onSuccess: () => {
            invalidateTeamCache(queryClient)
            navigate("/settings/teams")
        },
        onError: (error) => {
            console.error("Error creating team:", error)
        }
    })

    const hasRequiredData = id === "new" || (id !== "new" && team)
    const mutationError = updateTeamMutation.error || createTeamMutation.error

    useEffect(() => {
        if (team) {
            setFormData({
                name: team.name,
                description: team.description,
                status: team.status,
            })
        }
    }, [team])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if ((id === "new" && !canCreate("teams")) || (id !== "new" && !canUpdate("teams"))) {
            return
        }

        if (id && id !== "new") {
            updateTeamMutation.mutate(formData)
        } else {
            createTeamMutation.mutate(formData)
        }
    }

    if (isFetching || !hasRequiredData) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>{id && id !== "new" ? "Edit Team" : "Add New Team"}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex justify-center items-center h-64">
                        <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (teamError) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Error Loading Team</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center text-red-600">
                        <p>Failed to load team data. Please try refreshing the page.</p>
                        <Button
                            onClick={() => window.location.reload()}
                            variant="outline"
                            className="mt-4"
                        >
                            Refresh Page
                        </Button>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>{id && id !== "new" ? "Edit Team" : "Add New Team"}</CardTitle>
            </CardHeader>
            <CardContent>
                {mutationError && (
                    <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
                        <p className="text-red-800">
                            Error: {mutationError instanceof Error ? mutationError.message : 'An error occurred while saving the team'}
                        </p>
                    </div>
                )}

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
                            disabled={updateTeamMutation.isPending || createTeamMutation.isPending}
                        >
                            Cancel
                        </Button>
                        {(canCreate("teams") || canUpdate("teams")) && (
                            <Button
                                type="submit"
                                disabled={updateTeamMutation.isPending || createTeamMutation.isPending}
                            >
                                {updateTeamMutation.isPending || createTeamMutation.isPending ? (
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
            </CardContent>
        </Card>
    )
} 