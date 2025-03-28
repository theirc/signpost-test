/**
 * =============================================
 * SUPABASE HELPER FUNCTIONS
 * =============================================
 * 
 * This file centralizes all interactions with the Supabase database and related services.
 * It provides strongly-typed functions for CRUD operations and other database interactions.
 * 
 * Available Functions:
 * 
 * === Supabase Client ===
 * - `supabase`: Exported Supabase client instance for direct use.
 * 
 * === Model Functions ===
 * - `fetchModels`: Fetches all AI models.
 * - `addModel`: Adds a new AI model.
 * - `updateModel`: Updates an existing AI model.
 * - `deleteModel`: Deletes an AI model.
 * 
 * === Bot Functions ===
 * - `fetchBots`: Fetches all configured bots.
 * - `addBot`: Adds a new bot.
 * - `updateBot`: Updates an existing bot.
 * - `deleteBot`: Deletes a bot.
 * 
 * === Collection Functions ===
 * - `fetchCollections`: Fetches all knowledge base collections.
 * - `addCollection`: Adds a new collection.
 * - `updateCollection`: Updates a collection's name.
 * - `deleteCollection`: Deletes a collection and unlinks associated bots.
 * - `generateCollectionVector`: Generates embedding vectors for sources and live data elements within a collection.
 * 
 * === Collection_Sources Functions ===
 * - `getSourcesForCollection`: Retrieves all sources linked to a specific collection.
 * - `addSourceToCollection`: Links a source to a collection.
 * - `removeSourceFromCollection`: Unlinks a source from a collection.
 * 
 * === Source Functions ===
 * - `fetchSources`: Fetches all knowledge base sources.
 * - `addSource`: Adds a new source.
 * - `updateSource`: Updates an existing source (including tags).
 * - `deleteSource`: Deletes a source.
 * 
 * === Source Display Functions ===
 * - `transformSourcesForDisplay`: Converts raw source data into a format suitable for UI display (handles tag parsing).
 * 
 * === Source Config & Live Data Functions ===
 * - `getConfigForSource`: Gets the configuration (e.g., for live data) associated with a source.
 * - `updateSourceConfig`: Updates or creates a configuration for a source.
 * - `createLiveDataElement`: Adds a new piece of live data content associated with a source config.
 * - `getLiveDataElements`: Retrieves all live data elements for a specific source config.
 * 
 * === Tag & Source_Tag Functions ===
 * - `getTagsForSource`: Retrieves all tags associated with a specific source (via source_tags).
 * - `addTagToSource`: Links an existing tag to a source in the source_tags table.
 * - `removeTagFromSource`: Unlinks a tag from a source in the source_tags table.
 * - `fetchTags`: Fetches all available tags from the `tags` table.
 * - `addTag`: Adds a new tag to the `tags` table (or returns existing if name matches).
 * 
 * === Source Upload Functions ===
 * - `uploadSources`: Uploads multiple parsed files as sources and associates tags.
 * 
 * === Embedding Functions ===
 * - `generateEmbedding`: Generates a vector embedding for a given text using a transformer model.
 * 
 * === System Prompt Functions ===
 * - `fetchSystemPrompts`: Fetches all system prompts from the database.
 * - `addSystemPrompt`: Adds a new system prompt to the database.
 * - `updateSystemPrompt`: Updates an existing system prompt in the database.
 * - `deleteSystemPrompt`: Deletes a system prompt from the database.
 * - `getSystemPromptById`: Fetches a specific system prompt by ID.
 * 
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { pipeline, env } from '@xenova/transformers'

// Configure transformers.js environment
env.useBrowserCache = false
env.allowLocalModels = false

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Create a truly singleton client at the module level
// This ensures only one client exists across the entire application
let supabaseClient: SupabaseClient

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL and Anon Key must be provided in environment variables.')
}

try {
  supabaseClient = createClient(supabaseUrl, supabaseAnonKey)
  console.info('✅ Supabase client initialized successfully')
} catch (error) {
  console.error('❌ Failed to initialize Supabase client:', error)
  // Create a fake client that throws errors when methods are called
  supabaseClient = new Proxy({} as SupabaseClient, {
    get: (_, prop) => () => {
      throw new Error(`Supabase client failed to initialize. Cannot call method "${String(prop)}".`)
    }
  })
}

// Export the Supabase client for direct access
export const supabase = supabaseClient;

// =========== TYPES ===========

export interface Model {
  id: string
  name: string
  model_id: string
  provider: string
  created_at: string
}

export interface Bot {
  id: string
  name: string
  collection?: string
  model: string
  system_prompt?: string
  system_prompt_id?: string
  temperature: number
  created_at: string
  updated_at?: string
}

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

export type SourceConfig = {
  source: string
  enabled: number
  url?: string
  sitemap?: string
  subdomain?: string
  map?: string
  prompt?: string
  bot_log?: string
  max_links?: number
  crawl_depth?: number
  max_total_links?: number
  include_external_links?: number
  extract_main_content?: number
  chunk_size?: number
  chunk_overlap?: number
  max_token_limit?: number
  include_urls?: number
  extract_media_content?: number
  exclude_urls?: string[]
  retrieve_links?: number
  type?: string
  api_token?: string
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

export type SourceTag = {
  id: string
  source_id: string
  tag_id: string
}

export type ParsedFile = {
  id: string
  name: string
  content: string
  type?: string
}

// Define the display source type
export type SourceDisplay = {
  id: string
  name: string
  type: string
  lastUpdated: string
  content: string
  tags: string[]
}

// Add SystemPrompt type after the other interfaces
export interface SystemPrompt {
  id: string
  name: string
  content: string
  created_at: string
  updated_at: string
}

// =========== MODEL FUNCTIONS ===========

/**
 * Fetches all models from the database
 * 
 * @returns {Promise<{ data: Model[], error: Error | null }>} Array of Model objects
 */
