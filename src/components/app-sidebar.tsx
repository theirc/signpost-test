import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarRail } from "@/components/ui/sidebar"
import { Bot, MessagesSquare, Book, Settings2, Logs, Plus, Network, Search } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { useEffect, useState, useRef } from "react"
import { fetchTeams, getCurrentUser, Team, User } from "@/lib/data/supabaseFunctions"
import { useNavigate } from "react-router-dom"
import { Input } from "@/components/ui/input"
import { usePermissions } from "@/lib/hooks/usePermissions"

export function AppSidebar() {
  const navigate = useNavigate()
  const { canRead, loading: permissionsLoading } = usePermissions()
  const [teams, setTeams] = useState<Team[]>([])
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [dropdownWidth, setDropdownWidth] = useState<number>(0)
  const [searchQuery, setSearchQuery] = useState("")
  const sidebarHeaderRef = useRef<HTMLDivElement>(null)
  const [user, setUser] = useState<User | null>(null)
  useEffect(() => {
    const loadTeams = async () => {
      const { data, error } = await fetchTeams()
      if (error) {
        console.error('Error fetching teams:', error)
        return
      }
      setTeams(data)
      if (data.length > 0) {
        setSelectedTeam(data[0])
      }
    }

    const loadUser = async () => {
      const { data, error } = await getCurrentUser()
      if (error) {
        console.error('Error fetching user:', error)
        return
      }
      setUser(data)
    }
    loadTeams()
    loadUser()
  }, [])

  useEffect(() => {
    if (sidebarHeaderRef.current) {
      setDropdownWidth(sidebarHeaderRef.current.offsetWidth)
    }
  }, [])

  const filteredTeams = teams.filter(team => 
    team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    team.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const navItems = [
    {
      title: "Bots",
      url: "#",
      icon: Bot,
      items: [
        { title: "All Bots", url: "/bots", permission: "bots" },
        { title: "System Prompts", url: "/bots/prompts", permission: "bots" },
      ],
      show: !permissionsLoading && canRead("bots")
    },
    {
      title: "Playground",
      url: "/playground",
      icon: MessagesSquare,
      isLink: true,
      show: !permissionsLoading && canRead("chat")
    },
    {
      title: "Evaluation",
      url: '#',
      icon: Logs,
      items: [
        { title: "Logs", url: "/logs", permission: "logs" },
        { title: "Scores", url: "/scores", permission: "scores" },
        { title: "Custom View", url: "/customview", permission: "evaluation" }
      ],
      show: !permissionsLoading && (canRead("logs") || canRead("scores") || canRead("evaluation"))
    },
    {
      title: "Knowledge",
      url: "#",
      icon: Book,
      items: [
        { title: "Collections", url: "/collections", permission: "knowledge" },
        { title: "Data Sources", url: "/sources", permission: "sources" },
      ],
      show: !permissionsLoading && (canRead("knowledge") || canRead("sources"))
    },
    {
      title: "Settings",
      url: "#",
      icon: Settings2,
      items: [
        { title: "Projects", url: "/settings/projects", permission: "settings" },
        { title: "Team", url: "/settings/teams", permission: "teams" },
        { title: "Billing", url: "/settings/billing", permission: "settings" },
        { title: "Usage", url: "/settings/usage", permission: "settings" },
        { title: "Access Control", url: "/settings/roles", permission: "roles" },
      ],
      show: !permissionsLoading && (canRead("settings") || canRead("teams") || canRead("roles"))
    }
  ].filter(item => {
    if (item.items) {
      item.items = item.items.filter(subItem => !permissionsLoading && canRead(subItem.permission))
      return item.items.length > 0
    }
    return item.show
  })

  return (
    <>
      <Sidebar collapsible="icon">
        <SidebarHeader ref={sidebarHeaderRef}>
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
                    <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-blue-100">
                      <span className="text-blue-600 font-semibold">
                        {selectedTeam?.name?.[0] || 'T'}
                      </span>
                    </div>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">{selectedTeam?.name || 'Select Team'}</span>
                      <span className="truncate text-xs">{selectedTeam?.description || 'Team Description'}</span>
                    </div>
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  align="start" 
                  className="min-w-[var(--sidebar-width)] w-auto"
                  style={{ minWidth: dropdownWidth }}
                >
                  <div className="p-2">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search for a workspace"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  {filteredTeams.map((team) => (
                    <DropdownMenuItem
                      key={team.id}
                      onClick={() => setSelectedTeam(team)}
                      className={selectedTeam?.id === team.id ? "bg-accent" : ""}
                    >
                      {team.name}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => navigate("/settings/teams/new")}
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add a workspace</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => navigate("/settings/teams")}
                    className="flex items-center gap-2"
                  >
                    <Network className="h-4 w-4" />
                    <span>All workspaces</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <NavMain items={navItems} />
        </SidebarContent>
        <SidebarFooter>
          <NavUser user={user} />
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
    </>
  )
}
