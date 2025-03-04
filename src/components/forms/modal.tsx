import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import React, { useState } from "react"
import { type FormHookInstance } from "./hooks"

type ControllerType = ReturnType<typeof useModal>

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  controller?: ControllerType
  title?: string
  description?: string
  // footer?: React.ReactNode
  form?: FormHookInstance
}

function EmptyContext(props: any) {
  return <>
    {props.children}
  </>
}

export function Modal(props: Props) {

  const { title, controller: modalController, description, form, children, ...rest } = props
  let controller: ControllerType = modalController || form?.modal
  const { open, setOpen } = controller
  const Context = form?.context || EmptyContext

  let footer = null
  let SubmitButton: any = form?.SubmitButton

  React.Children.forEach(children, (child: any) => {
    if (child.type.displayName == "DialogFooter") footer = child
  })

  function onOpenChange(open: boolean) {
    setOpen(open)
    if (!open && form) {
      form.methods.reset()
    }
  }

  if (!footer) {
    footer = <DialogFooter>
      <SubmitButton />
    </DialogFooter>
  }


  return <Dialog open={open} onOpenChange={onOpenChange} modal>
    <DialogContent {...rest} >
      <DialogHeader>
        {title && <DialogTitle>{title}</DialogTitle>}
        {description && <DialogDescription>Make changes to your profile here. Click save when you're done.</DialogDescription>}
      </DialogHeader>
      <Context>
        {children}
      </Context>
      {footer}
      {/* {props.footer} */}
    </DialogContent>
  </Dialog>
}

Modal.Footer = DialogFooter

export function useModal() {

  const [open, setOpen] = useState(false)

  const modal = {
    open,
    show() {
      setOpen(true)
    },
    hide() {
      setOpen(false)
    },
    setOpen,
  }
  return modal
}


