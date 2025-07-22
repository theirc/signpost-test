import { useQuery } from '@tanstack/react-query'
import { useUser } from './useUser'
import { supabase } from '../agents/db'

type PermissionAction = 'create' | 'read' | 'update' | 'delete' | 'share'

interface Permission {
    resource: string
    create: boolean
    read: boolean
    update: boolean
    delete: boolean
    share: boolean
}

export function usePermissions() {
    const { data: user, isLoading: userLoading } = useUser()

    const { data: permissions = [], isLoading: permissionsLoading } = useQuery<Permission[]>({
        queryKey: ['permissions', user?.role],
        queryFn: async () => {
            if (!user?.role) return []
            const { data: role } = await supabase.from("roles").select("permissions").eq("id", user.role).single()
            return ((role?.permissions || []) as unknown) as Permission[]
        },
        enabled: !!user?.role,
        staleTime: 5 * 60 * 1000, // Cache for 5 minutes
        gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
        refetchOnWindowFocus: false, // Don't refetch on window focus
        refetchOnMount: false, // Don't refetch on mount
        refetchOnReconnect: false, // Don't refetch on reconnect
    })

    const hasPermission = (resource: string, action: PermissionAction): boolean => {
        if (userLoading || permissionsLoading) return false
        const resourcePermission = permissions.find(p => p.resource === resource)
        return resourcePermission ? resourcePermission[action] : false
    }

    const canCreate = (resource: string): boolean => hasPermission(resource, 'create')
    const canRead = (resource: string): boolean => hasPermission(resource, 'read')
    const canUpdate = (resource: string): boolean => hasPermission(resource, 'update')
    const canDelete = (resource: string): boolean => hasPermission(resource, 'delete')
    const canShare = (resource: string): boolean => hasPermission(resource, 'share')

    return {
        permissions,
        hasPermission,
        canCreate,
        canRead,
        canUpdate,
        canDelete,
        canShare,
        loading: userLoading || permissionsLoading
    }
} 