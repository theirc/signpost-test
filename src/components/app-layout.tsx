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
import { UserForm } from "@/pages/settings/user"
import Sources from "@/pages/sources"
import { Routes, Route, useLocation, useNavigate, useMatch } from "react-router-dom"
import { ProtectedRoute } from "@/components/protected-route"
import { BotForm } from "@/pages/bots/bot-form"
import { MultiSelectDropdown } from '@/components/ui/multiselect';
import { Button } from '@/components/ui/button';
import { History } from 'lucide-react';
import React from 'react';
import { ChatProvider } from '@/context/ChatContext';
import { useChatContext } from '@/context/ChatContext';
import { Menubar, MenubarContent, MenubarItem, MenubarMenu, MenubarTrigger } from "@/components/ui/menubar"
import { workerRegistry } from "@/lib/agents/registry"
import { createModel } from "@/lib/data/model"
import { cloneDeep } from "lodash"
import { Cog, EllipsisVertical, LoaderCircle, Play, Save, Settings, Trash2 } from "lucide-react"
import { useEffect, useState as useReactState } from "react"
import { toast } from "sonner"
import { Input, InputTextArea, Modal, Row, Select, useForm } from "@/components/forms"
import { Separator } from "@/components/ui/separator"
import { agents } from "@/lib/agents"
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
  '/bots': 'Bots',
  '/bots/prompts': 'System Prompts',
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

const model = createModel({
  fields: {
    openai: { type: 'string', title: 'OpenAI' },
    anthropic: { type: 'string', title: 'Anthropic' },
    zendesk: { type: 'string', title: 'Zendesk' },
  }
})

const agentModel = createModel({
  fields: {
    title: { type: 'string', title: 'Title' },
    description: { type: 'string', title: 'Description' },
    type: { type: 'string', title: 'Type', list: [{ value: "conversational", label: "Conversational" }, { value: "data", label: "Data" }] },
  }
})

