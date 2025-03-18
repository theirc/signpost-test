/**
 * useCollections Hook
 * 
 * A hook to manage collections in the application.
 * Provides functionality to fetch, add, and delete collections from the database.
 * 
 * A collection is a group of sources which can be used to create a Knowledge base.
 * Also handles the generation of vectors for the collection and the sources within it.
 * 
 * @returns {Object} An object containing collections data and operations:
 *   - collections: The current list of collections
 *   - loading: Boolean indicating if collections are being loaded
 *   - error: Any error that occurred during loading
 *   - addCollection: Function to add a new collection
 *   - deleteCollection: Function to delete a collection
 *   - fetchCollections: Function to refresh collections
 *   - generateCollectionVector: Function to generate a vector for a collection
 *   - findSimilarCollections: Function to find similar collections
 *   - generateEmbedding: Function to generate an embedding for a text
 */
import { useEffect, useState } from 'react'
import { useSupabase } from './use-supabase'
import { pipeline, env } from '@xenova/transformers'

// Configure transformers.js environment
env.useBrowserCache = false
env.allowLocalModels = false

export type Collection = {
  id: string
  name: string
  created_at: string
  vector?: number[]
}

// Types for sources and live data elements
type SourceConfig = {
  id: string
}

type Source = {
  id: string
  content: string
  name: string
  type: string
  vector?: number[]
  source_configs?: SourceConfig[]
}

type LiveDataElement = {
  id: string
  content: string
  type: string
  vector?: number[]
}

