import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { supabase } from '@/lib/agents/db'

export function usePaginatedSupabaseTable({
  table,
  page = 0,
  pageSize = 10,
  orderBy = 'created_at',
  orderDirection = 'desc',
  filters = {},
}) {
  return useQuery({
    queryKey: [
      'supabase-table',
      table,
      page,
      pageSize,
      orderBy,
      orderDirection,
      JSON.stringify(filters)
    ],
    queryFn: async () => {
      let query = supabase
        .from(table)
        .select('*', { count: 'exact' })
        .order(orderBy, { ascending: orderDirection === 'asc' })

      Object.entries(filters).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '') return
        if (typeof value === 'string' && value.includes('%')) {
          query = query.ilike(key, value)
        } else if (typeof value === 'object' && value !== null && 'cs' in value) {
          query = query.filter(key, 'cs', value.cs)
        } else {
          query = query.eq(key, value)
        }
      })

      const from = page * pageSize
      const to = from + pageSize - 1
      query = query.range(from, to)

      const { data, error, count } = await query
      if (error) throw new Error(error.message)
      return { data: data || [], total: count || 0 }
    },
    placeholderData: keepPreviousData,
  })
} 