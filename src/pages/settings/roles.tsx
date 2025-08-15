import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Plus, Eye, Pencil, Trash2, Share2 } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { supabase } from "@/lib/agents/db"
import { Json } from "@/lib/agents/supabase"
import { useTeamStore } from "@/lib/hooks/useTeam"
import { usePermissions } from "@/lib/hooks/usePermissions"

interface Permission {
    resource: string
    create: boolean
    read: boolean
    update: boolean
    delete: boolean
    share: boolean
}

interface RoleFormData {
    name: string
    description: string
    permissions: Permission[]
}

const APP_RESOURCES = [
    { id: 'agents', label: 'Agents' },
    { id: 'templates', label: 'Templates' },
    { id: 'bots', label: 'Bots' },
    { id: 'prompts', label: 'System Prompts' },
    { id: 'playground', label: 'Playground' },
    { id: 'logs', label: 'Logs' },
    { id: 'scores', label: 'Scores' },
    { id: 'collections', label: 'Collections' },
    { id: 'sources', label: 'Data Sources' },
    { id: 'projects', label: 'Projects' },
    { id: 'teams', label: 'Teams' },
    { id: 'billing', label: 'Billing' },
    { id: 'usage', label: 'Usage' },
    { id: 'roles', label: 'Roles' },
    { id: 'users', label: 'Users' },
    { id: 'apikeys', label: 'Api Keys' },
]

type PermissionAction = 'create' | 'read' | 'update' | 'delete' | 'share'

const PERMISSION_ICONS: Record<PermissionAction, any> = {
    create: Plus,
    read: Eye,
    update: Pencil,
    delete: Trash2,
    share: Share2
}

