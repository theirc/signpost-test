import { Database } from "@/lib/agents/supabase"
import { supabase } from "@/lib/data"
import { useForceUpdate } from "@/lib/utils"
import { type Team } from "@/pages/settings/teams"
import { useQuery } from "@tanstack/react-query"
import { useContext, createContext, useRef, useEffect } from "react"
import { type NavigateFunction } from "react-router-dom"



declare global {

  interface User {
    created_at?: string
    description?: string
    email?: string
    first_name?: string
    id?: string
    language?: any
    last_name?: string
    location?: string
    role?: string
    status?: string
    team?: string
    title?: string
    roles?: {
      created_at?: string
      description?: string
      id?: string
      name?: string
      permissions?: any[]
      team_id?: string
      teams_id?: string[]
    }
    teams: {
      created_at?: string
      description?: string
      id?: string
      name?: string
      status?: string
    }
  }

  interface PageContextValues {
    config: PageConfig
    id: any
    navigate: NavigateFunction
    team: Team
    user: User
  }

}
export const PageContext = createContext(null)

export function usePage() {
  return useContext<PageContextValues>(PageContext)
}

export function useDatabaseItem<T extends TableKeys>(table: T, id?: any): { data: Database["public"]["Tables"][T]["Row"], loading: boolean, error: Error, id: any } {

  const state = useRef({
    data: null,
    loading: true,
    error: null,
  })
  const update = useForceUpdate()

  const { id: ctxId } = usePage()
  if (!id) id = ctxId
  // if (!id) throw new Error("No ID provided to useDatabaseItem and no ID in PageContext")

  useEffect(() => {
    if (!id) {
      state.current.loading = false
      return
    }
    supabase.from(table).select('*').eq('id', id).single().then(({ data, error }) => {
      state.current.data = data
      state.current.error = error
      state.current.loading = false
      update()
    })

    // const { data, error } = await supabase.from(table).select('*').eq('id', id).single()
    // if (error) throw error
    // return data as any
  }, [table, id])


  // const { data, isLoading, error } = useQuery({
  //   queryKey: [`${table}_item_data`],
  //   queryFn: async () => {
  //     if (!id) return null
  //     const { data, error } = await supabase.from(table).select('*').eq('id', id).single()
  //     if (error) throw error
  //     return data as any
  //   },
  //   staleTime: 1000,
  //   refetchOnWindowFocus: true,
  //   refetchOnMount: true,
  //   refetchOnReconnect: true,
  // })

  return { data: state.current.data, loading: state.current.loading, error: state.current.error, id }
}