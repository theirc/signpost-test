import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { Collection, SourceDisplay } from "../types"
import { SourcesTable } from "./sources-table"
import { useTeamStore } from "@/lib/hooks/useTeam"
import { supabase } from "@/lib/agents/db"
import { useCollectionSources, useSources } from "../collections-logic"
import { transformSourcesForDisplay } from "../utils"

interface EditCollectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  collection: Collection | null
  onSuccess: () => void
}

export function EditCollectionDialog({
  open,
  onOpenChange,
  collection,
  onSuccess
}: EditCollectionDialogProps) {
  const [name, setName] = useState("")
  const [selectedSources, setSelectedSources] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const { selectedTeam } = useTeamStore()
  const { sources, loading: sourcesLoading } = useSources()
  const { 
    loadCollectionSources, 
    addSourcesToCollection, 
    removeSourcesFromCollection 
  } = useCollectionSources()

  // Reset form when dialog opens/closes or collection changes
  useEffect(() => {
    if (open && collection) {
      setName(collection.name)
      loadCollectionSourceIds()
    } else if (open) {
      // New collection
      setName("")
      setSelectedSources([])
    }
  }, [open, collection])

  // Load source IDs for the collection
  const loadCollectionSourceIds = async () => {
    if (!collection) return
    
    setLoading(true)
    try {
      const sources = await loadCollectionSources(collection.id)
      setSelectedSources(sources.map(source => source.id))
    } catch (error) {
      console.error("Error loading collection sources:", error)
      toast({
        title: "Error",
        description: "Failed to load collection sources",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Handle source selection toggle
  const handleToggleSource = (id: string) => {
    setSelectedSources(prev =>
      prev.includes(id)
        ? prev.filter(sourceId => sourceId !== id)
        : [...prev, id]
    )
  }

  // Handle select all sources
  const handleSelectAll = () => {
    // If all sources are already selected, deselect all
    // Otherwise, select all sources
    const allSourceIds = sources.map(source => source.id)
    const allSelected = allSourceIds.every(id => selectedSources.includes(id))
    
    if (allSelected) {
      setSelectedSources([])
    } else {
      setSelectedSources(allSourceIds)
    }
  }

  // Handle save collection
  const handleSave = async () => {
    if (!name.trim()) {
      toast({
        title: "Error",
        description: "Collection name is required",
        variant: "destructive"
      })
      return
    }

    if (selectedSources.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one source",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      if (collection) {
        // Update existing collection
        await updateCollection()
      } else {
        // Create new collection
        await createCollection()
      }
      
      toast({
        title: "Success",
        description: collection 
          ? "Collection updated successfully" 
          : "Collection created successfully"
      })
      
      onSuccess()
      onOpenChange(false)
    } catch (error) {
      console.error("Error saving collection:", error)
      toast({
        title: "Error",
        description: `Failed to ${collection ? 'update' : 'create'} collection`,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Create a new collection
  const createCollection = async () => {
    if (!selectedTeam) {
      throw new Error("No team selected")
    }

    // Add collection to database
    const { data: newCollection, error: addError } = await supabase.from('collections')
      .insert([{ name, team_id: selectedTeam.id }])
      .select()
    
    if (addError) throw addError
    if (!newCollection || newCollection.length === 0) {
      throw new Error("Failed to create collection")
    }

    // Add sources to collection
    const success = await addSourcesToCollection(
      newCollection[0].id, 
      selectedSources
    )
    
    if (!success) {
      throw new Error("Failed to add sources to collection")
    }
  }

  // Update an existing collection
  const updateCollection = async () => {
    if (!collection || !selectedTeam) {
      throw new Error("No collection or team selected")
    }

    // Update collection name if changed
    if (name !== collection.name) {
      const { error: updateError } = await supabase.from('collections')
        .update({ name })
        .eq('id', collection.id)
        .eq('team_id', selectedTeam.id)
      
      if (updateError) throw updateError
    }

    // Get current sources
    const sources = await loadCollectionSources(collection.id)
    const currentSourceIds = sources.map(source => source.id)
    
    // Find sources to add and remove
    const sourcesToAdd = selectedSources.filter(id => !currentSourceIds.includes(id))
    const sourcesToRemove = currentSourceIds.filter(id => !selectedSources.includes(id))
    
    // Add new sources
    if (sourcesToAdd.length > 0) {
      const addSuccess = await addSourcesToCollection(collection.id, sourcesToAdd)
      if (!addSuccess) {
        throw new Error("Failed to add sources to collection")
      }
    }
    
    // Remove unselected sources
    if (sourcesToRemove.length > 0) {
      const removeSuccess = await removeSourcesFromCollection(collection.id, sourcesToRemove)
      if (!removeSuccess) {
        throw new Error("Failed to remove sources from collection")
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[1000px] h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {collection ? `Edit Collection: ${collection.name}` : 'Create New Collection'}
          </DialogTitle>
          <DialogDescription>
            {collection 
              ? "Modify the collection name and select sources to include." 
              : "Create a new collection by adding a name and selecting sources."
            }
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto py-4 space-y-6">
          {/* Collection Name */}
          <div className="space-y-2">
            <Label htmlFor="collection-name">Collection Name</Label>
            <Input
              id="collection-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter collection name"
              disabled={loading}
            />
          </div>
          
          {/* Sources Selection */}
          <div className="space-y-2">
            <Label>Select Sources</Label>
            <SourcesTable
              sources={transformSourcesForDisplay(sources) ?? []}
              selectedSources={selectedSources}
              onSourceSelect={handleToggleSource}
              onSelectAll={handleSelectAll}
              loading={sourcesLoading || loading}
            />
          </div>
        </div>
        
        <DialogFooter className="flex-shrink-0">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!name.trim() || selectedSources.length === 0 || loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {collection ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              collection ? 'Update Collection' : 'Create Collection'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
