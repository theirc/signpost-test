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
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query"
import { invalidateTeamCache } from "./teams"

const createNewUser = async (userData: {
    email: string
    password?: string
    first_name?: string
    last_name?: string
    role?: string
    status?: string
}) => {
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
    })

    if (authError) throw authError
    if (!authData.user) throw new Error('No user data returned from auth creation')

    const { data: publicUserData, error: publicUserError } = await supabase
        .from('users')
        .upsert([{
            id: authData.user.id,
            first_name: userData.first_name,
            last_name: userData.last_name,
            role: userData.role,
            status: userData.status || 'active'
        }])
        .select(`
            *,
            roles:role (*)
        `)
        .single()

    if (publicUserError) {
        await supabase.auth.signOut()
        throw publicUserError
    }

    return {
        data: {
            ...authData.user,
            ...publicUserData
        },
        error: null
    }
}

export function UserForm() {
    const { toast } = useToast()
    const navigate = useNavigate()
    const { id } = useParams()
    const isNewUser = id === 'new'
    const { canCreate, canUpdate } = usePermissions()
    const queryClient = useQueryClient()

    const [formData, setFormData] = useState({
        email: "",
        password: "",
        first_name: "",
        last_name: "",
        role: "",
        status: "active",
        teams: [] as string[]
    })

    const { data: roles, isLoading: isRolesLoading, error: rolesError } = useQuery({
        queryKey: ['roles'],
        queryFn: async () => {
            const { data, error } = await supabase.from("roles").select("*")
            if (error) throw error
            return data || []
        }
    })

    const { data: teams, isLoading: isTeamsLoading, error: teamsError } = useQuery({
        queryKey: ['teams'],
        queryFn: async () => {
            const { data, error } = await supabase.from("teams").select("*")
            if (error) throw error
            return data || []
        }
    })

    const { data: user, isLoading: isUserLoading, error: userError } = useQuery({
        queryKey: ['user', id],
        queryFn: async () => {
            if (!id || isNewUser) return null
            const { data, error } = await supabase.from("users").select("*").eq("id", id).single()
            if (error) throw error
            return data
        },
        enabled: !!id && !isNewUser
    })

    const { data: userTeamsData, isLoading: isUserTeamsLoading, error: userTeamsError } = useQuery({
        queryKey: ['user_teams', id],
        queryFn: async () => {
            if (!id || isNewUser || !user) return []
            const { data, error } = await supabase.from("user_teams").select(`teams!inner(*)`).eq('user_id', id)
            if (error) throw error
            return data || []
        },
        enabled: !!id && !isNewUser && !!user
    })

    const userTeams = userTeamsData?.map(team => team.teams) || []
    const isFetching = isRolesLoading || isTeamsLoading || isUserLoading || isUserTeamsLoading
    const hasError = rolesError || teamsError || userError || userTeamsError

    const hasRequiredData = roles && teams && (isNewUser || (user && userTeamsData))

    const createUserMutation = useMutation({
        mutationFn: async (userData: typeof formData) => {
            return await createNewUser(userData)
        },
        onSuccess: async (result) => {
            if (result.data) {
                await handleTeamUpdates(result.data.id, [], formData.teams)
            }
            invalidateTeamCache(queryClient)
            toast({
                title: "Success",
                description: "User created successfully"
            })
            navigate("/settings/users")
        },
        onError: (error) => {
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to create user",
                variant: "destructive"
            })
        }
    })

    const updateUserMutation = useMutation({
        mutationFn: async (userData: typeof formData) => {
            const userUpdateData = {
                first_name: userData.first_name,
                last_name: userData.last_name,
                role: userData.role,
                status: userData.status
            }
            const { error } = await supabase.from("users").update(userUpdateData).eq("id", id!)
            if (error) throw error
            return { success: true }
        },
        onSuccess: async () => {
            await handleTeamUpdates(id!, userTeams.map(team => team.id), formData.teams)
            invalidateTeamCache(queryClient)
            toast({
                title: "Success",
                description: "User updated successfully"
            })
            navigate("/settings/users")
        },
        onError: (error) => {
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to update user",
                variant: "destructive"
            })
        }
    })

    const handleTeamUpdates = async (userId: string, currentTeamIds: string[], newTeamIds: string[]) => {
        const teamsToRemove = currentTeamIds.filter(teamId => !newTeamIds.includes(teamId))
        const teamsToAdd = newTeamIds.filter(teamId => !currentTeamIds.includes(teamId))

        if (teamsToRemove.length > 0) {
            await Promise.all(teamsToRemove.map(async (teamId) => {
                const { error } = await supabase
                    .from("user_teams")
                    .delete()
                    .match({ user_id: userId, team_id: teamId })
                if (error) throw new Error(`Failed to remove team ${teamId}: ${error.message}`)
            }))
        }

        if (teamsToAdd.length > 0) {
            const { error } = await supabase
                .from("user_teams")
                .insert(teamsToAdd.map(teamId => ({ user_id: userId, team_id: teamId })))
            if (error) throw new Error(`Failed to add teams: ${error.message}`)
        }
    }

    useEffect(() => {
        if (user && userTeamsData) {
            const teamIds = userTeamsData.map(team => team.teams.id) || []

            setFormData({
                email: user.email || "",
                password: "",
                first_name: user.first_name || "",
                last_name: user.last_name || "",
                role: user.role || "",
                status: user.status || "active",
                teams: teamIds
            })
        }
    }, [user, userTeamsData])

    if (isFetching || !hasRequiredData) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>{isNewUser ? "Create User" : "Edit User"}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex justify-center items-center h-64">
                        <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (hasError) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Error Loading Data</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center text-red-600">
                        <p>Failed to load required data. Please try refreshing the page.</p>
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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        
        if (isNewUser) {
            createUserMutation.mutate(formData)
        } else {
            updateUserMutation.mutate(formData)
        }
    }

    const mutationError = createUserMutation.error || updateUserMutation.error

    return (
        <Card>
            <CardHeader>
                <CardTitle>{isNewUser ? "Create User" : "Edit User"}</CardTitle>
            </CardHeader>
            <CardContent>
                {mutationError && (
                    <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
                        <p className="text-red-800">
                            Error: {mutationError instanceof Error ? mutationError.message : 'An error occurred while saving the user'}
                        </p>
                    </div>
                )}

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
                                <Label>Role</Label>
                                <Select
                                    value={formData.role}
                                    onValueChange={(value) => setFormData({ ...formData, role: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {(roles || []).map((role) => (
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
                                    key={`teams-${userTeamsData?.length || 0}-${formData.teams.join(',')}`}
                                    options={(teams || []).map(team => ({
                                        label: team.name,
                                        value: team.id
                                    }))}
                                    onValueChange={(selected) => {
                                        setFormData({ ...formData, teams: selected })
                                    }}
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
                                disabled={createUserMutation.isPending || updateUserMutation.isPending}
                            >
                                Cancel
                            </Button>
                            {(canCreate("users") || canUpdate("users")) && <Button
                                type="submit"
                                disabled={createUserMutation.isPending || updateUserMutation.isPending}
                            >
                                {createUserMutation.isPending || updateUserMutation.isPending ? (isNewUser ? "Creating..." : "Updating...") : (isNewUser ? "Create User" : "Update User")}
                            </Button>}
                        </div>
                    </form>
                )}
            </CardContent>
        </Card>
    )
} 