import { AppSidebar } from "@/components/app-sidebar"
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from "@/components/ui/breadcrumb"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import Chat from "@/pages/playground"
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
import { UserForm } from "@/pages/settings/user"
import Sources from "@/pages/sources"
import { Routes, Route, useLocation, useNavigate, useMatch } from "react-router-dom"
import { ProtectedRoute } from "@/components/protected-route"
import React from 'react';
import { app } from "@/lib/app"
import { UsersSettings } from "@/pages/settings/users"
import { AddTeamMembers } from "@/pages/settings/team-members"
import { ApiKeysSettings } from "@/pages/settings/api-keys"
import ApiKeyView from "@/pages/settings/api-key"

const routeNames: Record<string, string> = {
  '/': 'Designer',
  '/playground': 'Playground',
  '/collections': 'Collections',
  '/sources': 'Data Sources',
  '/logs': 'Evaluation / Logs',
  '/scores': 'Evaluation / Scores',
  '/customview': 'Evaluation / Custom View',
  '/agent/:id': 'Agent Details',
  '/settings/projects': 'Settings / Projects',
  '/settings/teams': 'Settings / Teams',
  '/settings/billing': 'Settings / Billing',
  '/settings/usage': 'Settings / Usage',
  '/settings/roles': 'Settings / Access Control',
  '/settings/users': 'Settings / Users',
  '/settings/apikeys': 'Settings / Api Keys',
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
  const isAgentRoute = useMatch("/agent/:id");

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <HeaderControls isAgentRoute={!!isAgentRoute} />
        <div className="flex flex-1 flex-col rounded-xl bg-background border border-border overflo">
          <div className={`flex-1 ${isAgentRoute ? '' : ''} `}>
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
              <Route path="/agent/:id" element={
                <ProtectedRoute resource="agents" action="update">
                  <Agent />
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
                <Route path="teams/members/:id" element={
                  <ProtectedRoute resource="teams" action="update">
                    <AddTeamMembers />
                  </ProtectedRoute>
                } />
                <Route path="users" element={
                  <ProtectedRoute resource="users" action="read">
                    <UsersSettings />
                  </ProtectedRoute>
                } />
                <Route path="users/:id" element={
                  <ProtectedRoute resource="users" action="update">
                    <UserForm />
                  </ProtectedRoute>
                } />
                <Route path="projects/:id" element={
                  <ProtectedRoute resource="projects" action="update">
                    <ProjectForm />
                  </ProtectedRoute>
                } />
                <Route path="apikeys" element={
                  <ProtectedRoute resource="apikeys" action="read">
                    <ApiKeysSettings />
                  </ProtectedRoute>
                } />
                <Route path="apikeys/:id" element={
                  <ProtectedRoute resource="apikeys" action="update">
                    <ApiKeyView />
                  </ProtectedRoute>
                } />
              </Route>
            </Routes>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

function HeaderControls({ isAgentRoute }: { isAgentRoute: boolean }) {
  const location = useLocation()
  const currentPath = location.pathname
  const currentName = routeNames[currentPath] || 'Unknown'

  return (
    <>
      <header className="flex h-12 shrink-0 items-center justify-between gap-2 px-4">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="ml-2" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <NavigationLink to="/">
                  <span className="cursor-pointer">Home</span>
                </NavigationLink>
              </BreadcrumbItem>
              {currentPath !== '/' && (
                <>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    {isAgentRoute && app.agent ? (
                      <div className="text-sm flex items-center">
                        <span className="font-medium text-foreground">
                          {app.agent.title}
                        </span>
                      </div>
                    ) : (
                      <BreadcrumbPage>{currentName}</BreadcrumbPage>
                    )}
                  </BreadcrumbItem>
                </>
              )}
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
    </>
  );
}
