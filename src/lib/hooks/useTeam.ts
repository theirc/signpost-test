import { create } from 'zustand'
import { Team } from '@/lib/data/supabaseFunctions'

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