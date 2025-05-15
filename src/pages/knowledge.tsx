import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import React, { useEffect, useState, useCallback, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MoreHorizontal, Pencil, Trash, Book, Loader2, RefreshCcw, Database, LayoutGrid, Map } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { format } from "date-fns"
import SearchFilter from "@/components/ui/search-filter"
import SelectFilter from "@/components/ui/select-filter"
import TagsFilter from "@/components/ui/tags-filter"
import { ColumnDef } from "@tanstack/react-table"
import CustomTable from "@/components/ui/custom-table"
import { Switch } from "@/components/ui/switch"
import { CollectionGraph } from "@/components/CollectionGraph"
import { Checkbox } from "@/components/ui/checkbox"
import { CheckedState } from "@radix-ui/react-checkbox"
import { useTeamStore } from "@/lib/hooks/useTeam"
import { SourceDisplay } from "./sources/types"
import { useSimilaritySearch } from "@/lib/fileUtilities/use-similarity-search"
import { supabase } from "@/lib/agents/db"

export interface Collection {
  id: string
  name: string
  created_at: string
  vector?: number[]
}

export interface Source {
  id: string
  name: string
  type: string
  content: string
  url?: string
  tags?: string[] | string
  created_at: string
  last_updated?: string
  vector?: number[]
}

export type LiveDataElement = {
  id?: string
  source_config_id: string
  content: string
  version?: string
  fetch_timestamp?: string
  status?: string
  metadata?: any
  last_updated?: string
  created_at?: string
  vector?: number[]
}

const generateCollectionVector = async (
  id: string,
  sources?: { id: string; content: string }[]
): Promise<{
  success: boolean,
  error: Error | null
}> => {
  const { generateEmbedding } = useSimilaritySearch()
  try {
    console.log(`[supabaseFunctions] Starting vector generation for collection ${id}`)

    // First get total count of sources for reporting
    const { count: totalSources } = await supabase
      .from('collection_sources')
      .select('*', { count: 'exact', head: true })
      .eq('collection_id', id)

    // Get only sources that need vectors
    const { data: collectionSources, error: sourcesError } = await supabase
      .from('collection_sources')
      .select(`
        source_id,
        sources (
          id,
          content,
          vector
        )
      `)
      .eq('collection_id', id)
      .is('sources.vector', null) as {
        data: Array<{
          source_id: string;
          sources: {
            id: string;
            content: string;
            vector?: number[];
          };
        }> | null;
        error: any;
      }

    if (sourcesError) throw sourcesError

    // Further filter to ensure we only process sources with content
    const sourcesToProcess = (collectionSources || []).filter(cs => cs.sources?.content)
    const skippedCount = totalSources - (sourcesToProcess.length || 0)
    console.log(`[supabaseFunctions] Found ${sourcesToProcess.length} sources that need vectors (${skippedCount} already vectorized)`)

    if (sourcesToProcess.length === 0) {
      console.log('[supabaseFunctions] No sources need vectorization - all vectors are up to date')
      return { success: true, error: null }
    }

    // Process sources
    for (const cs of sourcesToProcess) {
      console.log(`[supabaseFunctions] Generating vector for source ${cs.source_id}`)

      const { data: embedding, error: embeddingError } = await generateEmbedding(cs.sources.content)

      if (embeddingError) {
        console.error(`[supabaseFunctions] Error generating embedding for source ${cs.source_id}:`, embeddingError)
        continue
      }

      if (!embedding) {
        console.error(`[supabaseFunctions] Failed to generate embedding for source ${cs.source_id}`)
        continue
      }

      const { error: updateError } = await supabase
        .from('sources')
        .update({ vector: embedding })
        .eq('id', cs.source_id)

      if (updateError) {
        console.error(`[supabaseFunctions] Error updating source ${cs.source_id}:`, updateError)
        continue
      }
    }

    // Get source configs separately - only get enabled configs
    const { data: sourceConfigs, error: configsError } = await supabase
      .from('source_configs')
      .select('source')
      .eq('enabled', 1)
      .in('source', collectionSources?.map(cs => cs.source_id) || [])

    if (configsError) {
      console.error('[supabaseFunctions] Error fetching source configs:', configsError)
      // Don't throw error, just continue with sources only
    }

    let liveDataElements: LiveDataElement[] = []
    if (sourceConfigs && sourceConfigs.length > 0) {
      try {
        // Get live data elements only for sources that have enabled configs
        const { data: elements, error: liveDataError } = await supabase
          .from('live_data_elements')
          .select('id, content, vector')
          .in('source_config_id', sourceConfigs.map(config => config.source)) as {
            data: LiveDataElement[] | null,
            error: any
          }

        if (liveDataError) {
          console.error('[supabaseFunctions] Error fetching live data elements:', liveDataError)
        } else if (elements) {
          // Process live data elements in batches to avoid overwhelming the system
          const elementsToProcess = elements.filter(element =>
            // Only process elements that don't have a vector and have content
            !element.vector && element.content
          )

          console.log(`[supabaseFunctions] Found ${elementsToProcess.length} live data elements that need vectors`)

          for (const element of elementsToProcess) {
            try {
              // Log both ID and a preview of the content
              const contentPreview = element.content.length > 100
                ? `${element.content.substring(0, 100)}...`
                : element.content;
              console.log(`[supabaseFunctions] Processing live data element ${element.id}:
                Content: ${contentPreview}
                Length: ${element.content.length} characters`
              );

              const { data: embedding, error: embeddingError } = await generateEmbedding(element.content)

              if (embeddingError) {
                console.error(`[supabaseFunctions] Error generating embedding for element ${element.id}:`, embeddingError)
                continue
              }

              if (!embedding) {
                console.error(`[supabaseFunctions] Failed to generate embedding for element ${element.id}`)
                continue
              }

              const { error: updateError } = await supabase
                .from('live_data_elements')
                .update({ vector: embedding })
                .eq('id', element.id)

              if (updateError) {
                console.error(`[supabaseFunctions] Error updating live data element ${element.id}:`, updateError)
                continue
              }

              console.log(`[supabaseFunctions] Successfully vectorized element ${element.id}`)
            } catch (elementError) {
              console.error(`[supabaseFunctions] Error processing element ${element.id}:
                Content preview: ${element.content.substring(0, 100)}...
                Error: ${elementError}
              `)
              continue
            }
          }

          // Store all elements for reference
          liveDataElements = elements
        }
      } catch (error) {
        // Log the error but don't throw it - allow the function to complete
        console.error('[supabaseFunctions] Error in live data elements processing:', error)
      }
    }

    console.log(`[supabaseFunctions] Vector generation completed for collection ${id}`)
    return { success: true, error: null }
  } catch (error) {
    console.error(`[supabaseFunctions] Error in generateCollectionVector:`, error)
    console.error('[supabaseFunctions] Stack trace:', error instanceof Error ? error.stack : 'No stack trace available')
    return {
      success: false,
      error: error instanceof Error ? error : new Error(String(error))
    }
  }
}

