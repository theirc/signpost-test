import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useNavigate, useLocation } from "react-router-dom"
import { Outlet } from "react-router-dom"
import { usePermissions } from "@/lib/hooks/usePermissions"

export function SettingsLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const currentPath = location.pathname.split("/")[2]
  const { canRead } = usePermissions()

  return (
    <div className="flex flex-col h-full">
      <div className="border-b">
        <div className="px-8 py-6">
          <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        </div>
        <Tabs value={currentPath} className="px-8">
          <TabsList>
            {canRead("projects") && (
              <TabsTrigger value="projects" onClick={() => navigate("/settings/projects")}>
                Projects
              </TabsTrigger>
            )}
            {canRead("teams") && (
              <TabsTrigger value="teams" onClick={() => navigate("/settings/teams")}>
                Teams
              </TabsTrigger>
            )}
            {canRead("users") && (
              <TabsTrigger value="users" onClick={() => navigate("/settings/users")}>
                Users
              </TabsTrigger>
            )}
            {canRead("billing") && (
              <TabsTrigger value="billing" onClick={() => navigate("/settings/billing")}>
                Billing
              </TabsTrigger>
            )}
            {canRead("usage") && (
              <TabsTrigger value="usage" onClick={() => navigate("/settings/usage")}>
                Usage
              </TabsTrigger>
            )}
            {canRead("roles") && (
              <TabsTrigger value="roles" onClick={() => navigate("/settings/roles")}>
                Access Control
              </TabsTrigger>
            )}
          </TabsList>
        </Tabs>
      </div>
      <div className="flex-1 p-8">
        <Outlet />
      </div>
    </div>
  )
} 