import { useEffect, useState } from "react"
import { Navigate, useLocation } from "react-router-dom"
import { getCurrentUser } from "@/lib/data/supabaseFunctions"

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const location = useLocation()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data, error } = await getCurrentUser()
        
        if (error) {
          console.error("Auth error:", error)
          setIsAuthenticated(false)
          return
        }

        setIsAuthenticated(!!data)
      } catch (err) {
        console.error("Auth check failed:", err)
        setIsAuthenticated(false)
      }
    }

    checkAuth()
  }, [])

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
} 