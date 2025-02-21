import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useNavigate, useLocation } from "react-router-dom"
import { Outlet } from "react-router-dom"

export function SettingsLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const currentPath = location.pathname.split("/").pop()

  return (
    <div className="flex flex-col h-full">
      <div className="border-b">
        <div className="px-8 py-6">
          <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        </div>
        <Tabs value={currentPath} className="px-8">
          <TabsList>
            <TabsTrigger value="projects" onClick={() => navigate("/settings/projects")}>
              Projects
            </TabsTrigger>
            <TabsTrigger value="team" onClick={() => navigate("/settings/team")}>
              Team
            </TabsTrigger>
            <TabsTrigger value="billing" onClick={() => navigate("/settings/billing")}>
              Billing
            </TabsTrigger>
            <TabsTrigger value="usage" onClick={() => navigate("/settings/usage")}>
              Usage
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      <div className="flex-1 p-8">
        <Outlet />
      </div>
    </div>
  )
} 