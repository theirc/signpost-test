import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavUser } from "@/components/nav-user"
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarRail } from "@/components/ui/sidebar"
import { Bot, Book, Frame, GalleryVerticalEnd, Map, PieChart, Settings2, SquareTerminal, Logs } from "lucide-react"

export function AppSidebar() {
  // This is sample data.
  const data = {
    user: {
      name: "Guillermo Zambrino",
      email: "email@example.com",
      avatar: "/avatars/shadcn.jpg",
    },
    navMain: [
      {
        title: "Designer",
        url: "",
        icon: SquareTerminal,
        isActive: true,
        items: [
          { title: "History", url: "/", },
          { title: "Starred", url: "/", },
          { title: "Settings", url: "/", },
        ],
      },
      {
        title: "Bots",
        url: "bots",
        icon: Bot,
        isLink: true,
      },
      {
        title: "Settings",
        url: "settings",
        icon: Settings2,
        items: [
          { title: "Projects", url: "/settings/projects" },
          { title: "Team", url: "/settings/team" },
          { title: "Billing", url: "/settings/billing" },
          { title: "Usage", url: "/settings/usage" },
        ],
      },
      {
        title: "Playground",
        url: "chat",
        icon: Bot,
        isLink: true,
      },
      {
        title: "Knowledge",
        url: "#",
        icon: Book,
        items: [
          { title: "Collections", url: "rag" },
          { title: "Data Sources", url: "sources" },
        ],
      },
      {
        title: "Bot Logs",
        url: "logs",
        icon: Logs,
        isLink: true,
        items: [{
          title: "RAG",
          url: "rag",
        }]
      },
    ],
    projects: [
      { name: "Design Engineering", url: "/", icon: Frame },
      { name: "Sales & Marketing", url: "/", icon: PieChart },
      { name: "Travel", url: "/", icon: Map },
    ],
  }

  return (
    <>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <GalleryVerticalEnd className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Signpost</span>
                  <span className="truncate text-xs">Enterprise</span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <NavMain items={data.navMain} />
          <NavProjects projects={data.projects} />
        </SidebarContent>
        <SidebarFooter>
          <NavUser user={data.user} />
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
    </>
  )
}
