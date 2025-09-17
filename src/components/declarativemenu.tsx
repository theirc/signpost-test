import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuPortal, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

declare global {
  interface DropdownMenuContent {
    title?: string
    icon?: any
    action?: () => void
    items?: DropdownMenuContent[]
  }
  type DropdownMenuContents = DropdownMenuContent[]
}

interface Props {
  children: any
  menu: DropdownMenuContents
}

function RenderMenu({ menu }: { menu: DropdownMenuContents }) {

  return menu.map((item, index) => {
    if (item.items) {
      return <DropdownMenuSub>
        <DropdownMenuSubTrigger>{item.title}</DropdownMenuSubTrigger>
        <DropdownMenuPortal>
          <DropdownMenuSubContent>
            <RenderMenu menu={item.items} />
          </DropdownMenuSubContent>
        </DropdownMenuPortal>
      </DropdownMenuSub>
    }
    return <DropdownMenuItem key={index} onClick={item.action}>
      {item.icon}
      {item.title}
    </DropdownMenuItem>
  })

}

export function DeclarativeMenu({ children, menu }: Props) {

  return <DropdownMenu>
    <DropdownMenuTrigger asChild>
      {children}
    </DropdownMenuTrigger>
    <DropdownMenuContent>
      <RenderMenu menu={menu} />
    </DropdownMenuContent>
  </DropdownMenu>


}