function DragableItem({ reg: { title, icon: Icon, description, type } }: { reg: WorkerRegistryItem }) {
  const onDragStart = (event: React.DragEvent<HTMLAnchorElement>, nodeType) => {
    event.dataTransfer.setData('nodeType', nodeType)
    event.dataTransfer.effectAllowed = 'move'
    console.log("drag")
  }
  const onClick = (event: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => { event.preventDefault() }
  return <a href={"#"} onDragStart={(event) => onDragStart(event, type)} onClick={onClick} draggable>
    <MenubarItem className="size-full flex cursor-move">
      <div className="hover:bg-gray-100 cursor-move flex gap-1 items-center select-none w-28 h-10 mr-1 px-2">
        {Icon && <Icon size={16} />} {title}
      </div>
      <div className="text-xs w-64">{description}</div>
    </MenubarItem>
  </a>
}

export function AppLayout() {
  const location = useLocation()
  const currentPath = location.pathname
  const currentName = routeNames[currentPath] || 'Unknown'
  const isAgentRoute = useMatch("/agent/:id");

  return (
    <ChatProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <HeaderControls isAgentRoute={!!isAgentRoute} />
          <div className="flex flex-1 flex-col rounded-xl bg-background border border-border elevated-page overflow-hidden">
            <div className={`flex-1 ${isAgentRoute ? '' : 'p-4'} h-full`}>
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
    </ChatProvider>
  )
}

function HeaderControls({ isAgentRoute }: { isAgentRoute: boolean }) {
  const location = useLocation()
  const currentPath = location.pathname
  const currentName = routeNames[currentPath] || 'Unknown'
  const { selectedBots, options, handleBotSelectionChange, toggleSidebar, loadingBots } = useChatContext();
  const isBotListEmpty = selectedBots.length === 0;

  const { form, m, watch } = useForm(model, {
    values: {
      ...app.getAPIkeys(),
    }
  })

  const { form: agentForm, m: f } = useForm(agentModel, {
    values: {
      title: app.agent?.title ?? '',
      description: app.agent?.description ?? '',
      type: app.agent?.type ?? 'conversational',
    }
  })

  const [saving, setSaving] = useReactState(false)

  useEffect(() => {
    if (app.agent) {
      form.reset({ ...app.getAPIkeys() });
      agentForm.reset({
          title: app.agent.title,
          description: app.agent.description ?? '',
          type: app.agent.type ?? 'conversational'
      });
    }
  }, [app.agent]);

  form.onSubmit = async (data) => {
    const ak = app.getAPIkeys()
    ak.openai = data.openai
    ak.anthropic = data.anthropic
    ak.zendesk = data.zendesk
    app.saveAPIkeys(ak)
  }

  agentForm.onSubmit = async (data) => {
    if (!app.agent) return;
    app.agent.title = data.title
    app.agent.description = data.description
    app.agent.type = data.type as any
  }

  async function onSave() {
    if (saving || !app.agent) return;
    setSaving(true)
    const clonedAgent = cloneDeep(app.agent)
    await agents.saveAgent(clonedAgent)
    toast("The flow was saved", { action: { label: "Ok", onClick: () => console.log("Ok") } })
    setTimeout(() => { setSaving(false) }, 1000)
  }

  async function onPlay() {
    if (!app.agent) return;
    console.log("Play")
    const { agent } = app

    if (!agent.hasResponse()) {
      toast("Add a Response Worker to execute", { action: { label: "Ok", onClick: () => console.log("Ok") } })
      return
    }

    const p: AgentParameters = { debug: true, input: {}, apikeys: app.getAPIkeys() }
    await agent.execute(p)

    if (p.error) {
      toast("Error", { description: <div className="text-red-500 font-semibold">{p.error}</div>, action: { label: "Ok", onClick: () => console.log("Ok") } })
    }
    console.log("Result: ", p.output)
  }

  function onSetAPIKey() { form.modal.show() }

  function onSetAgent() {
    if (!app.agent) return;
    agentForm.edit({
      title: app.agent.title,
      description: app.agent.description,
      type: app.agent.type
    })
  }

  return (
    <>
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
                    {isAgentRoute && app.agent ? (
                       <div className="text-sm flex items-center">
                         <Settings size={16} className="inline mr-2 cursor-pointer text-muted-foreground hover:text-foreground" onClick={onSetAgent} />
                         <span className="font-medium text-foreground">{app.agent.title}</span>
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

        <div className="flex items-center gap-1">
          {isAgentRoute ? (
             <>
                <Separator orientation="vertical" className="h-5 mx-1" />
                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" onClick={onSave}>
                    {saving ? <LoaderCircle size={16} className="animate-spin" /> : <Save size={16} />}
                </Button>
                <Separator orientation="vertical" className="h-5 mx-1" />
                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" title="Play" onClick={onPlay}>
                    <Play size={16} />
                </Button>
                <Separator orientation="vertical" className="h-5 mx-1" />
                <Menubar className="h-auto border-0 bg-transparent p-0">
                    <MenubarMenu>
                      <MenubarTrigger className="font-medium text-sm h-auto px-2 py-1 cursor-pointer rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">I/O</MenubarTrigger>
                      <MenubarContent>
                        {Object.entries(workerRegistry).filter(([key, node]) => node.category == "io").map(([key, node]) => (<DragableItem key={key} reg={node} />))}
                      </MenubarContent>
                    </MenubarMenu>
                    <MenubarMenu>
                      <MenubarTrigger className="font-medium text-sm h-auto px-2 py-1 cursor-pointer rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">Generators</MenubarTrigger>
                      <MenubarContent>
                        {Object.entries(workerRegistry).filter(([key, node]) => node.category == "generator").map(([key, node]) => (<DragableItem key={key} reg={node} />))}
                      </MenubarContent>
                    </MenubarMenu>
                    <MenubarMenu>
                      <MenubarTrigger className="font-medium text-sm h-auto px-2 py-1 cursor-pointer rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">Tools</MenubarTrigger>
                      <MenubarContent>
                        {Object.entries(workerRegistry).filter(([key, node]) => node.category == "tool").map(([key, node]) => (<DragableItem key={key} reg={node} />))}
                      </MenubarContent>
                    </MenubarMenu>
                    <MenubarMenu>
                      <MenubarTrigger className="font-medium text-sm h-auto px-2 py-1 cursor-pointer rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">Debug</MenubarTrigger>
                      <MenubarContent>
                        {Object.entries(workerRegistry).filter(([key, node]) => node.category == "debug").map(([key, node]) => (<DragableItem key={key} reg={node} />))}
                      </MenubarContent>
                    </MenubarMenu>
                    <MenubarMenu>
                      <MenubarTrigger className="h-auto px-1 py-1 cursor-pointer rounded-md text-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
                        <EllipsisVertical size={18} />
                      </MenubarTrigger>
                      <MenubarContent>
                        <MenubarItem className="text-sm" onClick={onSetAPIKey}> Set API Keys </MenubarItem>
                      </MenubarContent>
                    </MenubarMenu>
                </Menubar>
              </>
          ) : currentPath === '/playground' ? (
             <>
               {!loadingBots ? (
                 <div className={`relative ${isBotListEmpty ? '' : ''} h-9 px-2 flex items-center p-1 rounded-md hover:bg-sidebar-accent group`}>
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
                 className="flex items-center gap-1 rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
               >
                 <History className="h-5 w-5" />
               </Button>
             </>
          ) : (
            null
          )}
        </div>
      </header>

       <Modal form={agentForm} title="Agent Configuration">
         <Row> <Input span={12} field={f.title} required /> </Row>
         <Row> <InputTextArea rows={10} span={12} field={f.description} /> </Row>
         <Row> <Select span={12} field={f.type} required /> </Row>
       </Modal>
       <Modal form={form} title="API Keys">
         <Row> <Input span={12} field={m.openai} required /> </Row>
         <Row> <Input span={12} field={m.anthropic} required /> </Row>
         <Row> <Input span={12} field={m.zendesk} required /> </Row>
       </Modal>
    </>
  )
}
