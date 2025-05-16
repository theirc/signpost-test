import { supabase } from "@/lib/agents/db"
import { useSimilaritySearch } from "@/lib/fileUtilities/use-similarity-search"
import { VectorGenerationResult } from "./types"

/**
 * Generate vectors for a collection's sources
 */
export const generateCollectionVector = async (
  id: string
): Promise<VectorGenerationResult> => {
  const { generateEmbedding } = useSimilaritySearch()
  try {
    console.log(`[generateCollectionVector] Starting vector generation for collection ${id}`)

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
    console.log(`[generateCollectionVector] Found ${sourcesToProcess.length} sources that need vectors (${skippedCount} already vectorized)`)

    if (sourcesToProcess.length === 0) {
      console.log('[generateCollectionVector] No sources need vectorization - all vectors are up to date')
      return { success: true, error: null }
    }

    // Track successful and failed sources
    const results = {
      successful: 0,
      failed: 0,
      failedSources: [] as string[]
    }

    // Process sources
    for (const cs of sourcesToProcess) {
      try {
        console.log(`[generateCollectionVector] Generating vector for source ${cs.source_id}`)
        
        // Check if source has content
        if (!cs.sources?.content) {
          console.warn(`[generateCollectionVector] Source ${cs.source_id} has no content, skipping`)
          results.failed++
          results.failedSources.push(cs.source_id)
          continue
        }

        // Generate embedding
        let embedding;
        try {
          embedding = await generateEmbedding(cs.sources.content)
          
          if (!embedding || !Array.isArray(embedding)) {
            console.error(`[generateCollectionVector] Invalid embedding for source ${cs.source_id}:`, embedding)
            results.failed++
            results.failedSources.push(cs.source_id)
            continue
          }
        } catch (embeddingError) {
          console.error(`[generateCollectionVector] Error generating embedding for source ${cs.source_id}:`, embeddingError)
          results.failed++
          results.failedSources.push(cs.source_id)
          continue
        }

        // Update source with embedding
        // Convert embedding array to string if needed
        const vectorValue = Array.isArray(embedding) ? JSON.stringify(embedding) : embedding;
        
        const { error: updateError } = await supabase
          .from('sources')
          .update({ vector: vectorValue })
          .eq('id', cs.source_id)

        if (updateError) {
          console.error(`[generateCollectionVector] Error updating source ${cs.source_id}:`, updateError)
          results.failed++
          results.failedSources.push(cs.source_id)
          continue
        }

        results.successful++
      } catch (sourceError) {
        console.error(`[generateCollectionVector] Unexpected error processing source ${cs.source_id}:`, sourceError)
        results.failed++
        results.failedSources.push(cs.source_id)
      }
    }

    // Log results summary
    console.log(`[generateCollectionVector] Vector generation completed for collection ${id}:`, results)
    
    // If any sources failed, return partial success
    if (results.failed > 0) {
      return { 
        success: results.successful > 0, // Consider it a success if at least some vectors were generated
        error: new Error(`Failed to generate vectors for ${results.failed} sources: ${results.failedSources.join(', ')}`),
        partialSuccess: true,
        results
      }
    }

    return { 
      success: true, 
      error: null,
      results
    }
  } catch (error) {
    console.error(`[generateCollectionVector] Error:`, error)
    console.error('[generateCollectionVector] Stack trace:', error instanceof Error ? error.stack : 'No stack trace available')
    return {
      success: false,
      error: error instanceof Error ? error : new Error(String(error))
    }
  }
}
