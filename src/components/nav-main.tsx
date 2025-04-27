import { Brain, ChevronRight, type LucideIcon } from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger, } from "@/components/ui/collapsible"
import { SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem, useSidebar } from "@/components/ui/sidebar"
import { Link, useNavigate } from "react-router-dom"
import { usePermissions } from "@/lib/hooks/usePermissions"

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
  const { canRead, loading: permissionsLoading } = usePermissions()
  const { state } = useSidebar()
  const navigate = useNavigate()

  const handleIconClick = (event: React.MouseEvent, title: string) => {
    if (state === 'collapsed') {
      let targetUrl = "";
      switch (title) {
        case "Bots":
          targetUrl = "/bots";
          break;
        case "Evaluation":
          targetUrl = "/logs";
          break;
        case "Knowledge":
          targetUrl = "/collections";
          break;
        case "Settings":
          targetUrl = "/settings/projects";
          break;
      }
      
      if (targetUrl) {
        event.preventDefault();
        event.stopPropagation();
        navigate(targetUrl);
      }
    }
  };

  return <SidebarGroup>
    <SidebarGroupLabel>Platform</SidebarGroupLabel>

    <SidebarMenu>
      {!permissionsLoading && canRead("agents") && (
        <SidebarMenuItem>
          <Link to="/" className="w-full">
            <SidebarMenuButton tooltip="Agents">
              <Brain />
              <span>Agents</span>
            </SidebarMenuButton>
          </Link>
        </SidebarMenuItem>
      )}

      {items.map((item) => {
        if (item.isLink) {
          return (
            <SidebarMenuItem key={item.title}>
              <Link to={item.url} className="w-full">
                <SidebarMenuButton tooltip={item.title}>
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          )
        }

        // Otherwise, render the collapsible menu item
        return (
          <Collapsible key={item.title} asChild defaultOpen={item.isActive} className="group/collapsible">
            <SidebarMenuItem>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton 
                  tooltip={item.title} 
                  onClick={(e) => handleIconClick(e, item.title)}
                >
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
