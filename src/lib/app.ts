import { supabase } from "./data/db"

export const app = {
  agent: null as Agent,

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

