import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Loader2, RefreshCcw, Database } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Collection, CollectionWithSourceCount } from "./types"
import { CollectionsTable } from "./components/collections-table"
import { DeleteCollectionDialog } from "./components/delete-collection-dialog"
import { EditCollectionDialog } from "./components/edit-collection-dialog"
import { useCollections, useCollectionSources } from "./collections-logic"
import { downloadCollectionSources } from "./download-utils"

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
        // Some vectors were generated, but some failed - show detailed error information
        const errorDetails = error?.message || `${results.failed} sources failed to process`
        
        toast({
          title: "Vector Generation Partially Complete",
          description: `Successfully generated ${results.successful} vectors, but failed for ${results.failed} sources. ${errorDetails}`,
          variant: "destructive",
          duration: 10000,
        })
        
        // If there are specific error types, show additional guidance
        if (error?.message.includes('too large') || error?.message.includes('token limit')) {
          toast({
            title: "Large Sources Detected",
            description: "Some sources are too large for embedding. Consider splitting them into smaller chunks before vectorization.",
            variant: "destructive",
            duration: 8000,
          })
        }
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
      
      // Provide detailed error message based on the error content
      let errorDescription = "There was an error generating vectors. Please try again."
      
      if (error instanceof Error) {
        const errorMsg = error.message.toLowerCase()
        
        if (errorMsg.includes('token') || errorMsg.includes('too large')) {
          errorDescription = `Error: ${error.message}. Some sources may be too large and need to be split into smaller chunks.`
        } else if (errorMsg.includes('embedding')) {
          errorDescription = `Embedding generation failed: ${error.message}. Check your API configuration.`
        } else if (errorMsg.includes('database') || errorMsg.includes('supabase')) {
          errorDescription = `Database error: ${error.message}. Please check your connection.`
        } else {
          errorDescription = `Error: ${error.message}`
        }
      }
      
      toast({
        title: "Vector Generation Failed",
        description: errorDescription,
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
            onDownload={handleDownloadCollection}
            loading={collectionsLoading || isGeneratingVector}
          />
        )}
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
