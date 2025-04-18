import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createNewUser, fetchTeams, fetchRoles, fetchUserById, updateUserData, Team, Role, User } from "@/lib/data/supabaseFunctions"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

export function UserForm() {
    console.log('entra aca')
    const { toast } = useToast()
    const navigate = useNavigate()
    const { id } = useParams()
    const isNewUser = id === 'new'

    const [loading, setLoading] = useState(false)
    const [isFetching, setIsFetching] = useState(false)
    const [teams, setTeams] = useState<Team[]>([])
    const [roles, setRoles] = useState<Role[]>([])
    const [formData, setFormData] = useState({
        email: "",
        password: "",
        first_name: "",
        last_name: "",
        role: "",
        team: "",
        location: "",
        title: "",
        description: "",
        language: {
            code: "en",
            name: "English"
        }
    })

    useEffect(() => {
        const loadData = async () => {
            setIsFetching(true)
            const [teamsResponse, rolesResponse] = await Promise.all([
                fetchTeams(),
                fetchRoles()
            ])

            if (teamsResponse.error) {
                console.error("Error loading teams:", teamsResponse.error)
                toast({
                    title: "Error",
                    description: "Failed to load teams data",
                    variant: "destructive"
                })
            } else {
                setTeams(teamsResponse.data || [])
            }

            if (rolesResponse.error) {
                console.error("Error loading roles:", rolesResponse.error)
                toast({
                    title: "Error",
                    description: "Failed to load roles data",
                    variant: "destructive"
                })
            } else {
                setRoles(rolesResponse.data || [])
            }

            if (id && !isNewUser) {
                const { data: userData, error: userError } = await fetchUserById(id)
                if (userError) {
                    console.error("Error loading user:", userError)
                    toast({
                        title: "Error",
                        description: "Failed to load user data",
                        variant: "destructive"
                    })
                } else if (userData) {
                    setFormData({
                        email: userData.email || "",
                        password: userData.password || "",
                        first_name: userData.first_name || "",
                        last_name: userData.last_name || "",
                        role: userData.role || "",
                        team: userData.team || "",
                        location: userData.location || "",
                        title: userData.title || "",
                        description: userData.description || "",
                        language: userData.language || {
                            code: "en",
                            name: "English"
                        }
                    })
                }
            }

            setIsFetching(false)
        }
        loadData()
    }, [id, isNewUser, toast])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            if (isNewUser) {
                const { data, error } = await createNewUser(formData)

                if (error) {
                    toast({
                        title: "Error creating user",
                        description: error.message,
                        variant: "destructive"
                    })
                    return
                }

                toast({
                    title: "User created successfully",
                    description: "An invite email has been sent to the user."
                })

                navigate('/settings/teams')
            } else if (id) {
                const { data, error } = await updateUserData(id, formData)

                if (error) {
                    toast({
                        title: "Error updating user",
                        description: error.message,
                        variant: "destructive"
                    })
                    return
                }

                toast({
                    title: "User updated successfully",
                    description: "The user's information has been updated."
                })
                navigate('/settings/teams')
            }
        } catch (error) {
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "An unexpected error occurred",
                variant: "destructive"
            })
        } finally {
            setLoading(false)
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
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
        <div className="container mx-auto py-6">
            <Card>
                <CardHeader>
                    <CardTitle>{isNewUser ? "Create New User" : "Edit User"}</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {isNewUser && (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        name="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="password">Password</Label>
                                    <Input
                                        id="password"
                                        name="password"
                                        type="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="first_name">First Name</Label>
                                <Input
                                    id="first_name"
                                    name="first_name"
                                    value={formData.first_name}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="last_name">Last Name</Label>
                                <Input
                                    id="last_name"
                                    name="last_name"
                                    value={formData.last_name}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="role">Role</Label>
                                <Select
                                    value={formData.role}
                                    onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}
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
                                <Label htmlFor="team">Team</Label>
                                <Select
                                    value={formData.team}
                                    onValueChange={(value) => setFormData(prev => ({ ...prev, team: value }))}
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
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="location">Location</Label>
                                <Input
                                    id="location"
                                    name="location"
                                    value={formData.location}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="title">Title</Label>
                                <Input
                                    id="title"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Input
                                id="description"
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                            />
                        </div>

                        <Button type="submit" disabled={loading}>
                            {loading ? (isNewUser ? "Creating..." : "Updating...") : (isNewUser ? "Create User" : "Update User")}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
} 