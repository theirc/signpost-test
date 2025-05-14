import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useUser } from './useUser'
import { useEffect } from 'react'
import { useSupabase } from '@/hooks/use-supabase'

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
    const queryClient = useQueryClient()
    const { data: user, isLoading: userLoading } = useUser()

    const { data: permissions = [], isLoading: permissionsLoading } = useQuery<Permission[]>({
        queryKey: ['permissions', user?.role],
        queryFn: async () => {
            if (!user?.role) return []
            const { data: role } = await useSupabase().from("roles").select("permissions").eq("id", user.role).single()
            return role?.permissions || []
        },
        enabled: !!user?.role,
        staleTime: 5 * 60 * 1000, // Cache for 5 minutes
        gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
        refetchOnWindowFocus: false, // Don't refetch on window focus
        refetchOnMount: false, // Don't refetch on mount
        refetchOnReconnect: false, // Don't refetch on reconnect
    })

    // Only invalidate permissions when user's role actually changes
    useEffect(() => {
        if (user?.role) {
            queryClient.invalidateQueries({ 
                queryKey: ['permissions', user.role],
                exact: true // Only invalidate exact match
            })
        }
    }, [user?.role, queryClient])

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