import { useFormContext } from "react-hook-form"
import { Button } from "../ui/button"
import { Check, Trash2 } from "lucide-react"
import { useEffect, useRef } from "react"
import { usePage } from "./hooks"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "../ui/alert-dialog"
import { useNavigate } from "react-router-dom"
import { supabase } from "@/lib/data"

interface Props {
  table: TableKeys
  onSuccess?: (() => void) | string
}

export function CRUDToolbar(props: Props) {

  let { table } = props
  const navigate = useNavigate()

  const { subscribe } = useFormContext()
  const { id, config } = usePage()
  const state = useRef({
    canSubmit: false
  })

  useEffect(() => {
    const callback = subscribe({
      formState: {
        values: true,
        isDirty: true,
        dirtyFields: true,
        touchedFields: true,
        isValid: true,
        errors: true,
        validatingFields: true,
        isValidating: true
      },
      callback: (s) => {
        state.current.canSubmit = true
        if (!s.isReady || s.disabled || s.isLoading || s.isValidating) {
          state.current.canSubmit = false
        }
      },
    })
    return () => callback()
  }, [subscribe])

  const { canSubmit } = state.current

  function success() {
    if (props.onSuccess) {
      if (typeof props.onSuccess === "string") {
        navigate(props.onSuccess)
      } else {
        props.onSuccess()
      }
    }
  }

  async function onDelete() {
    console.log("Deleting", id)
    await supabase.from(table as any).delete().eq('id', id)
    success()
  }

  return <div className="flex  gap-2">
    {id && <>
      <AlertDialog>
        <AlertDialogTrigger>
          <Button type="button" variant="destructive" className="rounded-full size-8" >
            <Trash2 strokeWidth={2} />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onDelete}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>}
    <Button type="submit" className="rounded-full size-8" disabled={!canSubmit}>
      <Check strokeWidth={4} />
    </Button>
  </div>


}

