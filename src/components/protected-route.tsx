import { useEffect, useState } from "react"
import { Navigate, useLocation } from "react-router-dom"
import { getCurrentUser } from "@/lib/data/supabaseFunctions"
import { usePermissions } from "@/lib/hooks/usePermissions"
import React from 'react'

type PermissionAction = 'create' | 'read' | 'update' | 'delete' | 'share'

interface ProtectedRouteProps {
  children: React.ReactNode
  resource?: string
  action?: PermissionAction
  fallbackPath?: string
}

export function ProtectedRoute({ 
  children, 
  resource, 
  action, 
  fallbackPath = '/settings/roles' 
}: ProtectedRouteProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const location = useLocation()
  const { hasPermission, loading: permissionsLoading } = usePermissions()

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

  if (isAuthenticated === null || permissionsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (resource && action && !hasPermission(resource, action)) {
    return <Navigate to={fallbackPath} replace />
  }

  return <>{children}</>
} 