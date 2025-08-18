import { useState } from "react"

export interface TelerivetProject {
  id: string
  name: string
  default_route_id: string
  timezone_id: string
}

export function useTelerivetProjects() {
  const [isLoading, setIsLoading] = useState(false)
  const [projects, setProjects] = useState<TelerivetProject[]>([])
  const [error, setError] = useState("")

  const fetchProjects = async (apiKey: string) => {
    if (!apiKey.trim()) {
      setError("Please enter an API key")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      // Use the proxy API to avoid CORS issues
      const response = await fetch('/api/axiosFetch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url: 'https://api.telerivet.com/v1/projects',
          method: 'GET',
          headers: {
            'Authorization': `Basic ${btoa(apiKey + ':')}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        })
      })

      if (response.ok) {
        const result = await response.json()
        if (result?.error) {
          throw new Error(`API error: ${result.error} ${result.message || ''}`)
        }
        
        const projectsData = result?.data?.data || []
        setProjects(projectsData)
        
        if (projectsData.length === 0) {
          setError("No projects found. Please check your API key and ensure you have projects in your Telerivet account.")
        }
      } else {
        const errorText = await response.text()
        throw new Error(`Failed to fetch projects: ${response.status} - ${errorText}`)
      }
    } catch (error: any) {
      console.error('Error fetching projects:', error)
      setError(error.message || 'Failed to fetch projects')
    } finally {
      setIsLoading(false)
    }
  }

  const clearError = () => setError("")
  const clearProjects = () => setProjects([])

  return {
    projects,
    isLoading,
    error,
    fetchProjects,
    clearError,
    clearProjects
  }
} 