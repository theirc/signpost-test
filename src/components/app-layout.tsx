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
import { RoleForm } from "@/pages/settings/roles"
import { TeamForm } from "@/pages/settings/team"
import { TeamSettings } from "@/pages/settings/teams"
import { UsageSettings } from "@/pages/settings/usage"
import { UserForm } from "@/pages/settings/users"
import Sources from "@/pages/sources"
import { Routes, Route, useLocation, useNavigate } from "react-router-dom"
import { ProtectedRoute } from "@/components/protected-route"

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
            <Route path="/" element={
              <ProtectedRoute resource="agents" action="read">
                <AgentList />
              </ProtectedRoute>
            } />
            <Route path="/playground" element={
              <ProtectedRoute resource="playground" action="read">
                <Chat />
              </ProtectedRoute>
            } />
            <Route path="/collections" element={
              <ProtectedRoute resource="collections" action="read">
                <CollectionsManagement />
              </ProtectedRoute>
            } />
            <Route path="/sources" element={
              <ProtectedRoute resource="sources" action="read">
                <Sources />
              </ProtectedRoute>
            } />
            <Route path="/logs" element={
              <ProtectedRoute resource="logs" action="read">
                <BotLogsTable />
              </ProtectedRoute>
            } />
            <Route path="/logs/:id" element={
              <ProtectedRoute resource="logs" action="update">
                <LogForm />
              </ProtectedRoute>
            } />
            <Route path="/scores" element={
              <ProtectedRoute resource="scores" action="read">
                <BotScoresTable />
              </ProtectedRoute>
            } />
            <Route path="/scores/:id" element={
              <ProtectedRoute resource="scores" action="update">
                <ScoreForm />
              </ProtectedRoute>
            } />
            <Route path="/customview" element={
              <ProtectedRoute resource="scores" action="read">
                <CustomView />
              </ProtectedRoute>
            } />
            <Route path="/bots" element={
              <ProtectedRoute resource="bots" action="read">
                <BotManagement />
              </ProtectedRoute>
            } />
            <Route path="/bots/prompts" element={
              <ProtectedRoute resource="prompts" action="update">
                <SystemPrompts />
              </ProtectedRoute>
            } />
            <Route path="/settings" element={<SettingsLayout />}>
              <Route path="projects" element={
                <ProtectedRoute resource="projects" action="read">
                  <ProjectsSettings />
                </ProtectedRoute>
              } />
              <Route path="teams" element={
                <ProtectedRoute resource="teams" action="read">
                  <TeamSettings />
                </ProtectedRoute>
              } />
              <Route path="billing" element={
                <ProtectedRoute resource="billing" action="read">
                  <BillingSettings />
                </ProtectedRoute>
              } />
              <Route path="usage" element={
                <ProtectedRoute resource="usage" action="read">
                  <UsageSettings />
                </ProtectedRoute>
              } />
              <Route path="roles" element={
                <ProtectedRoute resource="roles" action="read">
                  <AccessControlSettings />
                </ProtectedRoute>
              } />
              <Route path="roles/:id" element={
                <ProtectedRoute resource="roles" action="update">
                  <RoleForm />
                </ProtectedRoute>
              } />
              <Route path="teams/:id" element={
                <ProtectedRoute resource="teams" action="update">
                  <TeamForm />
                </ProtectedRoute>
              } />
              <Route path="teams/users/:id" element={
                <ProtectedRoute resource="users" action="update">
                  <UserForm />
                </ProtectedRoute>
              } />
              <Route path="projects/:id" element={
                <ProtectedRoute resource="projects" action="update">
                  <ProjectForm />
                </ProtectedRoute>
              } />
              <Route path="/agent/:id" element={
              <ProtectedRoute resource="agents" action="update">
                <Agent />
              </ProtectedRoute>
             } />
            </Route>
          </Routes>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
} 
