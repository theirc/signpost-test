import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavUser } from "@/components/nav-user"
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarRail, useSidebar, } from "@/components/ui/sidebar"
import { BookOpen, Bot, Frame, GalleryVerticalEnd, Map, PieChart, Settings2, SquareTerminal } from "lucide-react"
import { useState } from "react"
import { LiveDataModal } from "./forms/live-data-modal"
import { RAGManagementModal } from "./forms/rag-management-modal"
import { FilesModal } from "./forms/files-modal"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [liveDataOpen, setLiveDataOpen] = useState(false)
  const [dataManagementOpen, setDataManagementOpen] = useState(false)
  const [ragManagementOpen, setRAGManagementOpen] = useState(false)
  const [filesOpen, setFilesOpen] = useState(false)

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
      {
        title: "Knowledge",
        url: "#",
        icon: Frame,
        items: [
          { 
            title: "Upload Files", 
            url: "#",
            onClick: () => setFilesOpen(true)
          },
          { 
            title: "Connect Live Data", 
            url: "#",
            onClick: () => setLiveDataOpen(true)
          },
          { 
            title: "Library", 
            url: "#",
            onClick: () => setRAGManagementOpen(true)
          },
        ],
      },
    ],
    projects: [
      { name: "Design Engineering", url: "#", icon: Frame, },
      { name: "Sales & Marketing", url: "#", icon: PieChart, },
      { name: "Travel", url: "#", icon: Map, },
    ],
  }

  // Update navMain items to include onClick handlers
  const navMainWithHandlers = data.navMain.map(section => {
    if (section.title === "Knowledge") {
      return {
        ...section,
        items: section.items.map(item => {
          switch (item.title) {
            case "Files":
              return { ...item, onClick: () => setFilesOpen(true) }
            case "Live Data":
              return { ...item, onClick: () => setLiveDataOpen(true) }
            case "Library":
              return { ...item, onClick: () => setRAGManagementOpen(true) }
            default:
              return item
          }
        })
      }
    }
    return section
  })

  return (
    <>
      <Sidebar collapsible="icon" {...props}>
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
          <NavMain items={navMainWithHandlers} />
          <NavProjects projects={data.projects} />
        </SidebarContent>
        <SidebarFooter>
          <NavUser user={data.user} />
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <FilesModal 
        open={filesOpen}
        onOpenChange={setFilesOpen}
      />
      <LiveDataModal 
        open={liveDataOpen}
        onOpenChange={setLiveDataOpen}
      />
      <RAGManagementModal
        open={ragManagementOpen}
        onOpenChange={setRAGManagementOpen}
      />
    </>
  )
}
