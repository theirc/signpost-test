import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { supabase } from '@/lib/agents/db'
import { Database } from '@/lib/agents/supabase'

type OrderDirections = 'asc' | 'desc'

type TableKeys = keyof Database["public"]["Tables"]

interface SupabaseTableProps<TK extends TableKeys> {
  table: TK
  page?: number
  pageSize?: number
  orderBy?: string
  orderDirection?: OrderDirections
  filters?: any
}

export function usePaginatedSupabaseTable<TK extends TableKeys = any>({ table, page = 0, pageSize = 10, orderBy = 'created_at', orderDirection = 'desc' as OrderDirections, filters = {}, }: SupabaseTableProps<TK>) {

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

      let query = supabase.from(table as any).select('*', { count: 'exact' }).order(orderBy, { ascending: orderDirection === 'asc' })

      Object.entries(filters).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '') return
        if (typeof value === 'string' && value.includes('%')) {
          query = query.ilike(key, value)
        } else if (typeof value === 'object' && value !== null && 'cs' in value) {
          query = query.filter(key, 'cs', value.cs)
        } else {
          query = (query as any).eq(key, value)
        }
      })

      const from = page * pageSize
      const to = from + pageSize - 1
      query = query.range(from, to)

      const { data, error, count } = await query
      let result: Database["public"]["Tables"][TK]["Row"][] = (data || []) as any
      let errorResult: string = null
      if (error) errorResult = error.message

      return ({ data: result || [], total: count || 0, error: errorResult })
    },
    placeholderData: keepPreviousData,
  })
} 