import { AppSidebar } from "@/components/app-sidebar"
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from "@/components/ui/breadcrumb"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import Chat from "@/pages/playground"
import { LogForm } from "@/pages/evaluation/log"
import { BotLogsTable } from "@/pages/evaluation/logs"
import { ScoreForm } from "@/pages/evaluation/score"
import { BotScoresTable } from "@/pages/evaluation/scores"
import { Agent } from "@/pages/flow/agent"
import { AgentList } from "@/pages/flow/agents"
import { AgentList as TemplateList } from "@/pages/templates/agents"
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
import React from 'react'
import { app, useAppStore } from "@/lib/app"
import { UsersSettings } from "@/pages/settings/users"
import { AddTeamMembers } from "@/pages/settings/team-members"
import { ApiKeysSettings } from "@/pages/settings/api-keys"
import ApiKeyView from "@/pages/settings/api-key"
import { ProfileSettings } from "@/pages/settings/profile"

const routeNames: Record<string, string> = {
  '/': 'Agents',
  '/playground': 'Playground',
  '/collections': 'Collections',
  '/sources': 'Sources',
  '/evaluation/logs': 'Logs',
  '/evaluation/scores': 'Scores',
  '/agent/:id': 'Agent Details',
  '/settings/projects': 'Settings / Projects',
  '/settings/teams': 'Settings / Teams',
  '/settings/billing': 'Settings / Billing',
  '/settings/usage': 'Settings / Usage',
  '/settings/roles': 'Settings / Access Control',
  '/settings/users': 'Settings / Users',
  '/settings/apikeys': 'Settings / Api Keys',
  '/settings/profile': 'Settings / Profile',
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
  const isAgentRoute = useMatch("/agent/:id")

  // Breadcrumb logic for menu/submenu
  const breadcrumbItems: { name: string; to?: string }[] = [
    { name: 'Home', to: '/' },
  ]
  if (currentPath.startsWith('/evaluation/')) {
    breadcrumbItems.push({ name: 'Evaluation', to: '/evaluation/logs' })
    if (currentPath === '/evaluation/logs') {
      breadcrumbItems.push({ name: 'Logs' })
    } else if (currentPath === '/evaluation/scores') {
      breadcrumbItems.push({ name: 'Scores' })
    }
  } else if (currentPath.startsWith('/collections') || currentPath.startsWith('/sources')) {
    breadcrumbItems.push({ name: 'Knowledge', to: '/collections' })
    if (currentPath === '/collections') {
      breadcrumbItems.push({ name: 'Collections' })
    } else if (currentPath === '/sources') {
      breadcrumbItems.push({ name: 'Sources' })
    }
  } else if (currentPath.startsWith('/settings/')) {
    breadcrumbItems.push({ name: 'Settings', to: '/settings/projects' })
    if (currentPath === '/settings/projects') {
      breadcrumbItems.push({ name: 'Projects' })
    } else if (currentPath === '/settings/teams') {
      breadcrumbItems.push({ name: 'Teams' })
    } else if (currentPath === '/settings/billing') {
      breadcrumbItems.push({ name: 'Billing' })
    } else if (currentPath === '/settings/usage') {
      breadcrumbItems.push({ name: 'Usage' })
    } else if (currentPath === '/settings/roles') {
      breadcrumbItems.push({ name: 'Access Control' })
    } else if (currentPath === '/settings/users') {
      breadcrumbItems.push({ name: 'Users' })
    } else if (currentPath === '/settings/apikeys') {
      breadcrumbItems.push({ name: 'Api Keys' })
    } else if (currentPath === '/settings/profile') {
      breadcrumbItems.push({ name: 'Profile' })
    }
  } else if (routeNames[currentPath]) {
    breadcrumbItems.push({ name: routeNames[currentPath] })
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        {/* Breadcrumb with menu/submenu support and sidebar trigger flush left */}
        <div className="flex items-center gap-2 px-4 pt-3 pb-2">
          <SidebarTrigger className="mr-2" />
          <Breadcrumb>
            <BreadcrumbList>
              {breadcrumbItems.map((item, idx) => (
                <React.Fragment key={item.name}>
                  <BreadcrumbItem>
                    {idx !== breadcrumbItems.length - 1 && item.to ? (
                      <NavigationLink to={item.to}>{item.name}</NavigationLink>
                    ) : (
                      <BreadcrumbPage>{item.name}</BreadcrumbPage>
                    )}
                  </BreadcrumbItem>
                  {idx < breadcrumbItems.length - 1 && <BreadcrumbSeparator />}
                </React.Fragment>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <div className="flex flex-1 flex-col rounded-md bg-background border border-border">
          <Routes>
            <Route path="/" element={
              <ProtectedRoute resource="agents" action="read">
                <AgentList />
              </ProtectedRoute>
            } />
            <Route path="/templates" element={
              <ProtectedRoute resource="templates" action="read">
                <TemplateList />
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
            <Route path="/evaluation/logs" element={
              <ProtectedRoute resource="logs" action="read">
                <BotLogsTable />
              </ProtectedRoute>
            } />
            <Route path="/evaluation/logs/:id" element={
              <ProtectedRoute resource="logs" action="read">
                <LogForm />
              </ProtectedRoute>
            } />
            <Route path="/evaluation/scores" element={
              <ProtectedRoute resource="scores" action="read">
                <BotScoresTable />
              </ProtectedRoute>
            } />
            <Route path="/evaluation/scores/:id" element={
              <ProtectedRoute resource="scores" action="read">
                <ScoreForm />
              </ProtectedRoute>
            } />
            <Route path="/agent/:id" element={
              <ProtectedRoute resource="agents" action="read">
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
                <ProtectedRoute resource="roles" action="read">
                  <RoleForm />
                </ProtectedRoute>
              } />
              <Route path="teams/:id" element={
                <ProtectedRoute resource="teams" action="read">
                  <TeamForm />
                </ProtectedRoute>
              } />
              <Route path="teams/members/:id" element={
                <ProtectedRoute resource="teams" action="read">
                  <AddTeamMembers />
                </ProtectedRoute>
              } />
              <Route path="users" element={
                <ProtectedRoute resource="users" action="read">
                  <UsersSettings />
                </ProtectedRoute>
              } />
              <Route path="users/:id" element={
                <ProtectedRoute resource="users" action="read">
                  <UserForm />
                </ProtectedRoute>
              } />
              <Route path="projects/:id" element={
                <ProtectedRoute resource="projects" action="read">
                  <ProjectForm />
                </ProtectedRoute>
              } />
              <Route path="apikeys" element={
                <ProtectedRoute resource="apikeys" action="read">
                  <ApiKeysSettings />
                </ProtectedRoute>
              } />
              <Route path="apikeys/:id" element={
                <ProtectedRoute resource="apikeys" action="read">
                  <ApiKeyView />
                </ProtectedRoute>
              } />
              <Route path="profile" element={
                <ProfileSettings />
              } />
            </Route>
          </Routes>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