const deleteCollection = async (id: string): Promise<{
  success: boolean,
  error: Error | null
}> => {
  try {
    console.log(`[supabaseFunctions] Starting deletion of collection ${id}`)

    const selectedTeam = useTeamStore.getState().selectedTeam
    if (!selectedTeam) {
      throw new Error('No team selected')
    }

    // 1. Get any bots using this collection
    const { data: linkedBots, error: botsError } = await supabase
      .from('bots')
      .select('id')
      .eq('collection', id)

    if (botsError) {
      console.error(`[supabaseFunctions] Error checking for linked bots:`, botsError)
      throw botsError
    }

    if (linkedBots && linkedBots.length > 0) {
      console.log(`[supabaseFunctions] Found ${linkedBots.length} bots linked to collection ${id}`)
      // 1a. Unlink the bots by setting their collection to null
      const { error: unlinkError } = await supabase
        .from('bots')
        .update({ collection: null })
        .eq('collection', id)

      if (unlinkError) {
        console.error(`[supabaseFunctions] Error unlinking bots:`, unlinkError)
        throw unlinkError
      }
      console.log(`[supabaseFunctions] Successfully unlinked ${linkedBots.length} bots`)
    }

    // 2. Delete collection_sources relationships
    const { error: deleteRelationshipsError } = await supabase
      .from('collection_sources')
      .delete()
      .eq('collection_id', id)

    if (deleteRelationshipsError) {
      console.error(`[supabaseFunctions] Error deleting collection relationships:`, deleteRelationshipsError)
      throw deleteRelationshipsError
    }

    // 3. Delete the collection itself
    const { error: deleteCollectionError } = await supabase
      .from('collections')
      .delete()
      .eq('id', id)
      .eq('team_id', selectedTeam.id)
    if (deleteCollectionError) {
      console.error(`[supabaseFunctions] Error deleting collection:`, deleteCollectionError)
      throw deleteCollectionError
    }

    console.log(`[supabaseFunctions] Successfully deleted collection ${id} and its relationships`)
    return { success: true, error: null }
  } catch (error) {
    console.error(`[supabaseFunctions] Error in deleteCollection:`, error)
    return {
      success: false,
      error: error instanceof Error ? error : new Error(String(error))
    }
  }
}

