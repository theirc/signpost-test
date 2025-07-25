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
            if (!user?.role) {
                return []
            }
            const { data: role, error } = await supabase.from("roles").select("permissions").eq("id", user.role).single()
            if (error) {
                return []
            }
            return ((role?.permissions || []) as unknown) as Permission[]
        },
        enabled: !!user?.role && !userLoading,
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchOnReconnect: false,
    })

    const hasPermission = (resource: string, action: PermissionAction): boolean => {
        if (userLoading || permissionsLoading) {
            return false
        }
        if (!user?.role) {
            return false
        }
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