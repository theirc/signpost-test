import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuPortal, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "./ui/alert-dialog"
import React, { useRef } from "react"

declare global {
  interface DropdownMenuContent {
    title?: string
    icon?: any
    action?: (v?: any) => void
    ask?: string
    items?: DropdownMenuContent[]
  }
  type DropdownMenuContents = DropdownMenuContent[]
}


interface Props {
  children: any
  menu: DropdownMenuContents
  reference?: any
  onActionExecuted?: () => Promise<void>
}


export function DeclarativeMenu({ children, menu, reference, onActionExecuted }: Props) {

  const state = useRef({
    ask: "",
    action: () => { },
  })
  const [open, setOpen] = React.useState(false)

  function onShowDialog(ask: string, action: (v?: any) => void) {
    state.current.ask = ask
    state.current.action = action
    setOpen(true)
  }
  async function onExecuteAction() {
    state.current.action()
    setOpen(false)
    if (onActionExecuted) await onActionExecuted()
  }

  return <>
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {children}
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <RenderMenu menu={menu} reference={reference} showDialog={onShowDialog} />
      </DropdownMenuContent>
    </DropdownMenu>
    <AlertDialog open={open} onOpenChange={setOpen} >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{state.current.ask}</AlertDialogTitle>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onExecuteAction}>Continue</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </>


}

interface RenderMenuProps {
  menu: DropdownMenuContents
  reference?: any
  showDialog?: (ask: string, action: (v?: any) => void) => void
  onActionExecuted?: () => Promise<void>
}

function RenderMenu({ menu, reference, showDialog, onActionExecuted }: RenderMenuProps) {

  return menu.map((item, index) => {

    if (item.items) {
      return <DropdownMenuSub>
        <DropdownMenuSubTrigger>{item.title}</DropdownMenuSubTrigger>
        <DropdownMenuPortal>
          <DropdownMenuSubContent>
            <RenderMenu menu={item.items} showDialog={showDialog} onActionExecuted={onActionExecuted} />
          </DropdownMenuSubContent>
        </DropdownMenuPortal>
      </DropdownMenuSub>
    }

    if (!item.ask) {
      return <DropdownMenuItem key={index} onClick={(e) => {
        e.stopPropagation()
        item.action(reference)
        if (onActionExecuted) onActionExecuted()
      }}>
        {item.icon}
        {item.title}
      </DropdownMenuItem>
    }

    return <DropdownMenuItem key={index} onClick={(e) => {
      e.stopPropagation()
      showDialog(item.ask, () => item.action(reference))
    }}>
      {item.icon}
      {item.title}
    </DropdownMenuItem>
  })

}


