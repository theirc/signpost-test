import { Database } from "@/lib/agents/supabase"
import { DataTable, DataTableProps } from "./datatable"
import { supabase } from "@/lib/data"
import { useForceUpdate, useMultiState } from "@/hooks/use-multistate"
import { useEffect, useRef, useState } from "react"
import { cn, delay } from "@/lib/utils"
import { PaginationState } from "@tanstack/react-table"
import { ToolbarItem } from "./toolbaritem"
import { Clock } from "lucide-react"
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip"

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

interface Props<T = any, Q extends TableKeys = TableKeys> extends Omit<DataTableProps<T>, "sort"> {
  table?: Q
  select?: string
  filter?: (builder: SupabaseFilterBuilder<this["table"]>) => SupabaseFilterBuilder<this["table"]>
  sort?: [keyof Database["public"]["Tables"][Q]["Row"], "asc" | "desc"]
  realtime?: boolean
  realtTimeThrottle?: number
}

async function readFromSupabase({ table, select, filter, orderBy, page, pageSize }: { table: string, select: string, filter: any, orderBy: any, page: number, pageSize: number }) {
  let sbq = supabase.from(table as any).select(select, { count: 'exact' })
  if (orderBy) sbq = sbq.order(orderBy[0] as string, { ascending: orderBy[1] === 'asc' })
  sbq = filter(sbq as any) as any
  const from = page * pageSize
  const to = from + pageSize - 1
  sbq = sbq.range(from, to)
  const { data, error, count } = await sbq
  return { data, count, error }
}


function defaultFilter(q: any) { return q }

export function DataTableSupabase<T = any, Q extends TableKeys = TableKeys>(props: Props<T, Q>) {

  const {
    table,
    select,
    filter = defaultFilter,
    sort,
    realtime,
    realtTimeThrottle = 2000,
    ...rest
  } = props

  const [realTime, setRealTime] = useState(false)
  const [{ pageIndex: page, pageSize }, setPage] = useMultiState<PaginationData>({ pageIndex: 0, pageSize: 20 })
  const [sortInfo, setSortInfo] = useState<[keyof Database["public"]["Tables"][Q]["Row"], "asc" | "desc"] | null>(sort)
  const update = useForceUpdate()

  const state = useRef({
    loading: true,
    count: 0,
    data: [],
    realTimeListening: false,
    readyForRealTime: false,
    error: "",
  })

  async function loadData() {
    let data = []
    let error = null
    let count = 0
    let d = 1000
    let orderBy = sort ? sort : null
    for (let n = 0; n < 10; n++) {
      console.log(`Try ${n + 1}`)
      const { data: rData, error: rError, count: rCount } = await readFromSupabase({ table, select, filter, orderBy, page, pageSize })
      if (!rError) {
        console.log(`Data Ready`)
        data = rData
        count = rCount
        error = null
        break
      }
      console.log(`Awaiting delay ${d}ms`)
      await delay(d)
      console.log(`Retrying`)
      d += 1000
      error = rError
    }
    state.current.error = error
    console.log("Supabase Data", data, error, count)
    return { data, count, error }
  }

  useEffect(() => {
    console.log(("Reload"))
    state.current.loading = true
    update()
    loadData().then(d => {
      if (d.error) return
      state.current.data = d.data
      state.current.count = d.count
      state.current.loading = false
      state.current.readyForRealTime = true
      update()
    })
    // }, [table, select, filter, sort, page, pageSize])
  }, [table, select, filter, sortInfo, page, pageSize])


  useEffect(() => {
    if (!realtime) return
    if (!state.current.readyForRealTime) return
    if (state.current.error) return
    if (!realTime) return
    console.log("Realtime listening")
    const s = supabase.channel('realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table }, async payload => {
        console.log('Change received!', payload)
        if (payload.eventType == "INSERT" && state.current.data) {
          state.current.data = [...state.current.data, payload.new]
          state.current.count++
          update()
        } else if (payload.eventType == "DELETE") {
          state.current.data = state.current.data.filter(d => d.id !== payload.old.id)
        } else if (payload.eventType == "UPDATE") {
          state.current.data = state.current.data.map(d => d.id == payload.new.id ? payload.new : d)
        }
      })
      .subscribe()
    return () => { s.unsubscribe() }
  }, [table, state.current.readyForRealTime, state.current.error, realTime])

  function onPaginationChange(s: PaginationState) {
    state.current.loading = true
    update()
    setPage(s)
  }

  function onSortingChange(field: string, direction: "asc" | "desc" | undefined) {
    setSortInfo((direction ? [field, direction] : null) as any)
  }

  return <DataTable
    {...rest as any}
    loading={state.current.loading}
    data={state.current.data}
    sort={sortInfo}
    onPaginationChange={onPaginationChange}
    onSortingChange={onSortingChange}
    total={state.current.count}
  >
    {props.children}
    {realtime && <ToolbarItem>
      <Tooltip>
        <TooltipTrigger>
          <Clock size={16} strokeWidth={4} onClick={() => setRealTime(!realTime)} className={cn("cursor-pointer stroke-2", { "text-red-500": realTime, "animate-pulse": realTime })} />
        </TooltipTrigger>
        <TooltipContent>
          <p>Realtime: {realTime ? "On" : "Off"}</p>
        </TooltipContent>
      </Tooltip>
    </ToolbarItem>}

  </DataTable>


}
