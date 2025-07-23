import { useQuery } from '@tanstack/react-query'
import { supabase } from '../agents/db'

export const getCurrentUser = async () => {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

  if (sessionError || !sessionData?.session) {
    return { data: null, error: sessionError }
  }

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

  const userData = {
    ...authData.user,
    ...publicUserData,
    email: authData.user.email,
    role: publicUserData.roles?.id,
    role_name: publicUserData.roles?.name,
    teams: userTeams.map(ut => ut.teams)
  }

  return {
    data: userData,
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
    staleTime: 15 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
  })
} 