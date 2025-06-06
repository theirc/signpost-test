import { supabase } from "./data/db"
import { create } from 'zustand'

interface AppState {
  agentLoading: boolean
  setAgentLoading: (loading: boolean) => void
  agent: Agent | null
  setAgent: (agent: Agent | null) => void
}

export const useAppStore = create<AppState>((set) => ({
  agentLoading: false,
  setAgentLoading: (loading) => set({ agentLoading: loading }),
  agent: null,
  setAgent: (agent) => set({ agent }),
}))

export const app = {
  get agent() {
    return useAppStore.getState().agent
  },
  set agent(value: Agent | null) {
    useAppStore.getState().setAgent(value)
  },
  get state() {
    return {
      get agentLoading() {
        return useAppStore.getState().agentLoading
      },
      set agentLoading(loading: boolean) {
        useAppStore.getState().setAgentLoading(loading)
      }
    }
  },

  async fetchAPIkeys(teamId?: string) {
    if (!teamId) {
      console.error('Error fetching api keys: No team ID provided')
      return {}
    }
    const { data, error } = await supabase.from("api_keys").select("*").eq("team_id", teamId)
    if (error) {
      console.error('Error fetching api keys:', error)
      return {}
    }
    const formattedApiKeys = data?.reduce<APIKeys>((acc, key) => {
      if (key.type && key.key) {
        acc[key.type as keyof APIKeys] = key.key
      }
      return acc
    }, {})
    return formattedApiKeys
  },

  async fetchAPIkey(type: string, teamId?: string) {
    if (!teamId) {
      console.error('Error fetching api key: No team ID provided')
      return {}
    }
    const { data, error } = await supabase.from("api_keys").select("*").eq("team_id", teamId).eq("type", type).single()
    if (error) {
      console.error('Error fetching api key:', error)
      return {}
    }
    return data?.key
  },
}