const getSourcesForCollection = async (collectionId: string) => {
  type CollectionSourceResponse = {
    source_id: string;
    sources: Source;
  }
  const { data, error } = await supabase.from('collection_sources')
    .select(`
    source_id,
    sources:source_id(*)
  `)
    .eq('collection_id', collectionId) as {
      data: CollectionSourceResponse[] | null,
      error: Error | null
    }
  const sources = (data || []).map(item => {
    if (!item.sources) {
      console.warn(`[supabaseFunctions] No source data found for source_id in collection ${collectionId}`)
      return null
    }
    return item.sources
  }).filter((source): source is Source => source !== null)

  return { data: sources, error }
}

function transformSourcesForDisplay(sources: Source[]): SourceDisplay[] {
  return sources.map(source => {
    // Process tags: convert from string or string[] to string[]
    let tags: string[] = [];
    if (source.tags) {
      if (typeof source.tags === 'string') {
        // Handle PostgreSQL array format: '{tag1,tag2}'
        tags = source.tags
          .replace('{', '')
          .replace('}', '')
          .split(',')
          .filter(tag => tag.length > 0);
      } else if (Array.isArray(source.tags)) {
        tags = source.tags;
      }
    }

    return {
      id: source.id,
      name: source.name,
      type: source.type,
      lastUpdated: source.last_updated || source.created_at,
      content: source.content,
      tags: tags
    };
  });
}

// Simple date formatting utility
const formatDate = (date: string) => {
  return format(new Date(date), "MMM dd, yyyy")
}

