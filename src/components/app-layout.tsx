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
import { BotForm } from "@/pages/bots/bot-form"
import { MultiSelectDropdown } from '@/components/ui/multiselect';
import { Button } from '@/components/ui/button';
import { History } from 'lucide-react';
import React, { useState } from 'react';
import { ChatProvider } from '@/context/ChatContext';
import { useChatContext } from '@/context/ChatContext';

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
  '/agent/:id': 'Agent Details',
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
    <ChatProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <HeaderControls />
          <div className="flex flex-1 flex-col rounded-xl bg-background border border-border shadow-md">
            <div className="flex-1 p-4">
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
                <Route path="/bots/new" element={
                  <ProtectedRoute resource="bots" action="create">
                    <BotForm/>
                  </ProtectedRoute>
                }
                />
                <Route path="/bots/:id" element={
                  <ProtectedRoute resource="bots" action="update">
                    <BotForm/>
                  </ProtectedRoute>
                }
                />
                <Route path="/bots/prompts" element={
                  <ProtectedRoute resource="prompts" action="update">
                    <SystemPrompts />
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
                </Route>
              </Routes>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </ChatProvider>
  )
}

function HeaderControls() {
  const location = useLocation()
  const currentPath = location.pathname
  const currentName = routeNames[currentPath] || 'Unknown'
  const { selectedBots, options, handleBotSelectionChange, toggleSidebar, loadingBots } = useChatContext();

  const isBotListEmpty = selectedBots.length === 0;

  return (
    <header className="flex h-12 shrink-0 items-center justify-between gap-2 px-4">
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

      {currentPath === '/playground' && (
        <div className="flex items-center gap-2">
          {!loadingBots ? (
            <div className={`relative ${isBotListEmpty ? 'empty-model-select rounded-md' : ''}`}>
              <MultiSelectDropdown 
                options={options}
                selected={selectedBots}
                onChange={handleBotSelectionChange}
              />
              {isBotListEmpty && (
                <p className="absolute left-0 top-full mt-1.5 px-2 py-0.5 rounded bg-primary text-primary-foreground text-xs whitespace-nowrap shadow-sm z-10">
                  Please select a bot
                </p>
              )}
            </div>
          ) : (
            <div className="h-8 w-40 bg-muted rounded-md animate-pulse"></div>
          )}
          <Button 
            onClick={toggleSidebar}
            size="sm"
            variant="ghost"
            className="flex items-center gap-1"
          >
            <History className="h-5 w-5" />
          </Button>
        </div>
      )}
    </header>
  )
}
