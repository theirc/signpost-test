import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Loader2, RefreshCcw, Database } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Collection, CollectionWithSourceCount } from "./types"
import { CollectionsTable } from "./components/collections-table"
import { DeleteCollectionDialog } from "./components/delete-collection-dialog"
import { EditCollectionDialog } from "./components/edit-collection-dialog"
import { useCollections, useCollectionSources } from "./collections-logic"

export default function Knowledge() {
  // State
  const [collectionToDelete, setCollectionToDelete] = useState<Collection | null>(null)
  const [collectionToEdit, setCollectionToEdit] = useState<Collection | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isGeneratingVector, setIsGeneratingVector] = useState(false)
  
  // Hooks
  const { toast } = useToast()
  const { 
    collections, 
    loading: collectionsLoading, 
    fetchCollections,
    generateCollectionVector,
    collectionSourceCounts
  } = useCollections()
  
  const { collectionSources } = useCollectionSources()

  // Handlers
  const handleRefresh = () => {
    fetchCollections()
  }

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
    
    setIsGeneratingVector(true)
    try {
      toast({
        title: "Vector Generation Started",
        description: "Vector generation is running in the background. This may take some time depending on the number of sources.",
        duration: 5000,
      })
      
      const { success, error, partialSuccess, results } = await generateCollectionVector(collection.id)
      
      if (!success && !partialSuccess) {
        throw error || new Error('Vector generation failed')
      }
      
      if (partialSuccess && results) {
        // Some vectors were generated, but some failed
        toast({
          title: "Vector Generation Partially Complete",
          description: `Successfully generated ${results.successful} vectors, but failed for ${results.failed} sources.`,
          duration: 5000,
        })
      } else if (success) {
        // All vectors were generated successfully
        toast({
          title: "Vector Generation Complete",
          description: results 
            ? `Successfully generated ${results.successful} vectors.` 
            : "The vector generation process has been completed successfully.",
          duration: 3000,
        })
      }
      
      // Refresh collections to update vector status
      fetchCollections()
    } catch (error) {
      console.error('Error generating vectors:', error)
      toast({
        title: "Vector Generation Failed",
        description: error instanceof Error 
          ? `Error: ${error.message}` 
          : "There was an error generating vectors. Please try again.",
        variant: "destructive",
        duration: 5000,
      })
    } finally {
      setIsGeneratingVector(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 p-8 pt-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Collections</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage your collections and their sources.
            </p>
          </div>
          <div className="flex flex-col items-end space-y-2">
            <div className="flex space-x-2">
              <Button variant="outline" onClick={handleRefresh} disabled={collectionsLoading}>
                {collectionsLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCcw className="h-4 w-4 mr-2" />
                )}
                Refresh
              </Button>
              <Button onClick={handleCreateCollection}>
                Create Collection
              </Button>
            </div>
          </div>
        </div>

        <div>
          {collectionsLoading ? (
            <div className="w-full h-64 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <CollectionsTable
              collections={collections}
              onEdit={handleEditCollection}
              onDelete={handleDeleteCollection}
              onGenerateVector={handleGenerateVector}
              loading={collectionsLoading || isGeneratingVector}
            />
          )}
        </div>
      </div>

      <DeleteCollectionDialog
        collection={collectionToDelete}
        onClose={() => setCollectionToDelete(null)}
        onCollectionDeleted={fetchCollections}
      />

      <EditCollectionDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        collection={collectionToEdit}
        onSuccess={fetchCollections}
      />
    </div>
  )
}
