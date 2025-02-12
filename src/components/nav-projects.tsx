import { Folder, Forward, MoreHorizontal, Trash2, Brain, type LucideIcon, ListTree, } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, } from "@/components/ui/dropdown-menu"
import { SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuAction, SidebarMenuButton, SidebarMenuItem, SidebarMenuSubButton, SidebarMenuSubItem, useSidebar, } from "@/components/ui/sidebar"
import { avaialableNodes } from "./flow/nodes/nodetypes"

interface Props {
  projects: {
    name: string
    url: string
    icon: LucideIcon
  }[]
}

export function NavProjects({ projects }: Props) {

  const onDragStart = (event: React.DragEvent<HTMLAnchorElement>, nodeType) => {
    event.dataTransfer.setData('nodeType', nodeType)
    event.dataTransfer.effectAllowed = 'move'
  }

  return <SidebarGroup className="group-data-[collapsible=icon]:hidden">
    <SidebarGroupLabel>Workers</SidebarGroupLabel>
    <SidebarMenu>

      {Object.values(avaialableNodes).map((node) => (
        <a href={"#"} key={node.name} onDragStart={(event) => onDragStart(event, node.name)} draggable>
          <SidebarMenuItem>
            <SidebarMenuButton>
              <node.icon />
              <span>{node.title}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </a>
      ))}

    </SidebarMenu>
  </SidebarGroup>

}
