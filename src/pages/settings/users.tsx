import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { fetchTeams, Team, Role, fetchRoles, fetchUserById, updateUser, addUser } from "@/lib/data/supabaseFunctions"
import { Loader2 } from "lucide-react"

export function UserForm() {
    const navigate = useNavigate()
    const { id } = useParams()
    const [isLoading, setIsLoading] = useState(false)
    const [isFetching, setIsFetching] = useState(false)
    const [teams, setTeams] = useState<Team[]>([])
    const [roles, setRoles] = useState<Role[]>([])
    const [selectedTeam, setSelectedTeam] = useState<string>("")
    const [selectedRole, setSelectedRole] = useState<string>("")
    const [formData, setFormData] = useState({
        first_name: "",
        last_name: "",
        email: "",
        location: "",
        title: "",
        description: "",
        status: "",
    })

    useEffect(() => {
        const loadData = async () => {
            setIsFetching(true)
            const [teamsResponse, rolesResponse] = await Promise.all(
                [fetchTeams(), fetchRoles()]
            )

            if (teamsResponse.error) {
                console.error("Error loading tams:", teamsResponse.error)
            } else {
                setTeams(teamsResponse.data)
            }

            if (rolesResponse.error) {
                console.error("Error loading roles:", rolesResponse.error)
            } else {
                setRoles(rolesResponse.data)
            }

            if (id && id !== "new") {
                const { data: user, error } = await fetchUserById(id)
                if (error) {
                    console.error("Error loading user:", error)
                } else if (user) {
                    setSelectedTeam(user.team)
                    setSelectedRole(user.role)
                    setFormData({
                        first_name: user.first_name ,
                        last_name: user.last_name,
                        email: user.email ,
                        location: user.location,
                        title: user.title,
                        description: user.description,
                        status: user.status ,
                    })
                } else {
                    console.log("No user found with ID:", id)
                }
            }
            setIsFetching(false)
        }
        loadData()
    }, [id])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            if (id && id !== "new") {
                const { error } = await updateUser(id, {
                    ...formData,
                    team: selectedTeam,
                    role: selectedRole
                })
                if (error) throw error
            } else {
                const { error } = await addUser({
                    ...formData,
                    team: selectedTeam,
                    role: selectedRole,
                })
                if (error) throw error
            }
            navigate("/settings/teams")
        } catch (error) {
            console.error("Error saving user:", error)
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
                <h1 className="text-2xl font-bold mb-6">{id && id !== "new" ? "Edit Score" : "Add New Score"}</h1>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="first_name">First Name</Label>
                        <Input
                            id="first_name"
                            value={formData.first_name}
                            onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="last_name">Last Name</Label>
                        <Input
                            id="last_name"
                            value={formData.last_name}
                            onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            value={formData.email}
                            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                            required
                        />
                    </div>
                    
                    <div className="space-y-2">
                        <Label htmlFor="team">Team</Label>
                        <Select
                            value={selectedTeam}
                            onValueChange={setSelectedTeam}
                            required
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
                        <Label htmlFor="role">Role</Label>
                        <Select
                            value={selectedRole}
                            onValueChange={setSelectedRole}
                            required
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
                        <Label htmlFor="description">Description</Label>
                        <Input
                            id="description"
                            value={formData.description}
                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="status">Status</Label>
                        <Input
                            id="status"
                            value={formData.status}
                            onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="location">Location</Label>
                        <Input
                            id="location"
                            value={formData.location}
                            onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="title">Title</Label>
                        <Input
                            id="title"
                            value={formData.title}
                            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        />
                    </div>

                    <div className="flex justify-end space-x-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => navigate("/settings/teams")}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? "Saving..." : (id && id !== "new" ? "Update" : "Create")}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
} 