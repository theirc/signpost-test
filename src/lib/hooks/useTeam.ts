import { Team } from '@/pages/settings/teams'
import { create } from 'zustand'

interface TeamStore {
  selectedTeam: Team | null
  setSelectedTeam: (team: Team | null) => void
}

// Get initial team from localStorage
const getInitialTeam = () => {
  if (typeof window === 'undefined') return null
  const savedTeam = localStorage.getItem('selectedTeam')
  return savedTeam ? JSON.parse(savedTeam) : null
}

export const useTeamStore = create<TeamStore>((set) => ({
  selectedTeam: getInitialTeam(),
  setSelectedTeam: (team) => {
    if (team) {
      localStorage.setItem('selectedTeam', JSON.stringify(team))
    } else {
      localStorage.removeItem('selectedTeam')
    }
    set({ selectedTeam: team })
  },
})) 

export function switchToTeam(team: Team | null) {
  const { setSelectedTeam } = useTeamStore.getState()
  setSelectedTeam(team)
}

export async function getTeamById(teamId: string): Promise<Team | null> {
  try {
    const { supabase } = await import('../agents/db')
    const { data, error } = await supabase
      .from('teams')
      .select('id, name, description, status, created_at')
      .eq('id', teamId)
      .single()

    if (error || !data) {
      return null
    }

    return data as Team
  } catch {
    return null
  }
}

// Utility to switch the current workspace to the team that owns a given agent
export async function switchWorkspaceToAgentTeam(agentId: number): Promise<Team | null> {
  try {
    const { supabase } = await import('../agents/db')
    const { data, error } = await supabase
      .from('agents')
      .select('team_id')
      .eq('id', agentId)
      .single()

    if (error || !data?.team_id) {
      return null
    }

    const team = await getTeamById(data.team_id)
    if (team) {
      switchToTeam(team)
    }
    return team
  } catch {
    return null
  }
}