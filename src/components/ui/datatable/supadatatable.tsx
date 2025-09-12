import { Database } from "@/lib/agents/supabase"
import { DataTable, DataTableProps } from "./datatable"
import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/data"
import { useForceUpdate, useMultiState } from "@/hooks/use-multistate"
import { useEffect, useRef } from "react"
import throttle from "lodash/throttle"

type TableKeys = keyof Database["public"]["Tables"]
type SupabaseFilterBuilder<T extends TableKeys> = {
  eq: (column: keyof Database["public"]["Tables"][T]["Row"], value: any) => SupabaseFilterBuilder<T>
  neq: (column: keyof Database["public"]["Tables"][T]["Row"], value: any) => SupabaseFilterBuilder<T>
  gt: (column: keyof Database["public"]["Tables"][T]["Row"], value: any) => SupabaseFilterBuilder<T>
  gte: (column: keyof Database["public"]["Tables"][T]["Row"], value: any) => SupabaseFilterBuilder<T>
  lt: (column: keyof Database["public"]["Tables"][T]["Row"], value: any) => SupabaseFilterBuilder<T>
  lte: (column: keyof Database["public"]["Tables"][T]["Row"], value: any) => SupabaseFilterBuilder<T>
  like: (column: keyof Database["public"]["Tables"][T]["Row"], pattern: string) => SupabaseFilterBuilder<T>
  ilike: (column: keyof Database["public"]["Tables"][T]["Row"], pattern: string) => SupabaseFilterBuilder<T>
  is: (column: keyof Database["public"]["Tables"][T]["Row"], value: null | boolean) => SupabaseFilterBuilder<T>
  in: (column: keyof Database["public"]["Tables"][T]["Row"], values: any[]) => SupabaseFilterBuilder<T>
  contains: (column: keyof Database["public"]["Tables"][T]["Row"], value: any) => SupabaseFilterBuilder<T>
  containedBy: (column: keyof Database["public"]["Tables"][T]["Row"], value: any) => SupabaseFilterBuilder<T>
  rangeGt: (column: keyof Database["public"]["Tables"][T]["Row"], range: string) => SupabaseFilterBuilder<T>
  rangeGte: (column: keyof Database["public"]["Tables"][T]["Row"], range: string) => SupabaseFilterBuilder<T>
  rangeLt: (column: keyof Database["public"]["Tables"][T]["Row"], range: string) => SupabaseFilterBuilder<T>
  rangeLte: (column: keyof Database["public"]["Tables"][T]["Row"], range: string) => SupabaseFilterBuilder<T>
  rangeAdjacent: (column: keyof Database["public"]["Tables"][T]["Row"], range: string) => SupabaseFilterBuilder<T>
  overlaps: (column: keyof Database["public"]["Tables"][T]["Row"], value: any) => SupabaseFilterBuilder<T>
  textSearch: (column: keyof Database["public"]["Tables"][T]["Row"], query: string, options?: { type?: 'plain' | 'phrase' | 'websearch'; config?: string }) => SupabaseFilterBuilder<T>
  match: (query: Partial<Database["public"]["Tables"][T]["Row"]>) => SupabaseFilterBuilder<T>
  not: (column: keyof Database["public"]["Tables"][T]["Row"], operator: string, value: any) => SupabaseFilterBuilder<T>
  or: (filters: string) => SupabaseFilterBuilder<T>
  filter: (column: keyof Database["public"]["Tables"][T]["Row"], operator: string, value: any) => SupabaseFilterBuilder<T>
}

interface Props<T = any, Q extends TableKeys = TableKeys> extends DataTableProps<T> {
  table?: Q
  select?: string
  filter?: (builder: SupabaseFilterBuilder<this["table"]>) => SupabaseFilterBuilder<this["table"]>
  orderBy?: [keyof Database["public"]["Tables"][Q]["Row"], "asc" | "desc"]
  realtime?: boolean
  realtTimeThrottle?: number
}