export async function fetchModels(): Promise<{
  data: Model[],
  error: Error | null
}> {
  try {
    const { data, error } = await supabaseClient
      .from('models')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return { data: data || [], error: null }
  } catch (error) {
    console.error('Error fetching models:', error)
    return { data: [], error: error instanceof Error ? error : new Error(String(error)) }
  }
}

/**
 * Adds a new model to the database
 * 
 * @param {Partial<Model>} modelData - The model data to add
 * @returns {Promise<{ data: Model | null, error: Error | null }>} The newly created model or null if an error occurred
 */
export async function addModel(modelData: Partial<Model>): Promise<{
  data: Model | null,
  error: Error | null
}> {
  try {
    if (!modelData.name || !modelData.model_id || !modelData.provider) {
      throw new Error('Name, model_id, and provider are required')
    }

    const { data, error } = await supabaseClient
      .from('models')
      .insert([modelData])
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error adding model:', error)
    return { data: null, error: error instanceof Error ? error : new Error(String(error)) }
  }
}

/**
 * Updates an existing model in the database
 * 
 * @param {string} id - The ID of the model to update
 * @param {Partial<Model>} modelData - The updated model data
 * @returns {Promise<{ data: Model | null, error: Error | null }>} The updated model or null if an error occurred
 */
export async function updateModel(id: string, modelData: Partial<Model>): Promise<{
  data: Model | null,
  error: Error | null
}> {
  try {
    const { data, error } = await supabaseClient
      .from('models')
      .update(modelData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error updating model:', error)
    return { data: null, error: error instanceof Error ? error : new Error(String(error)) }
  }
}

/**
 * Deletes a model from the database
 * 
 * @param {string} id - The ID of the model to delete
 * @returns {Promise<{ success: boolean, error: Error | null }>} True if successful, false if an error occurred
 */
export async function deleteModel(id: string): Promise<{
  success: boolean,
  error: Error | null
}> {
  try {
    const { error } = await supabaseClient
      .from('models')
      .delete()
      .eq('id', id)

    if (error) throw error
    return { success: true, error: null }
  } catch (error) {
    console.error('Error deleting model:', error)
    return { success: false, error: error instanceof Error ? error : new Error(String(error)) }
  }
}

// =========== BOT FUNCTIONS ===========

/**
 * Fetches all bots from the database
 * 
 * @returns {Promise<Bot[]>} Array of Bot objects
 */
export async function fetchBots(): Promise<{
  data: Bot[],
  error: Error | null
}> {
  try {
    const { data, error } = await supabaseClient
      .from('bots')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return { data: data || [], error: null }
  } catch (error) {
    console.error('Error fetching bots:', error)
    return { data: [], error: error instanceof Error ? error : new Error(String(error)) }
  }
}

/**
 * Adds a new bot to the database
 * 
 * @param {Partial<Bot>} botData - The bot data to add
 * @returns {Promise<Bot | null>} The newly created bot or null if an error occurred
 */
export async function addBot(botData: Partial<Bot>): Promise<{
  data: Bot | null,
  error: Error | null
}> {
  try {
    if (!botData.name || !botData.model) {
      throw new Error('Name and model are required')
    }

    const { data, error } = await supabaseClient
      .from('bots')
      .insert([botData])
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error adding bot:', error)
    return { data: null, error: error instanceof Error ? error : new Error(String(error)) }
  }
}

/**
 * Updates an existing bot in the database
 * 
 * @param {string} id - The ID of the bot to update
 * @param {Partial<Bot>} botData - The updated bot data
 * @returns {Promise<Bot | null>} The updated bot or null if an error occurred
 */
export async function updateBot(id: string, botData: Partial<Bot>): Promise<{
  data: Bot | null,
  error: Error | null
}> {
  try {
    const { data, error } = await supabaseClient
      .from('bots')
      .update(botData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error updating bot:', error)
    return { data: null, error: error instanceof Error ? error : new Error(String(error)) }
  }
}

/**
 * Deletes a bot from the database
 * 
 * @param {string} id - The ID of the bot to delete
 * @returns {Promise<boolean>} True if successful, false if an error occurred
 */
export async function deleteBot(id: string): Promise<{
  success: boolean,
  error: Error | null
}> {
  try {
    const { error } = await supabaseClient
      .from('bots')
      .delete()
      .eq('id', id)

    if (error) throw error
    return { success: true, error: null }
  } catch (error) {
    console.error('Error deleting bot:', error)
    return { success: false, error: error instanceof Error ? error : new Error(String(error)) }
  }
}

// =========== COLLECTION FUNCTIONS ===========

/**
 * Fetches all collections from the database
 * 
 * @returns {Promise<Collection[]>} Array of Collection objects
 */
export async function fetchCollections(): Promise<{
  data: Collection[],
  error: Error | null
}> {
  try {
    const { data, error } = await supabaseClient
      .from('collections')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return { data: data || [], error: null }
  } catch (error) {
    console.error('Error fetching collections:', error)
    return { data: [], error: error instanceof Error ? error : new Error(String(error)) }
  }
}

/**
 * Adds a new collection to the database
 * 
 * @param {string} name - The name of the collection to add
 * @returns {Promise<Collection | null>} The newly created collection or null if an error occurred
 */
export async function addCollection(name: string): Promise<{
  data: Collection | null,
  error: Error | null
}> {
  try {
    const { data, error } = await supabaseClient
      .from('collections')
      .insert([{ name }])
      .select()

    if (error) throw error
    return { data: data?.[0] || null, error: null }
  } catch (error) {
    console.error('Error adding collection:', error)
    return { data: null, error: error instanceof Error ? error : new Error(String(error)) }
  }
}

/**
 * Updates a collection's name in the database
 * 
 * @param {string} id - The ID of the collection to update
 * @param {string} name - The new name for the collection
 * @returns {Promise<boolean>} True if successful, false if an error occurred
 */
export async function updateCollection(id: string, name: string): Promise<{
  success: boolean,
  error: Error | null
}> {
  try {
    console.log(`[supabaseFunctions] Updating collection ${id} with name: ${name}`)
    const { error } = await supabaseClient
      .from('collections')
      .update({ name })
      .eq('id', id)
      .select()

    if (error) {
      console.error(`[supabaseFunctions] Error updating collection ${id}:`, error)
      throw error
    }
    
    console.log(`[supabaseFunctions] Successfully updated collection ${id} to name: ${name}`)
    return { success: true, error: null }
  } catch (error) {
    console.error(`[supabaseFunctions] Exception in updateCollection:`, error)
    return { 
      success: false, 
      error: error instanceof Error ? error : new Error(String(error)) 
    }
  }
}

/**
 * Deletes a collection from the database
 * 
 * @param {string} id - The ID of the collection to delete
 * @returns {Promise<boolean>} True if successful, false if an error occurred
 */
export async function deleteCollection(id: string): Promise<{
  success: boolean,
  error: Error | null
}> {
  try {
    console.log(`[supabaseFunctions] Starting deletion of collection ${id}`)
    
    // 1. Get any bots using this collection
    const { data: linkedBots, error: botsError } = await supabaseClient
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
      const { error: unlinkError } = await supabaseClient
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
    const { error: deleteRelationshipsError } = await supabaseClient
      .from('collection_sources')
      .delete()
      .eq('collection_id', id)

    if (deleteRelationshipsError) {
      console.error(`[supabaseFunctions] Error deleting collection relationships:`, deleteRelationshipsError)
      throw deleteRelationshipsError
    }

    // 3. Delete the collection itself
    const { error: deleteCollectionError } = await supabaseClient
      .from('collections')
      .delete()
      .eq('id', id)

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

/**
 * Generates an embedding vector for a text string
 * 
 * @param {string} text - The text to generate an embedding for
 * @returns {Promise<number[]>} The embedding vector
 */
export async function generateEmbedding(text: string): Promise<{
  data: number[] | null,
  error: Error | null
}> {
  try {
    console.log('[supabaseFunctions] Starting embedding generation...')
    
    const generateEmbedding = await pipeline('feature-extraction', 'Supabase/gte-small', {
      revision: 'main',
      quantized: true
    })
    
    const output = await generateEmbedding(text, {
      pooling: 'mean',
      normalize: true,
    })
    
    console.log('[supabaseFunctions] Embedding generated successfully')
    
    // Convert to array and ensure it's the correct size (384 for gte-small)
    const embedding = Array.from(output.data)
    if (embedding.length !== 384) {
      throw new Error(`Expected embedding dimension of 384, but got ${embedding.length}`)
    }
    
    return { data: embedding, error: null }
  } catch (error) {
    console.error('[supabaseFunctions] Error generating embedding:', error)
    console.error('[supabaseFunctions] Error type:', error instanceof Error ? error.constructor.name : typeof error)
    console.error('[supabaseFunctions] Error message:', error instanceof Error ? error.message : String(error))
    
    let errorMessage = 'Unknown error occurred during embedding generation.'
    
    if (error instanceof Error) {
      if (error.message.includes('<!doctype')) {
        errorMessage = 'Failed to load the embedding model. Please check your internet connection and try again.'
      } else if (error.message.includes('protobuf')) {
        errorMessage = 'Error loading model format. Please try again or contact support if the issue persists.'
      } else if (error.message.includes('Failed to fetch')) {
        errorMessage = 'Network error while loading the model. Please check your internet connection and try again.'
      } else {
        errorMessage = error.message
      }
    }
    
    return { 
      data: null, 
      error: new Error(errorMessage)
    }
  }
}

/**
 * Generates vectors for all sources in a collection
 * 
 * @param {string} id - The ID of the collection to generate vectors for
 * @param {Array<{id: string, content: string}>} sources - Optional array of sources to process
 * @returns {Promise<boolean>} True if successful, false if an error occurred
 */
export async function generateCollectionVector(
  id: string, 
  sources?: { id: string; content: string }[]
): Promise<{
  success: boolean,
  error: Error | null
}> {
  try {
    console.log(`[supabaseFunctions] Starting vector generation for collection ${id}`)
    
    // First get total count of sources for reporting
    const { count: totalSources } = await supabaseClient
      .from('collection_sources')
      .select('*', { count: 'exact', head: true })
      .eq('collection_id', id)

    // Get only sources that need vectors
    const { data: collectionSources, error: sourcesError } = await supabaseClient
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
      
      const { error: updateError } = await supabaseClient
        .from('sources')
        .update({ vector: embedding })
        .eq('id', cs.source_id)

      if (updateError) {
        console.error(`[supabaseFunctions] Error updating source ${cs.source_id}:`, updateError)
        continue
      }
    }

    // Get source configs separately - only get enabled configs
    const { data: sourceConfigs, error: configsError } = await supabaseClient
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
        const { data: elements, error: liveDataError } = await supabaseClient
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
              
              const { error: updateError } = await supabaseClient
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

// =========== COLLECTION_SOURCES FUNCTIONS ===========

/**
 * Retrieves all sources associated with a specific collection.
 * 
 * @param {string} collectionId - The ID of the collection to fetch sources for
 * @returns {Promise<Source[]>} Array of Source objects belonging to the collection
 */
export async function getSourcesForCollection(collectionId: string): Promise<{
  data: Source[],
  error: Error | null
}> {
  console.log(`[supabaseFunctions] Getting sources for collection: ${collectionId}`)
  
  try {
    // Define the expected response type
    type CollectionSourceResponse = {
      source_id: string;
      sources: Source;
    }

    const { data, error } = await supabaseClient
      .from('collection_sources')
      .select(`
        source_id,
        sources:source_id(*)
      `)
      .eq('collection_id', collectionId) as { 
        data: CollectionSourceResponse[] | null, 
        error: Error | null 
      }

    if (error) {
      console.error(`[supabaseFunctions] Error fetching sources for collection ${collectionId}:`, error)
      throw error
    }
    
    console.log(`[supabaseFunctions] Retrieved ${data?.length || 0} sources for collection ${collectionId}`)
    
    // Extract the sources from the nested structure
    const sources = (data || []).map(item => {
      if (!item.sources) {
        console.warn(`[supabaseFunctions] No source data found for source_id in collection ${collectionId}`)
        return null
      }
      return item.sources
    }).filter((source): source is Source => source !== null)
    
    return { data: sources, error: null }
  } catch (err) {
    console.error(`[supabaseFunctions] Exception in getSourcesForCollection:`, err)
    return {
      data: [], 
      error: err instanceof Error ? err : new Error(String(err))
    }
  }
}

/**
 * Adds a source to a collection by creating a new record in the collection_sources table.
 * 
 * @param {string} collectionId - The ID of the collection to add the source to
 * @param {string} sourceId - The ID of the source to add to the collection
 * @returns {Promise<boolean>} True if successful, false if an error occurred
 */
export async function addSourceToCollection(collectionId: string, sourceId: string): Promise<{
  success: boolean,
  error: Error | null
}> {
  console.log(`[supabaseFunctions] Adding source ${sourceId} to collection ${collectionId}`)
  
  try {
    const { error, data } = await supabaseClient
      .from('collection_sources')
      .insert([{ collection_id: collectionId, source_id: sourceId }])
      .select()

    if (error) {
      console.error(`[supabaseFunctions] Error adding source ${sourceId} to collection ${collectionId}:`, error)
      throw error
    }
    
    console.log(`[supabaseFunctions] Successfully added source ${sourceId} to collection ${collectionId}`, data)
    return { success: true, error: null }
  } catch (err) {
    console.error(`[supabaseFunctions] Exception in addSourceToCollection:`, err)
    return { 
      success: false, 
      error: err instanceof Error ? err : new Error(String(err)) 
    }
  }
}

/**
 * Removes a source from a collection by deleting the corresponding record
 * from the collection_sources table.
 * 
 * @param {string} collectionId - The ID of the collection to remove the source from
 * @param {string} sourceId - The ID of the source to remove
 * @returns {Promise<boolean>} True if successful, false if an error occurred
 */
export async function removeSourceFromCollection(collectionId: string, sourceId: string): Promise<{
  success: boolean,
  error: Error | null
}> {
  console.log(`[supabaseFunctions] Removing source ${sourceId} from collection ${collectionId}`)
  
  try {
    const { error, data } = await supabaseClient
      .from('collection_sources')
      .delete()
      .match({ collection_id: collectionId, source_id: sourceId })
      .select()

    if (error) {
      console.error(`[supabaseFunctions] Error removing source ${sourceId} from collection ${collectionId}:`, error)
      throw error
    }
    
    console.log(`[supabaseFunctions] Successfully removed source ${sourceId} from collection ${collectionId}`, data)
    return { success: true, error: null }
  } catch (err) {
    console.error(`[supabaseFunctions] Exception in removeSourceFromCollection:`, err)
    return { 
      success: false, 
      error: err instanceof Error ? err : new Error(String(err)) 
    }
  }
}

// =========== SOURCE FUNCTIONS ===========

/**
 * Fetches all sources from the database
 * 
 * @returns {Promise<Source[]>} Array of Source objects
 */
export async function fetchSources(): Promise<{
  data: Source[],
  error: Error | null
}> {
  try {
    const { data, error } = await supabaseClient
      .from('sources')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return { data: data || [], error: null }
  } catch (error) {
    console.error('Error fetching sources:', error)
    return { data: [], error: error instanceof Error ? error : new Error(String(error)) }
  }
}

/**
 * Adds a new source to the database
 * 
 * @param {Partial<Source>} sourceData - The source data to add
 * @returns {Promise<Source | null>} The newly created source or null if an error occurred
 */
export async function addSource(sourceData: Partial<Source>): Promise<{
  data: Source | null,
  error: Error | null
}> {
  try {
    if (!sourceData.name || !sourceData.type || !sourceData.content) {
      throw new Error('Name, type, and content are required')
    }

    // If no tags provided, use the type as the only tag
    if (!sourceData.tags) {
      sourceData.tags = `{${sourceData.type}}`;
    }

    const { data, error } = await supabaseClient
      .from('sources')
      .insert([sourceData])
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error adding source:', error)
    return { data: null, error: error instanceof Error ? error : new Error(String(error)) }
  }
}

/**
 * Updates an existing source in the database
 * 
 * @param {string} id - The ID of the source to update
 * @param {Partial<Source>} updates - The updated source data
 * @returns {Promise<Source | null>} The updated source or null if an error occurred
 */
export async function updateSource(id: string, updates: Partial<Source>): Promise<{
  data: Source | null,
  error: Error | null
}> {
  try {
    // Ensure tags are in the correct PostgreSQL array format if provided
    if (updates.tags && Array.isArray(updates.tags)) {
      updates.tags = `{${updates.tags.join(',')}}`;
    }

    const { data, error } = await supabaseClient
      .from('sources')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error updating source:', error);
    return { data: null, error: error instanceof Error ? error : new Error(String(error)) }
  }
}

/**
 * Deletes a source from the database
 * 
 * @param {string} id - The ID of the source to delete
 * @returns {Promise<boolean>} True if successful, false if an error occurred
 */
export async function deleteSource(id: string): Promise<{
  success: boolean,
  error: Error | null
}> {
  try {
    const { error } = await supabaseClient
      .from('sources')
      .delete()
      .eq('id', id)

    if (error) throw error
    return { success: true, error: null }
  } catch (error) {
    console.error('Error deleting source:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error : new Error(String(error)) 
    }
  }
}

// =========== SOURCE DISPLAY FUNCTIONS ===========

/**
 * Transforms database source objects into display-ready format
 * 
 * @param {Source[]} sources - Raw source objects from the database
 * @returns {SourceDisplay[]} Array of sources formatted for display
 */
export function transformSourcesForDisplay(sources: Source[]): SourceDisplay[] {
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

// =========== SOURCE CONFIG FUNCTIONS ===========

/**
 * Gets the configuration for a source
 * 
 * @param {string} sourceId - The ID of the source to get configuration for
 * @returns {Promise<SourceConfig | null>} The source configuration or null if not found
 */
export async function getConfigForSource(sourceId: string): Promise<{
  data: SourceConfig | null,
  error: Error | null
}> {
  try {
    const { data, error } = await supabaseClient
      .from('source_configs')
      .select('*')
      .eq('source', sourceId)
      .maybeSingle()

    if (error) throw error
    return { data: data as SourceConfig | null, error: null }
  } catch (err) {
    console.error('Error getting source config:', err)
    return { 
      data: null, 
      error: err instanceof Error ? err : new Error(String(err))
    }
  }
}

/**
 * Updates or creates a configuration for a source
 * 
 * @param {Partial<SourceConfig> & { source: string }} config - The configuration to update or create
 * @returns {Promise<SourceConfig | null>} The updated or created configuration
 */
export async function updateSourceConfig(
  config: Partial<SourceConfig> & { source: string }
): Promise<{
  data: SourceConfig | null,
  error: Error | null
}> {
  try {
    console.log('Starting updateSourceConfig with config:', config);
    
    // Check if config exists directly by source
    const { data: existingConfig, error: checkError } = await supabaseClient
      .from('source_configs')
      .select('*')
      .eq('source', config.source)
      .maybeSingle();
    
    console.log('Existing config check result:', existingConfig);
    
    let result;
    
    if (existingConfig) {
      console.log('Updating existing config for source:', config.source);
      const { data, error } = await supabaseClient
        .from('source_configs')
        .update(config)
        .eq('source', config.source)
        .select('*');
      
      if (error) {
        console.error('Error updating config:', error);
        throw error;
      }
      console.log('Update response:', data);
      result = data?.[0];
    } else {
      console.log('Inserting new config:', config);
      const { data, error } = await supabaseClient
        .from('source_configs')
        .insert([config])
        .select('*');
      
      if (error) {
        console.error('Error inserting config:', error);
        throw error;
      }
      console.log('Insert response:', data);
      result = data?.[0];
    }
    
    console.log('Final result:', result);
    return { data: result as SourceConfig, error: null };
  } catch (err) {
    console.error('Error in updateSourceConfig:', err);
    if (err instanceof Error) {
      console.error('Error details:', {
        message: err.message,
        stack: err.stack
      });
    }
    return {
      data: null,
      error: err instanceof Error ? err : new Error(String(err))
    };
  }
}

/**
 * Creates a new live data element
 * 
 * @param {Partial<LiveDataElement>} element - The live data element to create
 * @returns {Promise<LiveDataElement | null>} The created live data element
 */
export async function createLiveDataElement(
  element: Partial<LiveDataElement>
): Promise<{
  data: LiveDataElement | null,
  error: Error | null
}> {
  try {
    console.log('Creating live data element:', element);
    
    if (!element.source_config_id || !element.content) {
      throw new Error('source_config_id and content are required for live data elements');
    }
    
    const { data, error } = await supabaseClient
      .from('live_data_elements')
      .insert([{
        source_config_id: element.source_config_id,
        content: element.content,
        version: element.version || 1,
        status: element.status || 'active',
        metadata: element.metadata || {},
        fetch_timestamp: element.fetch_timestamp || new Date().toISOString()
      }])
      .select()
    
    if (error) {
      console.error('Error creating live data element:', error);
      throw error;
    }
    
    console.log('Created live data element:', data);
    return { data: data?.[0] as LiveDataElement, error: null }
  } catch (err) {
    console.error('Error in createLiveDataElement:', err);
    return {
      data: null,
      error: err instanceof Error ? err : new Error(String(err))
    }
  }
}

/**
 * Gets live data elements for a source
 * 
 * @param {string} sourceConfigId - The ID of the source configuration
 * @returns {Promise<LiveDataElement[]>} Array of live data elements
 */
export async function getLiveDataElements(sourceConfigId: string): Promise<{
  data: LiveDataElement[],
  error: Error | null
}> {
  try {
    const { data, error } = await supabaseClient
      .from('live_data_elements')
      .select('*')
      .eq('source_config_id', sourceConfigId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return { data: data as LiveDataElement[], error: null }
  } catch (err) {
    console.error('Error getting live data elements:', err);
    return {
      data: [],
      error: err instanceof Error ? err : new Error(String(err))
    }
  }
}

// =========== SOURCE TAGS FUNCTIONS ===========

/**
 * Gets all tags for a source
 * 
 * @param {string} sourceId - The ID of the source to get tags for
 * @returns {Promise<Array>} Array of tag objects
 */
export async function getTagsForSource(sourceId: string): Promise<{
  data: any[],
  error: Error | null
}> {
  try {
    const { data, error } = await supabaseClient
      .from('source_tags')
      .select(`
        tag_id,
        tags:tag_id(id, name)
      `)
      .eq('source_id', sourceId)

    if (error) throw error
    return { data: data?.map(item => item.tags) || [], error: null }
  } catch (err) {
    console.error('Error getting tags for source:', err);
    return {
      data: [],
      error: err instanceof Error ? err : new Error(String(err))
    }
  }
}

/**
 * Adds a tag to a source
 * 
 * @param {string} sourceId - The ID of the source to add the tag to
 * @param {string} tagId - The ID of the tag to add
 * @returns {Promise<boolean>} True if successful
 */
export async function addTagToSource(sourceId: string, tagId: string): Promise<{
  success: boolean,
  error: Error | null
}> {
  try {
    const { error } = await supabaseClient
      .from('source_tags')
      .insert([{ source_id: sourceId, tag_id: tagId }])

    if (error) throw error
    return { success: true, error: null }
  } catch (err) {
    console.error('Error adding tag to source:', err);
    return {
      success: false,
      error: err instanceof Error ? err : new Error(String(err))
    }
  }
}

/**
 * Removes a tag from a source
 * 
 * @param {string} sourceId - The ID of the source to remove the tag from
 * @param {string} tagId - The ID of the tag to remove
 * @returns {Promise<boolean>} True if successful
 */
export async function removeTagFromSource(sourceId: string, tagId: string): Promise<{
  success: boolean,
  error: Error | null
}> {
  try {
    const { error } = await supabaseClient
      .from('source_tags')
      .delete()
      .match({ source_id: sourceId, tag_id: tagId })

    if (error) throw error
    return { success: true, error: null }
  } catch (err) {
    console.error('Error removing tag from source:', err);
    return {
      success: false,
      error: err instanceof Error ? err : new Error(String(err))
    }
  }
}

/**
 * Fetches all tags from the database
 * 
 * @returns {Promise<Array>} Array of tag objects
 */
export async function fetchTags(): Promise<{
  data: any[],
  error: Error | null
}> {
  try {
    const { data, error } = await supabaseClient
      .from('tags')
      .select('*')
      .order('name', { ascending: true })

    if (error) throw error
    return { data: data || [], error: null }
  } catch (error) {
    console.error('Error fetching tags:', error);
    return {
      data: [],
      error: error instanceof Error ? error : new Error(String(error))
    }
  }
}

/**
 * Adds a new tag to the database
 * 
 * @param {string} name - The name of the tag to add
 * @returns {Promise<any>} The created tag
 */
export async function addTag(name: string): Promise<{
  data: any,
  error: Error | null
}> {
  try {
    // Check if tag already exists
    const { data: existingTags } = await supabaseClient
      .from('tags')
      .select('*')
      .eq('name', name)
    
    if (existingTags && existingTags.length > 0) {
      return { data: existingTags[0], error: null }
    }
    
    // Tag doesn't exist, create it
    const { data, error } = await supabaseClient
      .from('tags')
      .insert([{ name }])
      .select()

    if (error) throw error
    return { data: data?.[0], error: null }
  } catch (error) {
    console.error('Error adding tag:', error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error(String(error))
    }
  }
}

// =========== SOURCE UPLOAD FUNCTIONS ===========

/**
 * Uploads multiple sources to the database with tags
 * 
 * @param {ParsedFile[]} sources - The parsed files to upload as sources
 * @param {Record<string, string>} sourceNames - Custom names for sources, keyed by source ID
 * @param {string[]} tags - Tags to add to the sources
 * @returns {Promise<boolean>} True if successful
 */
export async function uploadSources(
  sources: ParsedFile[],
  sourceNames: Record<string, string>,
  currentTags: string[]
): Promise<{
  success: boolean,
  error: Error | null
}> {
  if (sources.length === 0) {
    return { success: false, error: new Error('No sources to upload') }
  }
  
  try {
    // Ensure tags exist
    const tagPromises = ['File Upload', ...currentTags].map(async tagName => {
      const { data: tags } = await fetchTags()
      const existingTag = tags.find(t => t.name.toLowerCase() === tagName.toLowerCase())
      if (existingTag) return existingTag.id
      
      const { data: newTag } = await addTag(tagName)
      return newTag?.id
    })
    await Promise.all(tagPromises)
    
    // Add sources
    const sourcePromises = sources.map(async source => {
      const name = sourceNames[source.id]?.trim() || source.name
      
      // Format tags properly for PostgreSQL array
      const formattedTags = JSON.stringify(['File Upload', ...currentTags, source.name.split('.').pop() || ''])
        .replace(/"/g, '')
        .replace('[', '{')
        .replace(']', '}')
      
      await addSource({
        name,
        type: 'File',
        content: source.content,
        tags: formattedTags
      })
    })
    
    await Promise.all(sourcePromises)
    return { success: true, error: null }
  } catch (error) {
    console.error('Error uploading sources:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error : new Error(String(error)) 
    }
  }
}

// =========== SYSTEM PROMPT FUNCTIONS ===========

/**
 * Fetches all system prompts from the database
 * 
 * @returns {Promise<{ data: SystemPrompt[], error: Error | null }>} Array of SystemPrompt objects
 */
export async function fetchSystemPrompts(): Promise<{
  data: SystemPrompt[],
  error: Error | null
}> {
  try {
    const { data, error } = await supabaseClient
      .from('system_prompts')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return { data: data || [], error: null }
  } catch (error) {
    console.error('Error fetching system prompts:', error)
    return { data: [], error: error instanceof Error ? error : new Error(String(error)) }
  }
}

/**
 * Adds a new system prompt to the database
 * 
 * @param {string} name - The name of the system prompt
 * @param {string} content - The content of the system prompt
 * @returns {Promise<{ data: SystemPrompt | null, error: Error | null }>} The newly created system prompt
 */
export async function addSystemPrompt(name: string, content: string): Promise<{
  data: SystemPrompt | null,
  error: Error | null
}> {
  try {
    if (!name || !content) {
      throw new Error('Name and content are required')
    }

    const { data, error } = await supabaseClient
      .from('system_prompts')
      .insert([{ name, content }])
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error adding system prompt:', error)
    return { data: null, error: error instanceof Error ? error : new Error(String(error)) }
  }
}

/**
 * Updates an existing system prompt in the database
 * 
 * @param {string} id - The ID of the system prompt to update
 * @param {Partial<SystemPrompt>} updates - The updated system prompt data
 * @returns {Promise<{ data: SystemPrompt | null, error: Error | null }>} The updated system prompt
 */
export async function updateSystemPrompt(id: string, updates: { name?: string, content?: string }): Promise<{
  data: SystemPrompt | null,
  error: Error | null
}> {
  try {
    const { data, error } = await supabaseClient
      .from('system_prompts')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error updating system prompt:', error)
    return { data: null, error: error instanceof Error ? error : new Error(String(error)) }
  }
}

/**
 * Deletes a system prompt from the database
 * 
 * @param {string} id - The ID of the system prompt to delete
 * @returns {Promise<{ success: boolean, error: Error | null }>} True if successful
 */
export async function deleteSystemPrompt(id: string): Promise<{
  success: boolean,
  error: Error | null
}> {
  try {
    // First, unlink any bots using this system prompt
    const { error: unlinkError } = await supabaseClient
      .from('bots')
      .update({ system_prompt_id: null })
      .eq('system_prompt_id', id)

    if (unlinkError) throw unlinkError

    // Then delete the system prompt
    const { error } = await supabaseClient
      .from('system_prompts')
      .delete()
      .eq('id', id)

    if (error) throw error
    return { success: true, error: null }
  } catch (error) {
    console.error('Error deleting system prompt:', error)
    return { success: false, error: error instanceof Error ? error : new Error(String(error)) }
  }
}

/**
 * Fetches a specific system prompt by ID
 * 
 * @param {string} id - The ID of the system prompt to fetch
 * @returns {Promise<{ data: SystemPrompt | null, error: Error | null }>} The system prompt or null if not found
 */
export async function getSystemPromptById(id: string): Promise<{
  data: SystemPrompt | null,
  error: Error | null
}> {
  try {
    const { data, error } = await supabaseClient
      .from('system_prompts')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error fetching system prompt:', error)
    return { data: null, error: error instanceof Error ? error : new Error(String(error)) }
  }
}
