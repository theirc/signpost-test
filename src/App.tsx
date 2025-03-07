import { AppSidebar } from "@/components/app-sidebar"
import { FlowDesigner } from "@/components/flow/flow"
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from "@/components/ui/breadcrumb"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@radix-ui/react-separator"
import { BrowserRouter, Route, Routes, useLocation, Link, useNavigate } from "react-router-dom"
import Chat from "./pages/chat"
import { CollectionsManagement } from "./pages/knowledge"
import { BotLogsTable } from "./pages/logs"
import { BotManagement } from "./pages/bots"
import Sources from './pages/sources.tsx'
import { SettingsLayout } from "./pages/settings/layout"
import { ProjectsSettings } from "./pages/settings/projects"
import { TeamSettings } from "./pages/settings/team"
import { UsageSettings } from "./pages/settings/usage"
import { BillingSettings } from "./pages/settings/billing"
import { Users } from "./pages/settings/users"
import { AccessControlSettings } from "./pages/settings/access-control"
import { Roles } from "./pages/settings/roles"
import { AgentList } from "./pages/flow/agents.tsx"
import { Agent } from "./pages/flow/agent.tsx"

const routeNames: Record<string, string> = {
  '/': 'Designer',
  '/chat': 'Playground',
  '/rag': 'Collections',
  '/sources': 'Data Sources',
  '/logs': 'Bot Logs',
  '/bots': 'Bots',
  '/settings/projects': 'Settings / Projects',
  '/settings/team': 'Settings / Team',
  '/settings/billing': 'Settings / Billing',
  '/settings/usage': 'Settings / Usage',
  '/settings/roles': 'Settings / Access Control'
}

function NavigationLink({ to, children }: { to: string; children: React.ReactNode }) {
  const navigate = useNavigate()
  return (
    <BreadcrumbLink onClick={() => navigate(to)}>
      {children}
    </BreadcrumbLink>
  )
}

function AppContent() {
  const location = useLocation()
  const currentPath = location.pathname
  const currentName = routeNames[currentPath] || 'Unknown'

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-12 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="ml-2" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <NavigationLink to="/"><span className="cursor-pointer">Home</span></NavigationLink>
                </BreadcrumbItem>
                {currentPath !== '/' && (
                  <>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbPage>{currentName}</BreadcrumbPage>
                    </BreadcrumbItem>
                  </>
                )}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col p-2 pt-0">
          <Routes>
            <Route path="/" element={<AgentList />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/rag" element={<CollectionsManagement />} />
            <Route path="/sources" element={<Sources />} />
            <Route path="/logs" element={<BotLogsTable />} />
            <Route path="/bots" element={<BotManagement />} />
            <Route path="/settings" element={<SettingsLayout />}>
              <Route path="projects" element={<ProjectsSettings />} />
              <Route path="team" element={<TeamSettings />} />
              <Route path="billing" element={<BillingSettings />} />
              <Route path="usage" element={<UsageSettings />} />
              <Route path="roles" element={<AccessControlSettings />} />
            </Route>
            <Route path="/settings/team/users/:id" element={<Users />} />
            <Route path="/settings/roles/:id" element={<Roles />} />
            <Route path="/agent/:id" element={<Agent />} />
          </Routes>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

export function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  )
}

