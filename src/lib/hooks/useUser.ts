import { useQuery } from '@tanstack/react-query'
import { supabase } from '../agents/db'

export const getCurrentUser = async () => {
  const { data: authData, error: authError } = await supabase.auth.getUser()

  if (authError || !authData?.user) {
    return { data: null, error: authError }
  }

  const { data: publicUserData, error: publicUserError } = await supabase
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

  const { data: userTeams, error: userTeamsError } = await supabase
    .from('user_teams')
    .select('teams!inner(*)')
    .eq('user_id', authData.user.id)

  if (userTeamsError) {
    return { data: authData.user, error: userTeamsError }
  }

  return {
    data: {
      ...authData.user,
      ...publicUserData,
      role_name: publicUserData.roles?.name,
      teams: userTeams.map(ut => ut.teams)
    },
    error: null
  }
}
export function useUser() {
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