export function RoleForm() {
    const { toast } = useToast()
    const navigate = useNavigate()
    const { id } = useParams()
    const isNewRole = id === 'new'
    const { selectedTeam } = useTeamStore()
    const [loading, setLoading] = useState(false)
    const [isFetching, setIsFetching] = useState(false)
    const { canCreate, canUpdate } = usePermissions()
    const [formData, setFormData] = useState<RoleFormData>({
        name: "",
        description: "",
        permissions: APP_RESOURCES.map(resource => ({
            resource: resource.id,
            create: false,
            read: false,
            update: false,
            delete: false,
            share: false
        }))
    })

    useEffect(() => {
        const loadData = async () => {
            setIsFetching(true)
            if (id && !isNewRole) {
                const { data: role, error } = await supabase.from("roles").select("*").eq("id", id).single()
                if (error) {
                    console.error("Error loading role:", error)
                    toast({
                        title: "Error",
                        description: "Failed to load role data",
                        variant: "destructive"
                    })
                } else if (role) {
                    setFormData({
                        name: role.name,
                        description: role.description,
                        permissions: role.permissions as unknown as Permission[] || APP_RESOURCES.map(resource => ({
                            resource: resource.id,
                            create: false,
                            read: false,
                            update: false,
                            delete: false,
                            share: false
                        })) as Permission[]
                    })
                }
            }
            setIsFetching(false)
        }
        loadData()
    }, [id, isNewRole, toast])

    const handlePermissionChange = (resource: string, action: PermissionAction, value: boolean) => {
        setFormData(prev => ({
            ...prev,
            permissions: prev.permissions.map(permission =>
                permission.resource === resource
                    ? { ...permission, [action]: value }
                    : permission
            )
        }))
    }

    const handleSelectAll = (resource: string, value: boolean) => {
        setFormData(prev => ({
            ...prev,
            permissions: prev.permissions.map(permission =>
                permission.resource === resource
                    ? {
                        ...permission,
                        create: value,
                        read: value,
                        update: value,
                        delete: value,
                        share: value
                    }
                    : permission
            )
        }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            if (isNewRole) {
                const { error } = await supabase.from("roles").insert({
                    name: formData.name,
                    description: formData.description,
                    permissions: formData.permissions as unknown as Json[],
                    teams_id: [selectedTeam?.id]
                }).select().single()

                if (error) {
                    toast({
                        title: "Error creating role",
                        description: error.message,
                        variant: "destructive"
                    })
                    return
                }

                toast({
                    title: "Role created successfully",
                    description: "The new role has been created."
                })
            } else if (id) {
                const { error } = await supabase.from("roles").update({
                    name: formData.name,
                    description: formData.description,
                    permissions: formData.permissions as unknown as Json[]
                }).eq("id", id).select().single()

                if (error) {
                    toast({
                        title: "Error updating role",
                        description: error.message,
                        variant: "destructive"
                    })
                    return
                }

                toast({
                    title: "Role updated successfully",
                    description: "The role has been updated."
                })
            }

            navigate('/settings/roles')
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
                    <CardTitle>{isNewRole ? "Create New Role" : "Edit Role"}</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="name">Role Name</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Input
                                id="description"
                                value={formData.description}
                                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            />
                        </div>

                        <div className="space-y-4">
                            <Label>Permissions</Label>
                            <div className="border rounded-lg p-4">
                                <table className="w-full">
                                    <thead>
                                        <tr>
                                            <th className="text-left py-2">Resource</th>
                                            <th className="text-center py-2">
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <div className="flex items-center justify-center space-x-2">
                                                                <Plus className="h-4 w-4" />
                                                            </div>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>Create new items</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            </th>
                                            <th className="text-center py-2">

                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <div className="flex items-center justify-center space-x-2">
                                                                <Eye className="h-4 w-4" />
                                                            </div>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>View items</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            </th>
                                            <th className="text-center py-2">

                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <div className="flex items-center justify-center space-x-2">
                                                                <Pencil className="h-4 w-4" />
                                                            </div>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>Edit items</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            </th>
                                            <th className="text-center py-2">

                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <div className="flex items-center justify-center space-x-2">
                                                                <Trash2 className="h-4 w-4" />
                                                            </div>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>Delete items</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            </th>
                                            <th className="text-center py-2">

                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <div className="flex items-center justify-center space-x-2">
                                                                <Share2 className="h-4 w-4" />
                                                            </div>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>Share</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            </th>
                                            <th className="text-center py-2">
                                                <div className="flex items-center justify-center space-x-2">
                                                    <Checkbox
                                                        id="select-all-permissions"
                                                        checked={formData.permissions.every(p =>
                                                            p.create && p.read && p.update && p.delete && p.share
                                                        )}
                                                        onCheckedChange={(checked) => {
                                                            if (id === "12219f26-0293-4954-8dbd-c5ba3ecc2b14") {
                                                                return
                                                            }
                                                            setFormData(prev => ({
                                                                ...prev,
                                                                permissions: prev.permissions.map(permission => ({
                                                                    ...permission,
                                                                    create: checked as boolean,
                                                                    read: checked as boolean,
                                                                    update: checked as boolean,
                                                                    delete: checked as boolean,
                                                                    share: checked as boolean
                                                                }))
                                                            }))
                                                        }}
                                                    />
                                                    <Label htmlFor="select-all-permissions">Select All</Label>
                                                </div>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {APP_RESOURCES.map(resource => {
                                            const permission = formData.permissions.find(p => p.resource === resource.id)
                                            return (
                                                <tr key={resource.id} className="border-t">
                                                    <td className="py-2">
                                                        <Label className="font-medium">{resource.label}</Label>
                                                    </td>
                                                    {Object.entries(PERMISSION_ICONS).map(([action, Icon]) => {
                                                        const permissionAction = action as PermissionAction
                                                        const isChecked = Boolean(permission?.[permissionAction])
                                                        const disabled = (id === "12219f26-0293-4954-8dbd-c5ba3ecc2b14" || !canUpdate("roles") || !canCreate("roles"))
                                                        return (
                                                            <td key={action} className="text-center py-2">
                                                                <Checkbox
                                                                    id={`${resource.id}-${action}`}
                                                                    checked={isChecked}
                                                                    onCheckedChange={(checked) => handlePermissionChange(resource.id, permissionAction, checked as boolean)}
                                                                    disabled={disabled}
                                                                />
                                                            </td>
                                                        )
                                                    })}
                                                    <td className="text-center py-2">
                                                        <div className="flex items-center justify-center space-x-2">
                                                            <Checkbox
                                                                id={`select-all-${resource.id}`}
                                                                checked={permission?.create && permission?.read && permission?.update && permission?.delete && permission?.share}
                                                                onCheckedChange={(checked) => handleSelectAll(resource.id, checked as boolean)}
                                                                disabled={id === "12219f26-0293-4954-8dbd-c5ba3ecc2b14"}
                                                            />
                                                            <Label htmlFor={`select-all-${resource.id}`}>Select All</Label>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="flex justify-end space-x-4">
                            <Button
                                type="button"
                                variant="outline"
                                className="rounded-lg"
                                onClick={() => navigate("/settings/roles")}
                                disabled={loading}
                            >
                                Cancel
                            </Button>
                            {(canCreate("roles") || canUpdate("roles")) && <Button type="submit" className="rounded-lg" disabled={loading || id === "12219f26-0293-4954-8dbd-c5ba3ecc2b14"}>
                                {loading ? (isNewRole ? "Creating..." : "Updating...") : (isNewRole ? "Create Role" : "Update Role")}
                            </Button>}
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}