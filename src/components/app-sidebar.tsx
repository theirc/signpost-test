import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavUser } from "@/components/nav-user"
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarRail, useSidebar, } from "@/components/ui/sidebar"
import { BookOpen, Bot, Frame, GalleryVerticalEnd, Map, PieChart, Settings2, SquareTerminal } from "lucide-react"

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
      url: "#",
      icon: SquareTerminal,
      isActive: true,
      items: [
        { title: "History", url: "#", },
        { title: "Starred", url: "#", },
        { title: "Settings", url: "#", },
      ],
    },
    {
      title: "Models",
      url: "#",
      icon: Bot,
      items: [
        { title: "OpenAI", url: "#", },
        { title: "Anthropic", url: "#", },
        { title: "Gemini", url: "#", },
      ],
    },
    {
      title: "Settings",
      url: "#",
      icon: Settings2,
      items: [
        {
          title: "General", url: "#",
        },
        { title: "Team", url: "#", },
        { title: "Billing", url: "#", },
        { title: "Limits", url: "#", },
      ],
    },
  ],
  projects: [
    { name: "Design Engineering", url: "#", icon: Frame, },
    { name: "Sales & Marketing", url: "#", icon: PieChart, },
    { name: "Travel", url: "#", icon: Map, },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return <Sidebar collapsible="icon" {...props}>
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

}
