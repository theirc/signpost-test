import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MultiSelect } from "@/components/ui/multi-select"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"
import { supabase } from "@/lib/agents/db"
import { usePermissions } from "@/lib/hooks/usePermissions"

const createNewUser = async (userData: {
    email: string
    password?: string
    first_name?: string
    last_name?: string
    role?: string
    team?: string
    location?: string
    title?: string
    description?: string
    language?: {
        code: string
        name: string
    }
}) => {
    try {
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: userData.email,
            password: userData.password,
        })

        if (authError) {
            console.error('Error creating auth user:', authError)
            return { data: null, error: authError }
        }

        if (!authData.user) {
            return { data: null, error: new Error('No user data returned from auth creation') }
        }

        const { data: existingUser, error: checkError } = await supabase
            .from('users')
            .select('*')
            .eq('id', authData.user.id)
            .single()

        if (checkError && checkError.code !== 'PGRST116') {
            console.error('Error checking existing user:', checkError)
            return { data: null, error: checkError }
        }

        let publicUserData
        let publicUserError

        if (existingUser) {
            const { data, error } = await supabase
                .from('users')
                .update({
                    first_name: userData.first_name,
                    last_name: userData.last_name,
                    role: userData.role,
                    team: userData.team,
                    location: userData.location,
                    title: userData.title,
                    description: userData.description,
                    language: userData.language,
                    status: 'active'
                })
                .eq('id', authData.user.id)
                .select(`
            *,
            roles:role (*),
            teams:team (*)
          `)
                .single()

            publicUserData = data
            publicUserError = error
        } else {
            const { data, error } = await supabase
                .from('users')
                .insert([{
                    id: authData.user.id,
                    first_name: userData.first_name,
                    last_name: userData.last_name,
                    role: userData.role,
                    team: userData.team,
                    location: userData.location,
                    title: userData.title,
                    description: userData.description,
                    language: userData.language,
                    status: 'active'
                }])
                .select(`
            *,
            roles:role (*),
            teams:team (*)
          `)
                .single()

            publicUserData = data
            publicUserError = error
        }

        if (publicUserError) {
            console.error('Error creating/updating public user:', publicUserError)
            await supabase.auth.signOut()
            return { data: null, error: publicUserError }
        }

        return {
            data: {
                ...authData.user,
                ...publicUserData,
                role_name: publicUserData.roles?.name,
                team_name: publicUserData.teams?.name
            },
            error: null
        }
    } catch (error) {
        console.error('Error in createNewUser:', error)
        return {
            data: null,
            error: error instanceof Error ? error : new Error(String(error))
        }
    }
}

export function UserForm() {
    const { toast } = useToast()
    const navigate = useNavigate()
    const { id } = useParams()
    const isNewUser = id === 'new'
    const { canCreate, canUpdate } = usePermissions()

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
                    supabase.from("roles").select("*"),
                    supabase.from("teams").select("*")
                ])
                setRoles(rolesData)
                setTeams(teamsData)

                if (id && !isNewUser) {
                    const { data: user, error: userError } = await supabase.from("users").select("*").eq("id", id).single()
                    if (userError) {
                        throw new Error("Failed to load user data")
                    }

                    const { data: userTeamsData } = await supabase.from("user_teams").select(`
                            teams!inner(*)
                        `)
                        .eq('user_id', user.id)

                    setUserTeams(userTeamsData?.map(team => team.teams) || [])

                    if (user) {
                        setFormData({
                            email: user.email || "",
                            password: "",
                            first_name: user.first_name || "",
                            last_name: user.last_name || "",
                            role: user.role || "",
                            status: user.status || "active",
                            teams: userTeamsData?.map(team => team.teams.id) || []
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
                result = await supabase.from("users").update(userData).eq("id", id!)
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
                    teamsToRemove.map(teamId => supabase.from("user_teams").delete().match({ user_id: id, team_id: teamId }))
                )
                const teamsToAdd = newTeamIds.filter(id => !currentTeamIds.includes(id))
                await Promise.all(
                    teamsToAdd.map(teamId => supabase.from("user_teams").insert({ user_id: id, team_id: teamId }))
                )
            }

            toast({
                title: "Success",
                description: isNewUser ? "User created successfully" : "User updated successfully"
            })
            navigate("/settings/users")
        } catch (error) {
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
                                onClick={() => navigate("/settings/users")}
                                disabled={loading}
                            >
                                Cancel
                            </Button>
                            {(canCreate("users") || canUpdate("users")) && <Button type="submit" disabled={loading}>
                                {loading ? (isNewUser ? "Creating..." : "Updating...") : (isNewUser ? "Create User" : "Update User")}
                            </Button>}
                        </div>
                    </form>
                )}
            </CardContent>
        </Card>
    )
} 