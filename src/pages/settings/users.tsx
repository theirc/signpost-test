import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MultiSelect } from "@/components/ui/multi-select"
import { fetchUserById, updateUser, fetchRoles, fetchTeams, addUserToTeam, removeUserFromTeam, getUserTeams, createNewUser } from "@/lib/data/supabaseFunctions"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

export function UserForm() {
    const { toast } = useToast()
    const navigate = useNavigate()
    const { id } = useParams()
    const isNewUser = id === 'new'

    const [loading, setLoading] = useState(false)
    const [isFetching, setIsFetching] = useState(false)
    const [roles, setRoles] = useState([])
    const [teams, setTeams] = useState([])
    const [userTeams, setUserTeams] = useState([])
    const [formData, setFormData] = useState({
        email: "",
        password: "",
        first_name: "",
        last_name: "",
        role: "",
        status: "active",
        teams: [] as string[]
    })

    useEffect(() => {
        const loadData = async () => {
            setIsFetching(true)
            try {
                const [{ data: rolesData }, { data: teamsData }] = await Promise.all([
                    fetchRoles(),
                    fetchTeams()
                ])
                setRoles(rolesData)
                setTeams(teamsData)

                if (id && !isNewUser) {
                    const { data: user, error: userError } = await fetchUserById(id)
                    if (userError) {
                        throw new Error("Failed to load user data")
                    }

                    const { data: userTeamsData } = await getUserTeams(id)
                    setUserTeams(userTeamsData || [])

                    if (user) {
                        setFormData({
                            email: user.email || "",
                            password: user.password || "",
                            first_name: user.first_name || "",
                            last_name: user.last_name || "",
                            role: user.role || "",
                            status: user.status || "active",
                            teams: userTeamsData?.map(team => team.id) || []
                        })
                    }
                }
            } catch (error) {
                console.error("Error loading data:", error)
                toast({
                    title: "Error",
                    description: "Failed to load data",
                    variant: "destructive"
                })
            } finally {
                setIsFetching(false)
            }
        }
        loadData()
    }, [id, isNewUser, toast])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            let result
            if (isNewUser) {
                result = await createNewUser(formData)
            } else {
                const userData = {
                    first_name: formData.first_name,
                    last_name: formData.last_name,
                    role: formData.role,
                    status: formData.status
                }
                result = await updateUser(id!, userData)
            }

            if (result.error) {
                throw new Error(result.error.message)
            }

            if (result.data) {
                const id = result.data.id
                const currentTeamIds = userTeams.map(team => team.id)
                const newTeamIds = formData.teams
                const teamsToRemove = currentTeamIds.filter(id => !newTeamIds.includes(id))
                await Promise.all(
                    teamsToRemove.map(teamId => removeUserFromTeam(id, teamId))
                )
                const teamsToAdd = newTeamIds.filter(id => !currentTeamIds.includes(id))
                await Promise.all(
                    teamsToAdd.map(teamId => addUserToTeam(id, teamId))
                )
            }

            toast({
                title: "Success",
                description: isNewUser ? "User created successfully" : "User updated successfully"
            })
            navigate("/settings/teams")
        } catch (error) {
            console.error("Error saving user:", error)
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to save user",
                variant: "destructive"
            })
        } finally {
            setLoading(false)
        }
    }

    const teamOptions = teams.map(team => ({
        label: team.name,
        value: team.id
    }))

    return (
        <Card>
            <CardHeader>
                <CardTitle>{isNewUser ? "Create User" : "Edit User"}</CardTitle>
            </CardHeader>
            <CardContent>
                {isFetching ? (
                    <div className="flex justify-center items-center h-64">
                        <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {isNewUser && (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="password">Password</Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>)}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="first_name">First Name</Label>
                                <Input
                                    id="first_name"
                                    value={formData.first_name}
                                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="last_name">Last Name</Label>
                                <Input
                                    id="last_name"
                                    value={formData.last_name}
                                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                                    required
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="role">Role</Label>
                                <Select
                                    value={formData.role}
                                    onValueChange={(value) => setFormData({ ...formData, role: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {roles.map((role) => (
                                            <SelectItem key={role.id} value={role.id}>
                                                {role.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Teams</Label>
                                <MultiSelect
                                    options={teamOptions}
                                    onValueChange={(selected) => setFormData({ ...formData, teams: selected })}
                                    defaultValue={formData.teams}
                                    placeholder="Select teams"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="status">Status</Label>
                            <Select
                                value={formData.status}
                                onValueChange={(value) => setFormData({ ...formData, status: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="inactive">Inactive</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex justify-end space-x-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => navigate("/settings/teams")}
                                disabled={loading}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={loading}>
                                {loading ? (isNewUser ? "Creating..." : "Updating...") : (isNewUser ? "Create User" : "Update User")}
                            </Button>
                        </div>
                    </form>
                )}
            </CardContent>
        </Card>
    )
} 