import { AppSidebar } from "@/components/app-sidebar"
import { FlowDesigner } from "@/components/flow/flow"
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from "@/components/ui/breadcrumb"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { BotManagement } from "@/pages/bots/bots"
import SystemPrompts from "@/pages/bots/prompts"
import Chat from "@/pages/chat"
import { CustomView } from "@/pages/evaluation/custom-view"
import { LogForm } from "@/pages/evaluation/log"
import { BotLogsTable } from "@/pages/evaluation/logs"
import { ScoreForm } from "@/pages/evaluation/score"
import { BotScoresTable } from "@/pages/evaluation/scores"
import { Agent } from "@/pages/flow/agent"
import { AgentList } from "@/pages/flow/agents"
import { CollectionsManagement } from "@/pages/knowledge"
import { AccessControlSettings } from "@/pages/settings/access-control"
import { BillingSettings } from "@/pages/settings/billing"
import { SettingsLayout } from "@/pages/settings/layout"
import { ProjectForm } from "@/pages/settings/project"
import { ProjectsSettings } from "@/pages/settings/projects"
import { Roles } from "@/pages/settings/roles"
import { TeamForm } from "@/pages/settings/team"
import { TeamSettings } from "@/pages/settings/teams"
import { UsageSettings } from "@/pages/settings/usage"
import { UserForm } from "@/pages/settings/users"
import Sources from "@/pages/sources"
import { Routes, Route, useLocation, useNavigate } from "react-router-dom"

const routeNames: Record<string, string> = {
  '/': 'Designer',
  '/chat': 'Playground',
  '/rag': 'Collections',
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
    <BreadcrumbLink onClick={() => navigate(to, { replace: true })}>
      {children}
    </BreadcrumbLink>
  )
}

export function AppLayout() {
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