import { useEffect, useState } from "react"
import { Navigate, useLocation } from "react-router-dom"
import { usePermissions } from "@/lib/hooks/usePermissions"
import React from 'react'
import { getCurrentUser, useUser } from "@/lib/hooks/useUser"



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
  const { data: user, isLoading: userLoading } = useUser()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data, error } = await getCurrentUser()
        if (error || !data || !data.id) {
          setIsAuthenticated(false)
          return
        }
        const authenticated = !!data && !!data.id && !!data.email
        setIsAuthenticated(authenticated)
      } catch (err) {
        console.error("Auth check failed:", err)
        setIsAuthenticated(false)
      }
    }
    checkAuth()
  }, [location.pathname])

  if (isAuthenticated === null || permissionsLoading || userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (resource && action) {
    if (userLoading || !user?.role) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      )
    }
    const hasPerm = hasPermission(resource, action)
    if (!hasPerm) {
      return <Navigate to={fallbackPath} replace />
    }
  }

  return <>{children}</>
} 