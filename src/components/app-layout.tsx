import { AppSidebar } from "@/components/app-sidebar"
import { ProtectedRoute } from "@/components/protected-route"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { app, useAppStore } from "@/lib/app"
import { BotLogsTable } from "@/pages/evaluation/logs"
import { ScoreForm } from "@/pages/evaluation/score"
import { BotScoresTable } from "@/pages/evaluation/scores"
import { Agent } from "@/pages/flow/agent"
import { AgentList } from "@/pages/flow/agents"
import { CollectionsManagement } from "@/pages/knowledge"
import Chat from "@/pages/playground"
import { AccessControlSettings } from "@/pages/settings/access-control"
import ApiKeyView from "@/pages/settings/api-key"
import { ApiKeysSettings } from "@/pages/settings/api-keys"
import { BillingSettings } from "@/pages/settings/billing"
import { SettingsLayout } from "@/pages/settings/layout"
import ModelView from "@/pages/settings/model"
import { ModelsSettings } from "@/pages/settings/models"
import { ProfileSettings } from "@/pages/settings/profile"
import { ProjectForm } from "@/pages/settings/project"
import { ProjectsSettings } from "@/pages/settings/projects"
import { RoleForm } from "@/pages/settings/roles"
import { TeamForm } from "@/pages/settings/team"
import { AddTeamMembers } from "@/pages/settings/team-members"
import { TeamSettings } from "@/pages/settings/teams"
import { UsageSettings } from "@/pages/settings/usage"
import { UserForm } from "@/pages/settings/user"
import { UsersSettings } from "@/pages/settings/users"
import Sources from "@/pages/sources"
import { SourceDetail } from "@/pages/sources/source-detail"
import { AgentList as TemplateList } from "@/pages/templates/agents"
import TestWebpage from "@/pages/webpage/test"
import { Edit } from "lucide-react"
import React, { useState } from 'react'
import { Route, Routes, useLocation, useNavigate } from "react-router-dom"

const routeNames: Record<string, string> = {
  '/': 'Agents',
  '/playground': 'Playground',
  '/collections': 'Collections',
  '/sources': 'Sources',
  '/sources/:id': 'Source Details',
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
  '/settings/models': 'Settings / Models',
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
  const { agent } = useAppStore()

  const [editingTitle, setEditingTitle] = useState(agent?.title || '')
  React.useEffect(() => {
    if (agent?.title) {
      setEditingTitle(agent.title)
    }
  }, [agent?.id])

  // Breadcrumb logic for menu/submenu
  const breadcrumbItems: { name: string; to?: string }[] = [
    { name: 'Home', to: '/' },
  ]
  if (currentPath.startsWith('/agent/')) {
    breadcrumbItems.push({ name: 'Agents', to: '/' })
    // Ensure we have a proper agent title, fallback to 'Agent' if empty
    const agentTitle = agent?.title?.trim() || 'Agent'
    breadcrumbItems.push({ name: agentTitle })
  } else if (currentPath.startsWith('/evaluation/')) {
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
    } else if (currentPath === '/settings/models') {
      breadcrumbItems.push({ name: 'Models' })
    } else if (currentPath === '/settings/profile') {
      breadcrumbItems.push({ name: 'Profile' })
    }
  } else if (routeNames[currentPath]) {
    breadcrumbItems.push({ name: routeNames[currentPath] })
  }

  return <SidebarProvider>
    <AppSidebar />
    <SidebarInset className="!max-h-screen">
      {/* <div className="flex items-center pb-1">
          <SidebarTrigger className="mr-2" />
          <Breadcrumb>
            <BreadcrumbList>
              {breadcrumbItems.map((item, idx) => (
                <React.Fragment key={item.name}>
                  <BreadcrumbItem>
                    {idx !== breadcrumbItems.length - 1 && item.to ? (
                      <NavigationLink to={item.to}>{item.name}</NavigationLink>
                    ) : (
                      currentPath.startsWith('/agent/') && idx === breadcrumbItems.length - 1 ? (
                        <div className="flex items-center gap-1">
                          <Input
                            value={editingTitle}
                            onChange={(e) => setEditingTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.currentTarget.blur()
                              }
                            }}
                            onBlur={() => {
                              if (agent && editingTitle !== agent.title) {
                                agent.title = editingTitle
                              }
                            }}
                            className="text-sm font-semibold w-64 border border-gray-200 bg-transparent p-1 focus-visible:ring-1 focus-visible:ring-blue-500 hover:bg-gray-50 rounded transition-colors"
                            placeholder="Agent Title"
                            autoFocus={false}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-gray-500 hover:text-gray-700"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <BreadcrumbPage>{item.name}</BreadcrumbPage>
                      )
                    )}
                  </BreadcrumbItem>
                  {idx < breadcrumbItems.length - 1 && <BreadcrumbSeparator />}
                </React.Fragment>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        </div> */}

      <header className="flex h-8 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 ">
          <SidebarTrigger className="-ml-1" />
          <Breadcrumb>
            <BreadcrumbList>
              {breadcrumbItems.map((item, idx) => (
                <React.Fragment key={item.name}>
                  <BreadcrumbItem>
                    {idx !== breadcrumbItems.length - 1 && item.to ? (
                      <NavigationLink to={item.to}>{item.name}</NavigationLink>
                    ) : (
                      currentPath.startsWith('/agent/') && idx === breadcrumbItems.length - 1 ? (
                        <div className="flex items-center gap-1">
                          <Input
                            value={editingTitle}
                            onChange={(e) => setEditingTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.currentTarget.blur()
                              }
                            }}
                            onBlur={() => {
                              if (agent && editingTitle !== agent.title) {
                                agent.title = editingTitle
                              }
                            }}
                            className="text-sm font-semibold w-64 border border-gray-200 bg-transparent p-1 focus-visible:ring-1 focus-visible:ring-blue-500 hover:bg-gray-50 rounded transition-colors"
                            placeholder="Agent Title"
                            autoFocus={false}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-gray-500 hover:text-gray-700"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <BreadcrumbPage>{item.name}</BreadcrumbPage>
                      )
                    )}
                  </BreadcrumbItem>
                  {idx < breadcrumbItems.length - 1 && <BreadcrumbSeparator />}
                </React.Fragment>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      {/* <div className="bg-white min-h-[100vh] rounded-sm md:min-h-min flex flex-col border border-border" > */}
      <div className="bg-white flex flex-col border border-border rounded-sm h-full max-h-full">
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
          <Route path="/sources/:id" element={
            <ProtectedRoute resource="sources" action="read">
              <SourceDetail />
            </ProtectedRoute>
          } />
          <Route path="/evaluation/logs" element={
            <ProtectedRoute resource="logs" action="read">
              <BotLogsTable />
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
              <div className="flex flex-1 flex-col">
                <Agent />
              </div>
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
            <Route path="models" element={
              <ProtectedRoute resource="models" action="read">
                <ModelsSettings />
              </ProtectedRoute>
            } />
            <Route path="models/:id" element={
              <ProtectedRoute resource="models" action="read">
                <ModelView />
              </ProtectedRoute>
            } />
            <Route path="profile" element={
              <ProfileSettings />
            } />
          </Route>
          <Route path="/webpage-test" element={<TestWebpage />} />

          {Object.values(app.pages).map((page) => <Route key={page.path} path={page.path} element={<page.component />} />)}

        </Routes>
      </div>
    </SidebarInset>
  </SidebarProvider>

}
