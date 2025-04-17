import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import React, { useEffect, useState, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MoreHorizontal, Pencil, Trash, Book, Loader2, RefreshCcw, Database } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useSupabase } from "@/hooks/use-supabase"
import { formatDate } from "@/components/source_input/utils"
import { format } from "date-fns"
import SearchFilter from "@/components/ui/search-filter"
import SelectFilter from "@/components/ui/select-filter"
import TagsFilter from "@/components/ui/tags-filter"
import { ColumnDef } from "@tanstack/react-table"
import CustomTable from "@/components/ui/custom-table"
import { 
  SourceDisplay, 
  transformSourcesForDisplay,
  Source,
  fetchSources,
  deleteSource,
  fetchCollections,
  addCollection,
  deleteCollection,
  updateCollection,
  generateCollectionVector,
  Collection,
  getSourcesForCollection,
  addSourceToCollection,
  removeSourceFromCollection,
  getTagsForSource
} from '@/lib/data/supabaseFunctions'

export function CollectionsManagement() {
  // Replace useCollections hook with useState
  const [collections, setCollections] = useState<Collection[]>([])
  const [collectionsLoading, setCollectionsLoading] = useState(true)
  // Ensure the line below is removed
  // const { collections, addCollection, deleteCollection, loading: collectionsLoading, updateCollection, generateCollectionVector } = useCollections() 
  
  // Ensure these hooks are present and correctly destructured
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
  const [sources, setSources] = useState<Source[]>([])
  const [sourcesLoading, setSourcesLoading] = useState(true)

  // Fetch sources on mount and when refresh is triggered
  const refreshSources = useCallback(async () => {
    setSourcesLoading(true)
    try {
      const { data, error } = await fetchSources()
      if (error) {
        console.error("Error fetching sources:", error)
        setSources([])
      } else {
        setSources(data || [])
      }
    } catch (err) {
      console.error("Error fetching sources:", err)
      setSources([])
    } finally {
      setSourcesLoading(false)
    }
  }, [])

  // Transform sources for display when they change
  useEffect(() => {
    if (!sourcesLoading && sources.length > 0) {
      setSourcesDisplay(transformSourcesForDisplay(sources))
    } else if (!sourcesLoading && sources.length === 0) {
      setSourcesDisplay([])
    }
  }, [sources, sourcesLoading])

  // Fetch sources on mount
  useEffect(() => {
    refreshSources()
  }, [refreshSources])

  // Fetch collections data function
  const fetchCollectionsData = useCallback(async () => {
    setCollectionsLoading(true)
    try {
      const { data, error } = await fetchCollections()
      if (error) {
        console.error('Error fetching collections:', error)
        setCollections([])
      } else {
        setCollections(data || [])
      }
    } catch (err) {
      console.error('Error fetching collections:', err)
      setCollections([])
    } finally {
      setCollectionsLoading(false)
    }
  }, [])

  // Fetch collections on mount
  useEffect(() => {
    fetchCollectionsData()
  }, [fetchCollectionsData])

  // Define loadCollectionSources at component level using useCallback
  const loadCollectionSources = useCallback(async (collectionId?: string) => {
    console.log(`[loadCollectionSources] ${collectionId ? 'Loading specific collection: ' + collectionId : 'Loading all collections'}`);

    try {
      setLoading(true);

      if (collectionId) {
        // Load just one collection
        console.log(`[loadCollectionSources] Loading sources for collection: ${collectionId}`);
        const { data: sourcesData, error: sourcesError } = await getSourcesForCollection(collectionId);
        if (sourcesError) {
           console.error(`[loadCollectionSources] Error fetching sources for ${collectionId}:`, sourcesError);
           // Potentially set an error state or return
           setCollectionSources(prev => ({ ...prev, [collectionId]: [] })); // Set empty on error
        } else {
           const sources = sourcesData || [];
           console.log(`[loadCollectionSources] Found ${sources.length} sources for collection ${collectionId}`);
           setCollectionSources(prev => ({ ...prev, [collectionId]: sources }));
        }
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

        const newCollectionSources = { ...collectionSources };

        // Load each collection one by one
        for (const collection of pendingCollections) {
          try {
            console.log(`[loadCollectionSources] Loading sources for collection: ${collection.id} (${collection.name})`);
            const { data: sourcesData, error: sourcesError } = await getSourcesForCollection(collection.id);
            if (sourcesError) {
              console.error(`[loadCollectionSources] Error loading sources for collection ${collection.id}:`, sourcesError);
              newCollectionSources[collection.id] = []; // Set empty on error
            } else {
              const sources = sourcesData || [];
              console.log(`[loadCollectionSources] Found ${sources.length} sources for collection ${collection.id}`);
              newCollectionSources[collection.id] = sources;
            }
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
          refreshSources();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, refreshSources]);

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

  // Add Real-time subscription to collections
  useEffect(() => {
    const channel = supabase
      .channel('collections-changes-knowledge-page') // Unique channel name
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'collections' },
        payload => {
          console.log('Collections real-time update received (Knowledge Page):', payload);
          fetchCollectionsData(); // Refresh collections on change
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, fetchCollectionsData]); // Add fetchCollectionsData dependency

  // Handle collection toggle selection
  const handleToggleSelect = (id: string) => {
    setSelectedSources(prev =>
      prev.includes(id)
        ? prev.filter(sourceId => sourceId !== id)
        : [...prev, id]
    );
  };

  // Update handleSelectAll to accept a ChangeEvent
  const handleSelectAll = () => {
    if (selectedSources.length === 0) {
      setSelectedSources(sourcesDisplay.map(source => source.id));
    } else {
      setSelectedSources([]);
    }
  };

  // Manually refresh sources and collections
  const handleRefreshSources = () => {
    refreshSources();
    fetchCollectionsData(); // Refresh collections as well
    setRefreshTrigger(prev => prev + 1);
    loadCollectionSources(); // Use the new function
  };

  const handleSaveCollection = async () => {
    if (newCollectionName && selectedSources.length > 0) {
      setLoading(true)
      console.log(`[Save Collection] Starting to save collection: ${newCollectionName} with ${selectedSources.length} sources`)

      try {
        // Add collection to database using imported function
        console.log(`[Save Collection] Adding collection to database: ${newCollectionName}`)
        const { data: newCollectionData, error: addError } = await addCollection(newCollectionName)
        if (addError) throw addError;
        console.log(`[Save Collection] Collection created with ID: ${newCollectionData?.id}`)

        if (newCollectionData) {
          // Use Promise.all to add sources in parallel rather than sequentially
          console.log(`[Save Collection] Adding ${selectedSources.length} sources to collection ${newCollectionData.id}`)

          // Track individual source additions
          const addPromises = selectedSources.map(sourceId => {
            console.log(`[Save Collection] Starting to add source ${sourceId} to collection ${newCollectionData.id}`)
            // Use imported addSourceToCollection
            return addSourceToCollection(newCollectionData.id, sourceId)
              .then(({ success, error }) => { // Assuming the func returns { success, error }
                console.log(`[Save Collection] Source ${sourceId} added to collection ${newCollectionData.id}: ${success ? 'SUCCESS' : 'FAILED'}`)
                if (error) console.error(`Error adding source ${sourceId}:`, error);
                return success;
              })
              .catch(err => {
                console.error(`[Save Collection] Failed to add source ${sourceId} to collection:`, err);
                return false;
              })
          });

          const results = await Promise.all(addPromises);
          console.log(`[Save Collection] All source additions completed. Results:`, results);

          // Load sources for this specific collection
          console.log(`[Save Collection] Loading sources for new collection ${newCollectionData.id}`)
          await loadCollectionSources(newCollectionData.id);
          console.log(`[Save Collection] Collection sources loaded`)
          // Fetch collections again to update the list (or rely on subscription)
          // fetchCollectionsData(); 
        }

        console.log(`[Save Collection] Process completed successfully`)
        // Use resetEditState instead of manually resetting each state
        resetEditState()
      } catch (error) {
        console.error('[Save Collection] Error creating collection:', error)
        resetEditState() // Make sure we reset everything on error
      } finally {
        setLoading(false) // Ensure loading is reset in finally block
      }
    }
  }

  const handleEditCollection = async (collection: Collection) => {
    setEditingCollection(collection)
    setNewCollectionName(collection.name)
    setIsEditModalOpen(true) // Open modal immediately
    setLoading(true)

    try {
      // Get the sources that are linked to this collection
      const { data: linkedSources, error } = await getSourcesForCollection(collection.id)
      if (error) {
        console.error(`Error loading sources for collection ${collection.id}:`, error)
        return
      }

      // Set selected sources to be the IDs of sources that are linked to this collection
      const linkedSourceIds = linkedSources.map(source => source.id)
      console.log(`Found ${linkedSourceIds.length} linked sources for collection ${collection.id}`)
      setSelectedSources(linkedSourceIds)

      // Update the collectionSources state with the loaded sources
      setCollectionSources(prev => ({
        ...prev,
        [collection.id]: linkedSources
      }))
    } catch (err) {
      console.error('Error in handleEditCollection:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateCollection = useCallback(async () => {
    if (!editingCollection) return

    try {
      setLoading(true)

      // Update collection name if it has changed
      if (newCollectionName !== editingCollection.name) {
        console.log(`[Update Collection] Updating collection name from "${editingCollection.name}" to "${newCollectionName}"`) 
        const { success: nameUpdateSuccess, error: updateNameError } = await updateCollection(editingCollection.id, newCollectionName)
        if (updateNameError || !nameUpdateSuccess) {
          console.error('[Update Collection] Failed to update collection name:', updateNameError)
          return
        }
      }

      // Get current sources linked to this collection
      const { data: currentSources, error: sourcesError } = await getSourcesForCollection(editingCollection.id)
      if (sourcesError) {
        console.error('[Update Collection] Failed to get current sources:', sourcesError)
        return
      }

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
            .then(({ success, error }) => {
              console.log(`[Update Collection] Source ${sourceId} added: ${success ? 'SUCCESS' : 'FAILED'}`)
              if (error) console.error(`Error adding source ${sourceId}:`, error)
              return success
            })
            .catch(err => {
              console.error(`[Update Collection] Failed to add source ${sourceId}:`, err)
              return false
            })
        })
        await Promise.all(addPromises)
      }

      // Remove unselected sources in parallel
      if (sourcesToRemove.length > 0) {
        console.log(`[Update Collection] Removing ${sourcesToRemove.length} sources`)
        const removePromises = sourcesToRemove.map(sourceId => {
          console.log(`[Update Collection] Starting to remove source ${sourceId}`)
          return removeSourceFromCollection(editingCollection.id, sourceId)
            .then(({ success, error }) => {
              console.log(`[Update Collection] Source ${sourceId} removed: ${success ? 'SUCCESS' : 'FAILED'}`)
              if (error) console.error(`Error removing source ${sourceId}:`, error)
              return success
            })
            .catch(err => {
              console.error(`[Update Collection] Failed to remove source ${sourceId}:`, err)
              return false
            })
        })
        await Promise.all(removePromises)
      }

      console.log(`[Update Collection] Process completed successfully`)
      resetEditState()
    } catch (error) {
      console.error('[Update Collection] Error updating collection:', error)
      resetEditState()
    } finally {
      setLoading(false)
    }
  }, [editingCollection, newCollectionName, selectedSources, updateCollection, addSourceToCollection, removeSourceFromCollection])

  const resetEditState = () => {
    setNewCollectionName("")
    setSelectedSources([])
    setEditingCollection(null)
    setIsEditModalOpen(false)
    setLoading(false) // Ensure loading is reset here
  }

  const handleDeleteCollection = async (id: string) => {
    // Add confirmation dialog
    if (!window.confirm("Are you sure you want to delete this collection? This also unlinks any associated bots.")) return;
    
    setLoading(true)

    try {
      // Use imported deleteCollection function
      const { success, error } = await deleteCollection(id)
      if (error || !success) throw error || new Error('Deletion failed');
      
      // Update local state (collectionSources)
      setCollectionSources(prev => {
        const newState = { ...prev }
        delete newState[id]
        return newState
      })
      // Refetch collections (or rely on subscription)
      // fetchCollectionsData();
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

  // Updated to use imported generateCollectionVector
  const handleGenerateVector = async (collection: Collection) => {
    if (!collectionSources[collection.id]?.length) {
      console.log('No sources in collection to process')
      alert('No sources found in this collection to generate vectors from.');
      return
    }

    setLoading(true)
    try {
      // Use imported generateCollectionVector function
      const { success, error } = await generateCollectionVector(
        collection.id,
        // Pass only source id and content if that's what the function expects
        // collectionSources[collection.id]
      )

      if (success) {
        console.log('Vector generation process started successfully')
        alert('Vector generation process started successfully. This may take some time.');
      } else {
        throw error || new Error('Vector generation failed');
      }
    } catch (error) {
      console.error('Error generating vector:', error)
      alert('Error starting vector generation: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setLoading(false)
    }
  }

  const columns: ColumnDef<any>[] = [
    { id: "name", accessorKey: "name", header: "Name", enableResizing: true, enableHiding: true, enableSorting: true, cell: (info) => info.getValue() },
    { id: "type", enableResizing: true, enableHiding: true, accessorKey: "type", header: "Type", enableSorting: true, cell: (info) => info.getValue() },
    { id: "lastUpdated", enableResizing: true, enableHiding: true, accessorKey: "lastUpdated", header: "Last Updated", enableSorting: true, cell: (info) => format(new Date(info.getValue() as string), "MMM dd, yyyy") },
    {
      id: "tags",
      accessorKey: "tags",
      header: "Tags",
      enableResizing: true,
      enableHiding: true,
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          {(row.original.tags || []).map(tag => {
            let tagStyle = "bg-muted"
            if (tag === 'File Upload') {
              tagStyle = "bg-blue-100 text-blue-800"
            } else if (tag === 'Live Data') {
              tagStyle = "bg-purple-100 text-purple-800"
            }
            return (
              <span
                key={tag}
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${tagStyle}`}
              >
                {tag}
              </span>
            )
          })}
        </div>
      ),
    }
  ]

  const filters = [
    {
      id: "search",
      label: "Search",
      component: SearchFilter,
      props: { filterKey: "search", placeholder: "Search sources..." },
    },
    {
      id: "types",
      label: "Types",
      component: SelectFilter,
      props: { filterKey: "type", placeholder: "All Types" },
    },
    {
      id: "tags",
      label: "Tags",
      component: TagsFilter,
      props: { filterKey: "tags", placeholder: "All Tags" },
    }
  ]

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Collections</h1>
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

        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Manage your collections and their sources.
          </div>

          {collectionsLoading ? (
            <div className="w-full h-64 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                    Created: {formatDate(collection.created_at)}
                  </div>

                  {collectionSources[collection.id]?.length ? (
                    <div className="text-sm">
                      {collectionSources[collection.id].length} sources
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">No sources</div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-4 flex-1"
                      onClick={() => viewCollectionDetails(collection)}
                    >
                      View Details
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-4 flex-1 min-w-0"
                      onClick={() => handleGenerateVector(collection)}
                      disabled={!collectionSources[collection.id]?.length || loading}
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Database className="h-4 w-4 mr-2" />
                      )}
                      <span className="truncate">
                        Build
                      </span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Dialog open={isEditModalOpen} onOpenChange={(open) => {
        if (!open) {
          // When closing the dialog, make sure to reset all states
          resetEditState();
        } else {
          setIsEditModalOpen(open);
        }
      }}>
        <DialogContent className="sm:max-w-[1000px] h-[80vh] flex flex-col">
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
              {/* Use the 'loading' state here, controlled by loadCollectionSources */}
              {loading ? ( 
                <div className="flex justify-center items-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <CustomTable 
                  tableId="knowledge-table" 
                  selectedRows={selectedSources} 
                  columns={columns as any} 
                  data={sourcesDisplay} 
                  filters={filters} 
                  placeholder="No sources found" 
                  onToggleSelect={handleToggleSelect} 
                  onSelectAll={handleSelectAll} 
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