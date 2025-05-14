import { useSupabase } from '@/hooks/use-supabase'
import { useQuery, useQueryClient } from '@tanstack/react-query'

export const getCurrentUser = async () => {
  const { data: authData, error: authError } = await useSupabase().auth.getUser()

  if (authError || !authData?.user) {
    return { data: null, error: authError }
  }

  const { data: publicUserData, error: publicUserError } = await useSupabase()
    .from('users')
    .select(`
      *,
      roles:role (*),
      teams:team (*)
    `)
    .eq('id', authData.user.id)
    .single()

  if (publicUserError) {
    return { data: authData.user, error: publicUserError }
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
}
export function useUser() {
  const queryClient = useQueryClient()

  return useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const { data, error } = await getCurrentUser()
      if (error) throw error
      return data
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnMount: false, // Don't refetch on mount
    refetchOnReconnect: false, // Don't refetch on reconnect
  })
} 