function defaultFilter(q: any) { return q }

export function DataTableSupabase<T = any, Q extends TableKeys = TableKeys>(props: Props<T, Q>) {

  const {
    table,
    select,
    filter = defaultFilter,
    orderBy,
    realtime,
    realtTimeThrottle = 1000,
    ...rest
  } = props

  const [{ pageIndex: page, pageSize }, setPage] = useMultiState<PaginationData>({ pageIndex: 0, pageSize: 20 })
  const update = useForceUpdate()

  const tableState = useRef({
    loading: true,
    count: 0,
    data: [],
    realTimeListening: false,
  })

  async function loadData() {
    let sbq = supabase.from(table).select(select, { count: 'exact' })
    if (orderBy) sbq = sbq.order(orderBy[0] as string, { ascending: orderBy[1] === 'asc' })
    sbq = filter(sbq as any) as any
    const from = page * pageSize
    const to = from + pageSize - 1
    sbq = sbq.range(from, to)
    const { data, error, count } = await sbq
    console.log("Supabase Data", data, error, count)
    return { data, count }
  }

  const uprt = throttle(async () => {
    console.log("Realtime update throttled")
    if (tableState.current.loading) return
    const { data, count } = await loadData()
    tableState.current.data = data
    tableState.current.count = count
    update()
  }, realtTimeThrottle, { trailing: true })

  useEffect(() => {
    console.log(("Reload"))
    tableState.current.loading = true
    update()
    loadData().then(d => {
      tableState.current.data = d.data
      tableState.current.count = d.count
      tableState.current.loading = false
      update()
    })
  }, [table, select, filter, orderBy, page, pageSize])


  useEffect(() => {
    if (!realtime) return
    // if (tableState.current.realTimeListening) return
    // tableState.current.realTimeListening = true
    console.log("Realtime listening")
    const s = supabase.channel('realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table }, async payload => {
        console.log('Change received!', payload)
        await uprt()
      })
      .subscribe()
    return () => { s.unsubscribe() }
  }, [table])


  return <DataTable
    {...rest as any}
    loading={tableState.current.loading}
    data={tableState.current.data}
    onPaginationChange={setPage}
    total={tableState.current.count}
  />


}

// function DataTableSupabaseOLD<T = any, Q extends TableKeys = TableKeys>(props: Props<T, Q>) {

//   const {
//     table,
//     select,
//     filter = (q) => q,
//     orderBy,
//     staleTime,
//     ...rest
//   } = props

//   const [{ pageIndex: page, pageSize }, setPage] = useMultiState<PaginationData>({ pageIndex: 0, pageSize: 20 })
//   const countState = useRef(0)

//   const { data: qd, status } = useQuery({
//     queryKey: [
//       'supabase-table',
//       table,
//       page,
//       pageSize,
//       select,
//     ],
//     queryFn: async () => {
//       console.log("usequery")
//       let sbq = supabase.from(table).select(select, { count: 'exact' })//.order()
//       if (orderBy) sbq = sbq.order(orderBy[0] as string, { ascending: orderBy[1] === 'asc' })
//       sbq = filter(sbq as any) as any
//       const from = page * pageSize
//       const to = from + pageSize - 1
//       sbq = sbq.range(from, to)
//       const { data, error, count } = await sbq
//       console.log("Supa", data, error, count)
//       return { data, count }
//     },
//     // staleTime,
//     placeholderData: keepPreviousData,
//   })

//   const total = qd?.count || countState.current
//   countState.current = total
//   console.log(status)

//   function onPaginationChange(p: PaginationData) {
//     console.log("onPaginationChange", p)

//     setPage(p)
//   }

//   return <DataTable
//     {...rest as any}
//     loading={status === "pending"}
//     data={qd?.data || []}
//     onPaginationChange={onPaginationChange}
//     total={total}
//   />


// }