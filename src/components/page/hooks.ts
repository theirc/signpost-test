import { Database } from "@/lib/agents/supabase"
import { supabase } from "@/lib/data"
import { useForceUpdate } from "@/lib/utils"
import { type Team } from "@/pages/settings/teams"
import { useContext, createContext, useRef, useEffect } from "react"
import { useNavigate, type NavigateFunction } from "react-router-dom"
import { toast } from "sonner"



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

interface DatabaseItemHook<T extends TableKeys> {
  data: Database["public"]["Tables"][T]["Row"]
  loading: boolean
  error: Error
  id: any
  create: (item: Database["public"]["Tables"][T]["Insert"]) => Promise<Database["public"]["Tables"][T]["Row"]>
  update: (item: Database["public"]["Tables"][T]["Update"]) => Promise<Database["public"]["Tables"][T]["Row"]>
  submit: (item: Database["public"]["Tables"][T]["Update"]) => Promise<Database["public"]["Tables"][T]["Row"]>
  remove: () => Promise<void>
  toastSuccess: () => void
  navigate: NavigateFunction
}

export function useDatabaseItem<T extends TableKeys>(table: T, id?: any): DatabaseItemHook<T> {

  type ItemType = Database["public"]["Tables"][T]["Row"]

  const state = useRef({
    data: {} as any,
    loading: true,
    error: null,
  })
  const forceUpdate = useForceUpdate()
  const navigate = useNavigate()

  const { id: ctxId, config: { title } } = usePage()
  if (!id) id = ctxId

  useEffect(() => {
    if (!id) {
      state.current.loading = false
      return
    }
    supabase.from(table).select('*').eq('id', id).single().then(({ data, error }) => {
      state.current.data = data
      state.current.error = error
      state.current.loading = false
      forceUpdate()
    })
  }, [table, id])


  async function create(item: ItemType): Promise<any> {
    const s = await supabase.from(table).insert(item as any).select()
    return s
  }
  async function update(item: ItemType): Promise<any> {
    const s = await supabase.from(table).update(item as any).eq('id', id).select()
    return s
  }
  async function remove(): Promise<void> {
    await supabase.from(table).delete().eq('id', id)
  }
  async function submit(item: ItemType): Promise<any> {
    console.log("Submit: ", item)

    if (id) {
      return update(item)
    } else {
      return create(item)
    }
  }

  const toastSuccess = () => {
    toast(`The ${title || "Item"} was ${id ? "updated" : "created"} successfully`, {
      action: {
        label: "Ok",
        onClick: () => console.log("Ok"),
      },
    })
  }


  return {
    data: state.current.data,
    loading: state.current.loading,
    error: state.current.error,
    id,
    create,
    update,
    remove,
    toastSuccess,
    navigate,
    submit,
  }
}