export function CollectionsManagement() {
  // Replace useCollections hook with useState
  const [collections, setCollections] = useState<Collection[]>([])
  const [collectionsLoading, setCollectionsLoading] = useState(true)
  const { selectedTeam } = useTeamStore()

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
  // Add view mode state
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid')
  const [sourceSearchQuery, setSourceSearchQuery] = useState("")

  // Fetch sources on mount and when refresh is triggered
  const refreshSources = useCallback(async () => {
    setSourcesLoading(true)
    try {
      const { data, error } = await supabase.from('sources')
        .select('*')
        .eq('team_id', selectedTeam.id)
        .order('created_at', { ascending: false })
      if (error) {
        console.error("Error fetching sources:", error)
        setSources([])
      } else {
        setSources(data as unknown as Source[] || [])
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
      const { data, error } = await supabase.from('collections')
        .select('*')
        .eq('team_id', selectedTeam.id)
        .order('created_at', { ascending: false })
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

  // Update handleSelectAll logic
  const handleSelectAll = () => {
    // Use filteredSources for select all logic
    const allFilteredIds = filteredSources.map(source => source.id);

    // If all *filtered* sources are already selected, deselect all.
    // Otherwise, select all *filtered* sources.
    const allFilteredSelected = allFilteredIds.every(id => selectedSources.includes(id)) && selectedSources.length === allFilteredIds.length;

    if (allFilteredSelected) {
      setSelectedSources([]); // Deselect all
    } else {
      setSelectedSources(allFilteredIds); // Select all filtered
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
        const { data: newCollectionData, error: addError } = await supabase.from('collections')
          .insert([{ name: newCollectionName, team_id: selectedTeam.id }])
          .select()
        if (addError) throw addError;
        console.log(`[Save Collection] Collection created with ID: ${newCollectionData?.[0]?.id}`)

        if (newCollectionData) {
          console.log(`[Save Collection] Adding ${selectedSources.length} sources to collection ${newCollectionData?.[0]?.id}`)
          const addPromises = selectedSources.map(async (sourceId) => {
            const { data: sourceData, error: sourceError } = await supabase.from('collection_sources')
              .insert([{ collection_id: newCollectionData?.[0]?.id, source_id: sourceId }])
              .select()
            if (sourceError) throw sourceError;
            return sourceData;
          });

          const results = await Promise.all(addPromises);
          console.log(`[Save Collection] All source additions completed. Results:`, results);

          // Load sources for this specific collection
          console.log(`[Save Collection] Loading sources for new collection ${newCollectionData?.[0]?.id}`)
          await loadCollectionSources(newCollectionData?.[0]?.id);
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
        const { error: updateNameError } = await supabase.from('collections')
          .update({ name: newCollectionName, team_id: selectedTeam.id })
          .eq('id', editingCollection.id)
          .select()
        if (updateNameError) {
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
        const addPromises = sourcesToAdd.map(async (sourceId) => {
          const { data: sourceData, error: sourceError } = await supabase.from('collection_sources')
            .insert([{ collection_id: editingCollection.id, source_id: sourceId }])
            .select()
          if (sourceError) throw sourceError;
          return sourceData;
        })
        await Promise.all(addPromises)
      }

      // Remove unselected sources in parallel
      if (sourcesToRemove.length > 0) {
        console.log(`[Update Collection] Removing ${sourcesToRemove.length} sources`)
        const removePromises = sourcesToRemove.map(async (sourceId) => {
          const { data: sourceData, error: sourceError } = await supabase.from('collection_sources')
            .delete()
            .match({ collection_id: editingCollection.id, source_id: sourceId })
            .select()
          if (sourceError) throw sourceError;
          return sourceData;
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
  }, [editingCollection, newCollectionName, selectedSources])

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

  // Define columns for the source selection table
  const sourceColumns: ColumnDef<SourceDisplay>[] = [
    // --- Selection Checkbox Column ---
    {
      id: "select",
      header: ({ table }) => {
        const isAllSelected = table.getIsAllPageRowsSelected();
        const isSomeSelected = table.getIsSomePageRowsSelected();
        let checkedState: CheckedState = false;
        if (isAllSelected) {
          checkedState = true;
        } else if (isSomeSelected) {
          checkedState = "indeterminate";
        }

        return (
          <Checkbox
            checked={checkedState}
            onCheckedChange={handleSelectAll} // Use direct handler
            aria-label="Select all"
          />
        );
      },
      cell: ({ row }) => (
        <Checkbox
          checked={selectedSources.includes(row.original.id)} // Check against selectedSources state
          onCheckedChange={() => handleToggleSelect(row.original.id)} // Use direct handler
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
      size: 40, // Fixed size for checkbox column
    },
    // --- Other Columns (Name, Type, etc.) ---
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

  // Filter sources based on search query
  const filteredSources = useMemo(() => {
    if (!sourceSearchQuery) {
      return sourcesDisplay
    }
    const lowerCaseQuery = sourceSearchQuery.toLowerCase()
    return sourcesDisplay.filter(source =>
      source.name.toLowerCase().includes(lowerCaseQuery) ||
      (source.content && source.content.toLowerCase().includes(lowerCaseQuery))
    )
  }, [sourcesDisplay, sourceSearchQuery])

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
            <div className="flex items-center space-x-2">
              <LayoutGrid className={`h-4 w-4 ${viewMode === 'grid' ? 'text-primary' : 'text-muted-foreground'}`} />
              <Switch
                checked={viewMode === 'map'}
                onCheckedChange={(checked) => setViewMode(checked ? 'map' : 'grid')}
              />
              <Map className={`h-4 w-4 ${viewMode === 'map' ? 'text-primary' : 'text-muted-foreground'}`} />
            </div>
          </div>
        </div>

        <div>
          {collectionsLoading ? (
            <div className="w-full h-64 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : viewMode === 'map' ? (
            <CollectionGraph collections={collections} collectionSources={collectionSources} />
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
              <div>
                <Label htmlFor="source-search">Search Sources</Label>
                <Input
                  id="source-search"
                  placeholder="Search by name or content..."
                  value={sourceSearchQuery}
                  onChange={(e) => setSourceSearchQuery(e.target.value)}
                />
              </div>
              {loading ? (
                <div className="flex justify-center items-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <CustomTable
                  tableId="knowledge-table"
                  columns={sourceColumns as any}
                  data={filteredSources}
                  filters={filters}
                  placeholder="No sources found"
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