import { useState } from "react"
import { useTeamStore } from "@/lib/hooks/useTeam"
import { useToast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { SourceDisplay } from "./types"
import { useSupabase } from "@/hooks/use-supabase"

interface DeleteSourceDialogProps {
  source: SourceDisplay | null
  onClose: () => void
  onSourceDeleted: () => void
}

export function DeleteSourceDialog({ source, onClose, onSourceDeleted }: DeleteSourceDialogProps) {
  const [deleting, setDeleting] = useState(false)
  const { toast } = useToast()

  const handleDelete = async () => {
    if (!source) return

    try {
      setDeleting(true)
      const selectedTeam = useTeamStore.getState().selectedTeam
      if (!selectedTeam) {
        throw new Error('No team selected')
      }

      // First, delete any live data elements
      const { error: elementsError } = await useSupabase()
        .from('live_data_elements')
        .delete()
        .eq('source_config_id', source.id)
        .eq('team_id', selectedTeam.id)

      if (elementsError) {
        console.error('Error deleting live data elements:', elementsError)
        throw elementsError
      }

      // Then, delete any source configs
      const { error: configError } = await useSupabase()
        .from('source_configs')
        .delete()
        .eq('source', source.id)
        .eq('team_id', selectedTeam.id)

      if (configError) {
        console.error('Error deleting source configs:', configError)
        throw configError
      }

      // Finally, delete the source itself
      const { error: sourceError } = await useSupabase()
        .from('sources')
        .delete()
        .eq('id', source.id)
        .eq('team_id', selectedTeam.id)

      if (sourceError) {
        console.error('Error deleting source:', sourceError)
        throw sourceError
      }

      toast({
        title: "Success",
        description: "Source and all related data deleted successfully"
      })

      onSourceDeleted()
    } catch (error) {
      console.error('Error deleting source:', error)
      toast({
        title: "Error",
        description: "Failed to delete source and related data",
        variant: "destructive"
      })
    } finally {
      setDeleting(false)
      onClose()
    }
  }

  return (
    <AlertDialog open={!!source} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete the source "{source?.name}". This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleting}
            className="bg-red-500 hover:bg-red-600"
          >
            {deleting ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
} 