import { BrowserRouter, Routes, Route, useLocation, Link, useNavigate } from "react-router-dom"
import LoginPage from "@/pages/login"
import { ProtectedRoute } from "@/components/protected-route"
import { AppLayout } from "@/components/app-layout"
import { AppSidebar } from "@/components/app-sidebar"
import { FlowDesigner } from "@/components/flow/flow"
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from "@/components/ui/breadcrumb"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@radix-ui/react-separator"
import Chat from "./pages/chat"
import { CollectionsManagement } from "./pages/knowledge"
import { BotLogsTable } from "./pages/evaluation/logs.tsx"
import { BotManagement } from "./pages/bots/bots.tsx"
import SystemPrompts from "./pages/bots/prompts"
import Sources from './pages/sources.tsx'
import { SettingsLayout } from "./pages/settings/layout"
import { ProjectsSettings } from "./pages/settings/projects"
import { TeamSettings } from "./pages/settings/teams.tsx"
import { UsageSettings } from "./pages/settings/usage"
import { BillingSettings } from "./pages/settings/billing"
import { AccessControlSettings } from "./pages/settings/access-control"
import { Roles } from "./pages/settings/roles"
import { AgentList } from "./pages/flow/agents.tsx"
import { Agent } from "./pages/flow/agent.tsx"
import { BotScoresTable } from "./pages/evaluation/scores.tsx"
import { LogForm } from "./pages/evaluation/log.tsx"
import { ScoreForm } from "./pages/evaluation/score.tsx"
import { ProjectForm } from "./pages/settings/project.tsx"
import { TeamForm } from "./pages/settings/team.tsx"
import { UserForm } from "./pages/settings/users.tsx"
import { CustomView } from "./pages/evaluation/custom-view.tsx"

const routeNames: Record<string, string> = {
  '/': 'Designer',
  '/playground': 'Playground',
  '/collections': 'Collections',
  '/sources': 'Data Sources',
  '/logs': 'Evaluation / Logs',
  '/scores': 'Evaluation / Scores',
  '/customview': 'Evaluation / Custom View',
  '/bots': 'Bots',
  '/bots/prompts': 'System Prompts',
  '/settings/projects': 'Settings / Projects',
  '/settings/teams': 'Settings / Teams',
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
            <Route path="/playground" element={<Chat />} />
            <Route path="/collections" element={<CollectionsManagement />} />
            <Route path="/sources" element={<Sources />} />
            <Route path="/logs" element={<BotLogsTable />} />
            <Route path="/logs/:id" element={<LogForm />} />
            <Route path="/scores" element={<BotScoresTable />} />
            <Route path="/scores/:id" element={<ScoreForm />} />
            <Route path="/customview" element={<CustomView />} />
            <Route path="/bots" element={<BotManagement />} />
            <Route path="/bots/prompts" element={<SystemPrompts />} />
            <Route path="/settings" element={<SettingsLayout />}>
              <Route path="projects" element={<ProjectsSettings />} />
              <Route path="teams" element={<TeamSettings />} />
              <Route path="billing" element={<BillingSettings />} />
              <Route path="usage" element={<UsageSettings />} />
              <Route path="roles" element={<AccessControlSettings />} />
            </Route>
            <Route path="/settings/projects/:id" element={<ProjectForm />} />
            <Route path="/settings/teams/:id" element={<TeamForm />} />
            <Route path="/settings/teams/users/:id" element={<UserForm />} />
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
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <AppContent />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

