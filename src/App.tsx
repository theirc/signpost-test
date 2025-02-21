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
import { SourcesManagement } from "./pages/sources"
import { SettingsLayout } from "./pages/settings/layout"
import { ProjectsSettings } from "./pages/settings/projects"
import { TeamSettings } from "./pages/settings/team"
import { UsageSettings } from "./pages/settings/usage"
import { BillingSettings } from "./pages/settings/billing"

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
  '/settings/usage': 'Settings / Usage'
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
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <NavigationLink to="/">Home</NavigationLink>
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
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <Routes>
            <Route path="/" element={<FlowDesigner />} />
            <Route path="/chat" element={<Chat/>} />        
            <Route path="/rag" element={<CollectionsManagement />} />
            <Route path="/sources" element={<SourcesManagement />} />
            <Route path="/logs" element={<BotLogsTable />} />
            <Route path="/bots" element={<BotManagement />} />
            <Route path="/settings" element={<SettingsLayout />}>
              <Route path="projects" element={<ProjectsSettings />} />
              <Route path="team" element={<TeamSettings />} />
              <Route path="billing" element={<BillingSettings />} />
              <Route path="usage" element={<UsageSettings />} />
            </Route>
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

