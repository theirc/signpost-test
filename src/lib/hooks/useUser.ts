import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getCurrentUser } from '@/lib/data/supabaseFunctions'

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