export function useCollections() {
  const supabase = useSupabase()
  const [collections, setCollections] = useState<Collection[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchCollections = async () => {
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from('collections')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) throw error
        setCollections(data || [])
      } catch (error) {
        setError(error instanceof Error ? error : new Error(String(error)))
      } finally {
        setLoading(false)
      }
    }

    fetchCollections()
  }, [supabase])

  const addCollection = async (name: string) => {
    try {
      const { data, error } = await supabase
        .from('collections')
        .insert([{ name }])
        .select()

      if (error) throw error
      setCollections(prev => [...prev, ...(data || [])])
      return data?.[0]
    } catch (error) {
      setError(error instanceof Error ? error : new Error(String(error)))
      return null
    }
  }

  const deleteCollection = async (id: string) => {
    try {
      console.log(`[useCollections] Starting deletion of collection ${id}`)
      
      // 1. Get any bots using this collection
      const { data: linkedBots, error: botsError } = await supabase
        .from('bots')
        .select('id')
        .eq('collection', id)

      if (botsError) {
        console.error(`[useCollections] Error checking for linked bots:`, botsError)
        throw botsError
      }

      if (linkedBots && linkedBots.length > 0) {
        console.log(`[useCollections] Found ${linkedBots.length} bots linked to collection ${id}`)
        // 1a. Unlink the bots by setting their collection to null
        const { error: unlinkError } = await supabase
          .from('bots')
          .update({ collection: null })
          .eq('collection', id)

        if (unlinkError) {
          console.error(`[useCollections] Error unlinking bots:`, unlinkError)
          throw unlinkError
        }
        console.log(`[useCollections] Successfully unlinked ${linkedBots.length} bots`)
      }

      // 2. Delete collection_sources relationships
      const { error: deleteRelationshipsError } = await supabase
        .from('collection_sources')
        .delete()
        .eq('collection_id', id)

      if (deleteRelationshipsError) {
        console.error(`[useCollections] Error deleting collection relationships:`, deleteRelationshipsError)
        throw deleteRelationshipsError
      }

      // 3. Delete the collection itself
      const { error: deleteCollectionError } = await supabase
        .from('collections')
        .delete()
        .eq('id', id)

      if (deleteCollectionError) {
        console.error(`[useCollections] Error deleting collection:`, deleteCollectionError)
        throw deleteCollectionError
      }

      // 4. Update local state
      setCollections(prev => prev.filter(collection => collection.id !== id))
      
      console.log(`[useCollections] Successfully deleted collection ${id} and its relationships`)
      return true
    } catch (error) {
      console.error(`[useCollections] Error in deleteCollection:`, error)
      setError(error instanceof Error ? error : new Error(String(error)))
      return false
    }
  }

  /**
   * Updates a collection's name in the database
   * 
   * @param {string} id - The ID of the collection to update
   * @param {string} name - The new name for the collection
   * @returns {Promise<boolean>} True if successful, false if an error occurred
   */
  const updateCollection = async (id: string, name: string) => {
    try {
      console.log(`[useCollections] Updating collection ${id} with name: ${name}`);
      const { error } = await supabase
        .from('collections')
        .update({ name })
        .eq('id', id)
        .select()

      if (error) {
        console.error(`[useCollections] Error updating collection ${id}:`, error);
        throw error;
      }
      
      // Update the local state with the new name
      setCollections(prev => 
        prev.map(collection => 
          collection.id === id 
            ? { ...collection, name } 
            : collection
        )
      );
      
      console.log(`[useCollections] Successfully updated collection ${id} to name: ${name}`);
      return true;
    } catch (error) {
      console.error(`[useCollections] Exception in updateCollection:`, error);
      setError(error instanceof Error ? error : new Error(String(error)));
      return false;
    }
  }

  const generateEmbedding = async (text: string) => {
    try {
      console.log('[useCollections] Starting embedding generation...')
      
      const generateEmbedding = await pipeline('feature-extraction', 'Supabase/gte-small', {
        revision: 'main',
        quantized: true
      })
      
      const output = await generateEmbedding(text, {
        pooling: 'mean',
        normalize: true,
      })
      
      console.log('[useCollections] Embedding generated successfully')
      
      // Convert to array and ensure it's the correct size (384 for gte-small)
      const embedding = Array.from(output.data)
      if (embedding.length !== 384) {
        throw new Error(`Expected embedding dimension of 384, but got ${embedding.length}`)
      }
      
      return embedding
    } catch (error) {
      console.error('[useCollections] Error generating embedding:', error)
      console.error('[useCollections] Error type:', error instanceof Error ? error.constructor.name : typeof error)
      console.error('[useCollections] Error message:', error instanceof Error ? error.message : String(error))
      
      if (error instanceof Error) {
        if (error.message.includes('<!doctype')) {
          console.error('[useCollections] Received HTML response instead of model data - possible network or CORS issue')
          throw new Error('Failed to load the embedding model. Please check your internet connection and try again.')
        }
        if (error.message.includes('protobuf')) {
          console.error('[useCollections] Protobuf parsing error - trying alternative model format')
          throw new Error('Error loading model format. Please try again or contact support if the issue persists.')
        }
        if (error.message.includes('Failed to fetch')) {
          console.error('[useCollections] Network error while fetching model')
          throw new Error('Network error while loading the model. Please check your internet connection and try again.')
        }
      }
      throw error
    }
  }

  const generateCollectionVector = async (id: string, sources: { id: string; content: string }[]) => {
    try {
      setLoading(true)
      console.log(`[useCollections] Starting vector generation for collection ${id}`)
      
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
      console.log(`[useCollections] Found ${sourcesToProcess.length} sources that need vectors (${skippedCount} already vectorized)`)
      
      if (sourcesToProcess.length === 0) {
        console.log('[useCollections] No sources need vectorization - all vectors are up to date')
        return true
      }
      
      // Process sources
      for (const cs of sourcesToProcess) {
        console.log(`[useCollections] Generating vector for source ${cs.source_id}`)
        const embedding = await generateEmbedding(cs.sources.content)
        
        const { error: updateError } = await supabase
          .from('sources')
          .update({ vector: embedding })
          .eq('id', cs.source_id)

        if (updateError) {
          console.error(`[useCollections] Error updating source ${cs.source_id}:`, updateError)
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
        console.error('[useCollections] Error fetching source configs:', configsError)
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
            console.error('[useCollections] Error fetching live data elements:', liveDataError)
          } else if (elements) {
            // Process live data elements in batches to avoid overwhelming the system
            const elementsToProcess = elements.filter(element => 
              // Only process elements that don't have a vector and have content
              !element.vector && element.content
            )

            console.log(`[useCollections] Found ${elementsToProcess.length} live data elements that need vectors`)
            
            for (const element of elementsToProcess) {
              try {
                // Log both ID and a preview of the content
                const contentPreview = element.content.length > 100 
                  ? `${element.content.substring(0, 100)}...` 
                  : element.content;
                console.log(`[useCollections] Processing live data element ${element.id}:
                  Content: ${contentPreview}
                  Length: ${element.content.length} characters`
                );

                const embedding = await generateEmbedding(element.content)
                
                const { error: updateError } = await supabase
                  .from('live_data_elements')
                  .update({ vector: embedding })
                  .eq('id', element.id)

                if (updateError) {
                  console.error(`[useCollections] Error updating live data element ${element.id}:`, updateError)
                  continue
                }
                
                console.log(`[useCollections] Successfully vectorized element ${element.id}`)
              } catch (elementError) {
                console.error(`[useCollections] Error processing element ${element.id}:
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
          console.error('[useCollections] Error in live data elements processing:', error)
        }
      }

      console.log(`[useCollections] Vector generation completed for collection ${id}`)
      return true
    } catch (error) {
      console.error(`[useCollections] Error in generateCollectionVector:`, error)
      console.error('[useCollections] Stack trace:', error instanceof Error ? error.stack : 'No stack trace available')
      setError(error instanceof Error ? error : new Error(String(error)))
      return false
    } finally {
      setLoading(false)
    }
  }

  return { 
    collections, 
    loading, 
    error, 
    addCollection, 
    deleteCollection, 
    updateCollection,
    generateCollectionVector,
    generateEmbedding
  }
} 