import { Avatar, AvatarFallback, AvatarImage, } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar, } from "@/components/ui/sidebar"
import { supabase } from "@/lib/agents/db"
import { User } from "@/pages/settings/teams"
import { BadgeCheck, Bell, ChevronsUpDown, CreditCard, LogOut, Sparkles, } from "lucide-react"
import { useNavigate } from "react-router-dom"

export function NavUser({ user }: { user: User }) {

  const { isMobile } = useSidebar()
  const navigate = useNavigate()

  return <SidebarMenu>
    <SidebarMenuItem>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
            <Avatar className="h-8 w-8" >
              <AvatarImage alt={`${user?.first_name} ${user?.last_name}`} />
              <AvatarFallback className="bg-blue-200">{`${user?.first_name?.split('')[0] || 'U'}${user?.last_name?.split('')[0] || 'U'}`}</AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">{`${user?.first_name} ${user?.last_name}`}</span>
              <span className="truncate text-xs">{user?.email}</span>
            </div>
            <ChevronsUpDown className="ml-auto size-4" />
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
          side={isMobile ? "bottom" : "right"}
          align="end"
          sideOffset={4}
        >
          <DropdownMenuGroup>
            <DropdownMenuItem>
              <Sparkles />
              Upgrade to Pro
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem>
              <BadgeCheck />
              Account
            </DropdownMenuItem>
            <DropdownMenuItem>
              <CreditCard />
              Billing
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Bell />
              Notifications
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => {
            supabase.auth.signOut()
            navigate('/login', { replace: true })
          }}>
            <LogOut />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  </SidebarMenu>

}
