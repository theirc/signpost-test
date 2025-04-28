import { useTeamStore } from "@/lib/hooks/useTeam"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { getUserTeams, getCurrentUser } from "@/lib/data/supabaseFunctions"
import { Loader2 } from "lucide-react"

export function TeamLoading() {
  const { selectedTeam, setSelectedTeam } = useTeamStore()
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const loadTeams = async () => {
      try {
        const { data: userData, error: userError } = await getCurrentUser()
        if (userError || !userData) {
          console.error('Error fetching user:', userError)
          return
        }

        const { data, error } = await getUserTeams(userData.id)
        if (error) {
          console.error('Error fetching user teams:', error)
          return
        }

        if (data.length > 0 && !selectedTeam) {
          setSelectedTeam(data[0])
        }
      } catch (error) {
        console.error('Error loading teams:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadTeams()
  }, [])

  useEffect(() => {
    if (!isLoading && !selectedTeam) {
      navigate('/settings/teams')
    }
  }, [isLoading, selectedTeam])

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-lg font-medium">Loading your workspace...</p>
        </div>
      </div>
    )
  }

  return null
} 