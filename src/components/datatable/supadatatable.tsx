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

type SupabaseFilterBuilder<T> = {
  eq: (column: T, value: any) => SupabaseFilterBuilder<any>
  neq: (column: T, value: any) => SupabaseFilterBuilder<any>
  gt: (column: T, value: any) => SupabaseFilterBuilder<any>
  gte: (column: T, value: any) => SupabaseFilterBuilder<any>
  lt: (column: T, value: any) => SupabaseFilterBuilder<any>
  lte: (column: T, value: any) => SupabaseFilterBuilder<any>
  like: (column: T, pattern: string) => SupabaseFilterBuilder<any>
  ilike: (column: T, pattern: string) => SupabaseFilterBuilder<any>
  is: (column: T, value: null | boolean) => SupabaseFilterBuilder<any>
  in: (column: T, values: any[]) => SupabaseFilterBuilder<any>
  contains: (column: T, value: any) => SupabaseFilterBuilder<any>
  containedBy: (column: T, value: any) => SupabaseFilterBuilder<any>
  rangeGt: (column: T, range: string) => SupabaseFilterBuilder<any>
  rangeGte: (column: T, range: string) => SupabaseFilterBuilder<any>
  rangeLt: (column: T, range: string) => SupabaseFilterBuilder<any>
  rangeLte: (column: T, range: string) => SupabaseFilterBuilder<any>
  rangeAdjacent: (column: T, range: string) => SupabaseFilterBuilder<any>
  overlaps: (column: T, value: any) => SupabaseFilterBuilder<any>
  textSearch: (column: T, query: string, options?: { type?: 'plain' | 'phrase' | 'websearch'; config?: string }) => SupabaseFilterBuilder<any>
  match: (query: T) => SupabaseFilterBuilder<any>
  not: (column: T, operator: string, value: any) => SupabaseFilterBuilder<any>
  or: (filters: string) => SupabaseFilterBuilder<any>
  filter: (column: T, operator: string, value: any) => SupabaseFilterBuilder<any>
}

type KeysOfTableOrView<T extends AllKeys> =
  T extends keyof Database["public"]["Tables"]
  ? keyof Database["public"]["Tables"][T]["Row"]
  : T extends keyof Database["public"]["Views"]
  ? keyof Database["public"]["Views"][T]["Row"]
  : never

type AllKeys = TableKeys | ViewKeys

interface Props<Q extends AllKeys> extends Omit<DataTableProps, "sort"> {
  table: Q
  select?: string
  filter?: (builder: SupabaseFilterBuilder<KeysOfTableOrView<Q>>) => SupabaseFilterBuilder<any>
  sort?: [KeysOfTableOrView<Q>, "asc" | "desc"]
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

export function DataTableSupabase<Q extends AllKeys>(props: Props<Q>) {

  const {
    table,
    select,
    filter = defaultFilter,
    sort,
    realtime,
    realtTimeThrottle = 2000,
    onActionExecuted,
    ...rest
  } = props

  const [realTime, setRealTime] = useState(false)
  const [{ pageIndex: page, pageSize }, setPage] = useMultiState<PaginationData>({ pageIndex: 0, pageSize: 20 })
  const [sortInfo, setSortInfo] = useState<[any, "asc" | "desc"] | null>(sort)
  const update = useForceUpdate()

  const state = useRef({
    loading: true,
    count: 0,
    data: [],
    realTimeListening: false,
    readyForRealTime: false,
    error: "",
    version: 0, //used to force a reload
  })

  async function loadData() {
    let data = []
    let error = null
    let count = 0
    let d = 1000
    let orderBy = sort ? sort : null
    for (let n = 0; n < 10; n++) {
      const { data: rData, error: rError, count: rCount } = await readFromSupabase({ table, select, filter, orderBy, page, pageSize })
      if (!rError) {
        data = rData
        count = rCount
        error = null
        break
      }
      await delay(d)
      console.log(`Retrying ${n + 1}...`)
      d += 1000
      error = rError
    }
    state.current.error = error
    return { data, count, error }
  }

  useEffect(() => {
    // console.log(("Reload"))
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
  }, [table, select, filter, sortInfo, page, pageSize, state.current.version])


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

  async function aexec() {
    console.log("Action Executed")

    state.current.version++
    update()
  }

  return <DataTable
    {...rest as any}
    loading={state.current.loading}
    data={state.current.data}
    sort={sortInfo}
    onPaginationChange={onPaginationChange}
    onSortingChange={onSortingChange}
    total={state.current.count}
    onActionExecuted={onActionExecuted || aexec}
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
