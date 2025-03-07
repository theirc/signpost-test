import { Brain, ChevronRight, type LucideIcon } from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger, } from "@/components/ui/collapsible"
import { SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem, } from "@/components/ui/sidebar"
import { Link } from "react-router-dom"

interface Props {
  items: {
    title: string
    url: string
    icon?: LucideIcon
    isActive?: boolean
    isLink?: ConstrainBoolean
    items?: {
      title: string
      url: string
      onClick?: () => void
    }[]
  }[]
}

export function NavMain({ items }: Props) {
  return <SidebarGroup>
    <SidebarGroupLabel>Platform</SidebarGroupLabel>

    <SidebarMenu>

      <Link to={"/"}>
        <SidebarMenuItem >
          <SidebarMenuButton tooltip="Agents">
            <Brain />Agents
          </SidebarMenuButton>
        </SidebarMenuItem>
      </Link>
      {items.map((item) => {
        if (item.isLink) {
          return (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton tooltip={item.title}>
                {item.icon && <item.icon />}
                <Link to={item.url}>
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )
        }

        // Otherwise, render the collapsible menu item
        return (
          <Collapsible key={item.title} asChild defaultOpen={item.isActive} className="group/collapsible">
            <SidebarMenuItem>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton tooltip={item.title}>
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                  <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  {item.items?.map((subItem) => (
                    <SidebarMenuSubItem key={subItem.title}>
                      {subItem.onClick ? (
                        <SidebarMenuSubButton onClick={subItem.onClick}>
                          <span>{subItem.title}</span>
                        </SidebarMenuSubButton>
                      ) : (
                        <SidebarMenuSubButton asChild>
                          <Link to={subItem.url}>
                            <span>{subItem.title}</span>
                          </Link>
                        </SidebarMenuSubButton>
                      )}
                    </SidebarMenuSubItem>
                  ))}
                </SidebarMenuSub>
              </CollapsibleContent>
            </SidebarMenuItem>
          </Collapsible>
        )
      })}
    </SidebarMenu>
  </SidebarGroup>
}
