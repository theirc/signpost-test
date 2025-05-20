import { useState } from "react"
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
import { Collection } from "../types"
import { useCollections } from "../collections-logic"

interface DeleteCollectionDialogProps {
  collection: Collection | null
  onClose: () => void
  onCollectionDeleted?: () => void
}

export function DeleteCollectionDialog({ 
  collection, 
  onClose, 
  onCollectionDeleted 
}: DeleteCollectionDialogProps) {
  const [deleting, setDeleting] = useState(false)
  const { toast } = useToast()
  const { deleteCollection } = useCollections()

  const handleDelete = async () => {
    if (!collection) return

    try {
      setDeleting(true)
      
      const { success, error } = await deleteCollection(collection.id)
      
      if (!success) {
        throw error || new Error('Failed to delete collection')
      }

      toast({
        title: "Success",
        description: "Collection and all related data deleted successfully"
      })

      if (onCollectionDeleted) {
        onCollectionDeleted()
      }
    } catch (error) {
      console.error('Error deleting collection:', error)
      toast({
        title: "Error",
        description: "Failed to delete collection and related data",
        variant: "destructive"
      })
    } finally {
      setDeleting(false)
      onClose()
    }
  }

  return (
    <AlertDialog open={!!collection} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete the collection "{collection?.name}". This action cannot be undone.
            {collection ? " Any bots using this collection will be unlinked." : ""}
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
