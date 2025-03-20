import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import React, { useState } from "react"
import { type FormHookInstance } from "./hooks"
import { SubmitButton } from "./submitbutton"

type ControllerType = ReturnType<typeof useModal>

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  controller?: ControllerType
  title?: string
  description?: string
  form?: FormHookInstance
}

function EmptyContext(props: any) {
  return <>
    {props.children}
  </>
}

export function Modal(props: Props) {

  let { title, controller: modalController, description, form, children, ...rest } = props
  let controller: ControllerType = modalController || form?.modal
  const { open, setOpen } = controller

  if (!open) return null

  const Context = form?.context || EmptyContext


  let footer = null

  React.Children.forEach(children, (child: any) => {
    if (child.type.displayName == "DialogFooter") {
      footer = child
    }
  })

  if (footer) {
    //remove the footer from the children
    children = React.Children.map(children, (child: any) => {
      if (child.type.displayName == "DialogFooter") {
        return null
      }
      return child
    })
  }

  function onOpenChange(open: boolean) {
    setOpen(open)
    if (!open && form) {
      console.log("Resetting form")
      form.editing = false
      // console.log("Values reset: ", form.methods.getValues())
      form.reset()
      // console.log("Values reset: ", form.methods.getValues())
    }

  }

  if (!footer) {
    footer = <DialogFooter>
      <SubmitButton onClick={async () => await form?.submit()} />
    </DialogFooter>
  }

  return <Dialog open={open} onOpenChange={onOpenChange} modal >
    <DialogContent {...rest}>
      <DialogHeader>
        {title && <DialogTitle>{title}</DialogTitle>}
        {description && <DialogDescription>Make changes to your profile here. Click save when you're done.</DialogDescription>}
      </DialogHeader>
      <Context>
        {children}
      </Context>
      {footer}
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


