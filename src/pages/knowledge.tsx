import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import React, { useEffect, useState, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MoreHorizontal, Pencil, Trash, Book, Loader2, RefreshCcw } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { SourcesTable, type Source as SourceDisplay } from "@/components/sources-table"
import { useCollections, Collection } from "@/hooks/use-collections"
import { useCollectionSources } from "@/hooks/use-collection-sources"
import { useSources, Source } from "@/hooks/use-sources"
import { useSourceTags } from "@/hooks/use-source-tags"
import { useSupabase } from "@/hooks/use-supabase"

export function CollectionsManagement() {
  // Supabase hooks
  const { collections, addCollection, deleteCollection, loading: collectionsLoading, updateCollection } = useCollections()
  const { 
    getSourcesForCollection, 
    addSourceToCollection, 
    removeSourceFromCollection, 
    loading: collectionSourcesLoading 
  } = useCollectionSources()
  const { sources, loading: sourcesLoading, fetchSources, deleteSource } = useSources()
  const { getTagsForSource } = useSourceTags()
  const supabase = useSupabase()
  
  // Local state
  const [selectedSources, setSelectedSources] = useState<string[]>([])
  const [newCollectionName, setNewCollectionName] = useState("")
  const [collectionSources, setCollectionSources] = useState<{ [key: string]: Source[] }>({})
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [sourcesDisplay, setSourcesDisplay] = useState<SourceDisplay[]>([])
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [isMapping, setIsMapping] = useState(false)

  // Define loadCollectionSources at component level using useCallback
  const loadCollectionSources = useCallback(async (collectionId?: string) => {
    console.log(`[loadCollectionSources] ${collectionId ? 'Loading specific collection: ' + collectionId : 'Loading all collections'}`);
    
    try {
      setLoading(true);
      
      if (collectionId) {
        // Load just one collection
        console.log(`[loadCollectionSources] Loading sources for collection: ${collectionId}`);
        const sources = await getSourcesForCollection(collectionId);
        console.log(`[loadCollectionSources] Found ${sources.length} sources for collection ${collectionId}`);
        
        setCollectionSources(prev => ({
          ...prev,
          [collectionId]: sources
        }));
      } else if (collections.length > 0) {
        // Initial load of collections that haven't been loaded yet
        const pendingCollections = collections.filter(collection => 
          !collectionSources[collection.id] || collectionSources[collection.id].length === 0
        );
        
        console.log(`[loadCollectionSources] Loading ${pendingCollections.length} pending collections`);
        
        if (pendingCollections.length === 0) {
          console.log("[loadCollectionSources] No pending collections to load");
          return;
        }
        
        const newCollectionSources = {...collectionSources};
        
        // Load each collection one by one
        for (const collection of pendingCollections) {
          try {
            console.log(`[loadCollectionSources] Loading sources for collection: ${collection.id} (${collection.name})`);
            const sources = await getSourcesForCollection(collection.id);
            console.log(`[loadCollectionSources] Found ${sources.length} sources for collection ${collection.id}`);
            newCollectionSources[collection.id] = sources;
          } catch (error) {
            console.error(`[loadCollectionSources] Error loading sources for collection ${collection.id}:`, error);
          }
        }
        
        setCollectionSources(newCollectionSources);
      }
    } catch (error) {
      console.error("[loadCollectionSources] Error:", error);
    } finally {
      setLoading(false);
    }
  }, [collections, getSourcesForCollection]);

  // When collections change, load their sources
  useEffect(() => {
    if (collections.length > 0 && !collectionsLoading) {
      // Only load collections once when they are first loaded
      const pendingCollections = collections.filter(collection => 
        !collectionSources[collection.id]
      );
      
      if (pendingCollections.length > 0) {
        console.log(`[Initial Load] Loading sources for ${pendingCollections.length} new collections`);
        loadCollectionSources();
      }
    }
  }, [collections]);

  // Real-time subscription to sources
  useEffect(() => {
    // Subscribe to changes in the sources table
    const channel = supabase
      .channel('sources-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'sources' }, 
        payload => {
          console.log('Real-time update received:', payload);
          // Refresh sources when changes occur
          fetchSources();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, fetchSources]);

  // Map DB sources to display format
  useEffect(() => {
    // Skip if already in the middle of mapping
    if (isMapping) return;
    
    const mapSources = async () => {
      if (sourcesLoading || !sources.length) {
        console.log("Skipping mapping - sources loading or empty");
        return;
      }
      
      try {
        console.log("Starting source mapping", { count: sources.length });
        setIsMapping(true);
        setLoading(true);
        
        const displaySources: SourceDisplay[] = [];
        
        // Process in batches to avoid UI blocking
        for (let i = 0; i < sources.length; i++) {
          const source = sources[i];
          
          // Parse tags from the database format
          let tags: string[] = [];
          if (source.tags) {
            if (typeof source.tags === 'string') {
              // Handle PostgreSQL array format: '{tag1,tag2}' or '["tag1","tag2"]'
              try {
                // First try JSON parse for ["tag1","tag2"] format
                tags = JSON.parse(source.tags);
              } catch {
                // If that fails, try PostgreSQL {tag1,tag2} format
                tags = source.tags
                  .replace('{', '')
                  .replace('}', '')
                  .split(',')
                  .map(tag => tag.trim())
                  .filter(tag => tag.length > 0);
              }
            } else if (Array.isArray(source.tags)) {
              tags = source.tags;
            }
          }
          
          displaySources.push({
            id: source.id,
            name: source.name,
            type: source.type,
            lastUpdated: source.last_updated || source.created_at,
            content: source.content,
            tags: tags
          });
        }
        
        console.log("Mapping complete, setting display sources", { count: displaySources.length });
        setSourcesDisplay(displaySources);
      } catch (error) {
        console.error("Error mapping sources:", error);
      } finally {
        setLoading(false);
        setIsMapping(false);
      }
    };
    
    // Only map if we have sources to map
    if (sources.length > 0 && !sourcesLoading) {
      mapSources();
    }
  }, [sources, sourcesLoading]);

  // Handle collection toggle selection
  const handleToggleSelect = (id: string) => {
    setSelectedSources(prev => 
      prev.includes(id) 
        ? prev.filter(sourceId => sourceId !== id)
        : [...prev, id]
    );
  };

  // Update handleSelectAll to accept a ChangeEvent
  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    // Get the checkbox checked value from the event
    const isSelected = event.target.checked;
    
    if (isSelected) {
      setSelectedSources(sourcesDisplay.map(source => source.id));
    } else {
      setSelectedSources([]);
    }
  };

  // Manually refresh sources
  const handleRefreshSources = () => {
    fetchSources();
    setRefreshTrigger(prev => prev + 1);
    loadCollectionSources(); // Use the new function
  };

  const handleSaveCollection = async () => {
    if (newCollectionName && selectedSources.length > 0) {
      setLoading(true)
      console.log(`[Save Collection] Starting to save collection: ${newCollectionName} with ${selectedSources.length} sources`)
      
      try {
        // Add collection to database
        console.log(`[Save Collection] Adding collection to database: ${newCollectionName}`)
        const newCollection = await addCollection(newCollectionName)
        console.log(`[Save Collection] Collection created with ID: ${newCollection?.id}`)
        
        if (newCollection) {
          // Use Promise.all to add sources in parallel rather than sequentially
          console.log(`[Save Collection] Adding ${selectedSources.length} sources to collection ${newCollection.id}`)
          
          // Track individual source additions
          const addPromises = selectedSources.map(sourceId => {
            console.log(`[Save Collection] Starting to add source ${sourceId} to collection ${newCollection.id}`)
            return addSourceToCollection(newCollection.id, sourceId)
              .then(result => {
                console.log(`[Save Collection] Source ${sourceId} added to collection ${newCollection.id}: ${result ? 'SUCCESS' : 'FAILED'}`)
                return result
              })
              .catch(err => {
                console.error(`[Save Collection] Failed to add source ${sourceId} to collection:`, err);
                return false;
              })
          });
          
          const results = await Promise.all(addPromises);
          console.log(`[Save Collection] All source additions completed. Results:`, results);
          
          // Load sources for this specific collection
          console.log(`[Save Collection] Loading sources for new collection ${newCollection.id}`)
          await loadCollectionSources(newCollection.id);
          console.log(`[Save Collection] Collection sources loaded`)
        }
        
        console.log(`[Save Collection] Process completed successfully`)
        // Use resetEditState instead of manually resetting each state
        resetEditState()
      } catch (error) {
        console.error('[Save Collection] Error creating collection:', error)
        resetEditState() // Make sure we reset everything on error
      }
    }
  }

  const handleEditCollection = async (collection: Collection) => {
    setEditingCollection(collection)
    setNewCollectionName(collection.name)
    
    // Load sources for this collection if not already loaded
    if (!collectionSources[collection.id]) {
      console.log(`[Edit Collection] Loading sources for collection ${collection.id}`);
      await loadCollectionSources(collection.id);
    }
    
    // Set selected sources based on collection's sources
    const collectionSourceIds = collectionSources[collection.id]?.map(source => source.id) || []
    setSelectedSources(collectionSourceIds)
    
    setIsEditModalOpen(true)
  }

  const handleUpdateCollection = useCallback(async () => {
    if (!editingCollection) return

    try {
      setLoading(true)
      
      // Update collection name if it has changed
      if (newCollectionName !== editingCollection.name) {
        console.log(`[Update Collection] Updating collection name from "${editingCollection.name}" to "${newCollectionName}"`)
        const nameUpdateSuccess = await updateCollection(editingCollection.id, newCollectionName)
        if (!nameUpdateSuccess) {
          console.error('[Update Collection] Failed to update collection name')
          setLoading(false)
          return
        }
      }
      
      // Get current sources for this collection
      const currentSources = collectionSources[editingCollection.id] || []
      const currentSourceIds = currentSources.map(source => source.id)
      console.log(`[Update Collection] Current sources: ${currentSourceIds.length}, Selected sources: ${selectedSources.length}`)
      
      // Find sources to add and remove
      const sourcesToAdd = selectedSources.filter(id => !currentSourceIds.includes(id))
      const sourcesToRemove = currentSourceIds.filter(id => !selectedSources.includes(id))
      console.log(`[Update Collection] Sources to add: ${sourcesToAdd.length}, Sources to remove: ${sourcesToRemove.length}`)
      
      // Add new sources in parallel
      if (sourcesToAdd.length > 0) {
        console.log(`[Update Collection] Adding ${sourcesToAdd.length} sources`)
        const addPromises = sourcesToAdd.map(sourceId => {
          console.log(`[Update Collection] Starting to add source ${sourceId}`)
          return addSourceToCollection(editingCollection.id, sourceId)
            .then(result => {
              console.log(`[Update Collection] Source ${sourceId} added: ${result ? 'SUCCESS' : 'FAILED'}`)
              return result
            })
            .catch(err => {
              console.error(`[Update Collection] Failed to add source ${sourceId}:`, err)
              return false
            })
        })
        const addResults = await Promise.all(addPromises)
        console.log(`[Update Collection] Add operations completed with results:`, addResults)
      }
      
      // Remove unselected sources in parallel
      if (sourcesToRemove.length > 0) {
        console.log(`[Update Collection] Removing ${sourcesToRemove.length} sources`)
        const removePromises = sourcesToRemove.map(sourceId => {
          console.log(`[Update Collection] Starting to remove source ${sourceId}`)
          return removeSourceFromCollection(editingCollection.id, sourceId)
            .then(result => {
              console.log(`[Update Collection] Source ${sourceId} removed: ${result ? 'SUCCESS' : 'FAILED'}`)
              return result
            })
            .catch(err => {
              console.error(`[Update Collection] Failed to remove source ${sourceId}:`, err)
              return false
            })
        })
        const removeResults = await Promise.all(removePromises)
        console.log(`[Update Collection] Remove operations completed with results:`, removeResults)
      }
      
      // Refresh collection sources for this specific collection
      console.log(`[Update Collection] Refreshing sources for collection ${editingCollection.id}`)
      await loadCollectionSources(editingCollection.id);
      console.log(`[Update Collection] Collection sources refreshed.`)
      
      console.log(`[Update Collection] Process completed successfully`)
      resetEditState()
    } catch (error) {
      console.error('[Update Collection] Error updating collection:', error)
      resetEditState() // Make sure we reset everything on error
    }
  }, [editingCollection, newCollectionName, selectedSources, collectionSources, addSourceToCollection, removeSourceFromCollection, loadCollectionSources, updateCollection])

  const resetEditState = () => {
    setNewCollectionName("")
    setSelectedSources([])
    setEditingCollection(null)
    setIsEditModalOpen(false)
    setLoading(false) // Ensure loading is reset here
  }

  const handleDeleteCollection = async (id: string) => {
    setLoading(true)
    
    try {
      await deleteCollection(id)
      // Update local state
      setCollectionSources(prev => {
        const newState = { ...prev }
        delete newState[id]
        return newState
      })
    } catch (error) {
      console.error('Error deleting collection:', error)
    } finally {
      setLoading(false)
    }
  }

  // Define viewCollectionDetails function
  const viewCollectionDetails = (collection: Collection) => {
    // You can implement the details view logic here
    // For now, let's just log and maybe edit the collection
    console.log("Viewing details for collection:", collection);
    handleEditCollection(collection);
  };

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Knowledge Base</h1>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleRefreshSources}>
            <RefreshCcw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => {
            setIsEditModalOpen(true)
            setEditingCollection(null)
            setNewCollectionName("")
            setSelectedSources([])
          }}>
            Create Collection
          </Button>
        </div>
      </div>

      {collectionsLoading ? (
        <div className="w-full h-64 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {collections.map(collection => (
            <div 
              key={collection.id}
              className="border rounded-lg p-6 shadow-sm hover:shadow transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center">
                  <Book className="h-5 w-5 mr-2 text-primary" />
                  <h3 className="font-semibold text-lg">{collection.name}</h3>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEditCollection(collection)}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDeleteCollection(collection.id)}>
                      <Trash className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              <div className="text-sm text-muted-foreground mb-4">
                Created: {new Date(collection.created_at).toLocaleDateString()}
              </div>

              {collectionSources[collection.id]?.length ? (
                <div className="text-sm">
                  {collectionSources[collection.id].length} sources
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">No sources</div>
              )}
              
              <Button
                variant="outline"
                size="sm"
                className="mt-4 w-full"
                onClick={() => viewCollectionDetails(collection)}
              >
                View Details
              </Button>
            </div>
          ))}
        </div>
      )}

      <Dialog open={isEditModalOpen} onOpenChange={(open) => {
        if (!open) {
          // When closing the dialog, make sure to reset all states
          resetEditState();
        } else {
          setIsEditModalOpen(open);
        }
      }}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {editingCollection ? `Edit Collection: ${editingCollection.name}` : 'Create New Collection'}
            </DialogTitle>
            <DialogDescription>
              {editingCollection ? "Modify the collection name and select sources to include." : "Create a new collection by adding a name and selecting sources."}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto py-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="collection-name">Name</Label>
                <Input
                  id="collection-name"
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                  placeholder="Enter collection name"
                />
              </div>
              {sourcesLoading ? (
                <div className="flex justify-center items-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <SourcesTable 
                  sources={sourcesDisplay}
                  selectedSources={selectedSources}
                  onToggleSelect={handleToggleSelect}
                  onSelectAll={handleSelectAll}
                  showCheckboxes={true}
                  showActions={false}
                  showAddButton={false}
                />
              )}
            </div>
          </div>
          <DialogFooter className="flex-shrink-0">
            <Button variant="outline" onClick={resetEditState}>
              Cancel
            </Button>
            <Button 
              onClick={editingCollection ? handleUpdateCollection : handleSaveCollection}
              disabled={!newCollectionName || selectedSources.length === 0 || loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                editingCollection ? 'Save Changes' : 'Create Collection'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 