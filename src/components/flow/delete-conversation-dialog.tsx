import { useState } from "react"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/agents/db"
import { useTeamStore } from "@/lib/hooks/useTeam"
import { app } from "@/lib/app"

interface DeleteConversationDialogProps {
  isOpen: boolean
  onClose: () => void
  onHistoryCleared: () => void
}

export function DeleteConversationDialog({ 
  isOpen, 
  onClose, 
  onHistoryCleared 
}: DeleteConversationDialogProps) {
  const [deleting, setDeleting] = useState(false)
  const { toast } = useToast()
  const { selectedTeam } = useTeamStore()

  const handleDelete = async () => {
    if (!app.agent?.debuguuid) return

    try {
      setDeleting(true)
      
      // Delete both state and history using the same logic as "Reset State and History"
      await supabase.from("states").delete().eq("id", app.agent.debuguuid)
      await supabase.from("history").delete().eq("uid", app.agent.debuguuid)

      toast({
        title: "Success",
        description: "Conversation history and state cleared successfully"
      })

      onHistoryCleared()
    } catch (error) {
      console.error('Error clearing conversation history and state:', error)
      toast({
        title: "Error",
        description: "Failed to clear conversation history and state",
        variant: "destructive"
      })
    } finally {
      setDeleting(false)
      onClose()
    }
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Reset State and History</AlertDialogTitle>
          <AlertDialogDescription>
            Are you absolutely sure? This action cannot be undone. This will permanently delete the Agent state and conversation history.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleting}
            className="bg-red-500 hover:bg-red-600"
          >
{deleting ? "Resetting..." : "Continue"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
