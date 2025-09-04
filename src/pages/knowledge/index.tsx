import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Collection, CollectionWithSourceCount } from "./types"
import { CollectionsTable } from "./components/collections-table"
import { DeleteCollectionDialog } from "./components/delete-collection-dialog"
import { EditCollectionDialog } from "./components/edit-collection-dialog"
import { downloadCollectionSources } from "./download-utils"
import { generateCollectionVector } from "./vector-generation"
import { useQueryClient } from "@tanstack/react-query"
import { HighlightText } from "@/components/ui/shadcn-io/highlight-text"
import { useTeamStore } from "@/lib/hooks/useTeam"

export default function Knowledge() {
  // State
  const [collectionToDelete, setCollectionToDelete] = useState<Collection | null>(null)
  const [collectionToEdit, setCollectionToEdit] = useState<Collection | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isGeneratingVector, setIsGeneratingVector] = useState(false)
  
  // Hooks
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { selectedTeam } = useTeamStore()

  // Handlers

  const handleCreateCollection = () => {
    setCollectionToEdit(null)
    setIsEditDialogOpen(true)
  }

  const handleEditCollection = (collection: CollectionWithSourceCount) => {
    setCollectionToEdit(collection)
    setIsEditDialogOpen(true)
  }

  const handleDeleteCollection = (collection: CollectionWithSourceCount) => {
    setCollectionToDelete(collection)
  }

  const handleGenerateVector = async (collection: CollectionWithSourceCount) => {
    if (isGeneratingVector) return
    
    if (!selectedTeam) {
      toast({
        title: "Error",
        description: "No team selected. Please select a team to generate vectors.",
        variant: "destructive",
      })
      return
    }
    
    setIsGeneratingVector(true)
    try {
      toast({
        title: "Vector Generation Started",
        description: "Vector generation is running in the background. This may take some time depending on the number of sources.",
        duration: 5000,
      })
      const result = await generateCollectionVector(collection.id, selectedTeam.id)
      if (result.success) {
        toast({
          title: "Vector Generation Complete",
          description: result.results
            ? `Successfully generated ${result.results.successful} vectors.`
            : "The vector generation process has been completed successfully.",
          duration: 3000,
        })
      } else if (result.partialSuccess) {
        toast({
          title: "Vector Generation Partially Complete",
          description: result.error?.message || "Some sources failed to process.",
          variant: "destructive",
          duration: 8000,
        })
      } else {
        toast({
          title: "Vector Generation Failed",
          description: result.error?.message || "There was an error generating vectors. Please try again.",
          variant: "destructive",
          duration: 8000,
        })
      }
      // Refetch the paginated table data
      queryClient.invalidateQueries({ queryKey: ['supabase-table', 'collections_with_counts'] })
    } catch (error) {
      console.error('Error generating vectors:', error)
      toast({
        title: "Vector Generation Failed",
        description: error instanceof Error ? error.message : "There was an error generating vectors. Please try again.",
        variant: "destructive",
        duration: 8000,
      })
    } finally {
      setIsGeneratingVector(false)
    }
  }

  const handleDownloadCollection = async (collection: CollectionWithSourceCount) => {
    try {
      toast({
        title: "Download Started",
        description: "Preparing your collection sources for download...",
        duration: 3000,
      })
      
      await downloadCollectionSources(collection.id, collection.name)
      
      toast({
        title: "Download Complete",
        description: `Successfully downloaded sources from "${collection.name}" collection.`,
        duration: 5000,
      })
    } catch (error) {
      console.error('Error downloading collection sources:', error)
      
      let errorDescription = "There was an error downloading the collection sources. Please try again."
      
      if (error instanceof Error) {
        if (error.message.includes('No sources found')) {
          errorDescription = "This collection has no sources to download."
        } else if (error.message.includes('No sources with content')) {
          errorDescription = "This collection has no sources with content to download."
        } else {
          errorDescription = `Error: ${error.message}`
        }
      }
      
      toast({
        title: "Download Failed",
        description: errorDescription,
        variant: "destructive",
        duration: 8000,
      })
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 p-8 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-3"><HighlightText text="Collections" className="text-4xl font-bold" /></h1>
            <p className="text-lg text-gray-600 font-medium leading-relaxed">
              Manage your collections and their sources.
            </p>
          </div>
          <div className="flex flex-col items-end space-y-2">
            <div className="flex space-x-2">
              <Button onClick={handleCreateCollection} className="rounded-lg">
                Create Collection
              </Button>
            </div>
          </div>
        </div>

        <CollectionsTable
          onEdit={handleEditCollection}
          onDelete={handleDeleteCollection}
          onGenerateVector={handleGenerateVector}
          onDownload={handleDownloadCollection}
          loading={isGeneratingVector}
        />
      </div>

      <DeleteCollectionDialog
        collection={collectionToDelete}
        onClose={() => setCollectionToDelete(null)}
      />

      <EditCollectionDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        collection={collectionToEdit}
        onSuccess={() => {}}
      />
    </div>
  )
}
