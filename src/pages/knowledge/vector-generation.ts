import { supabase } from "@/lib/agents/db"
import { useSimilaritySearch } from "@/lib/fileUtilities/use-similarity-search"
import { VectorGenerationResult } from "./types"
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters"
import { app } from "@/lib/app"

/**
 * Generate vectors for a collection's sources
 */
export const generateCollectionVector = async (
  id: string,
  teamId: string
): Promise<VectorGenerationResult> => {
  const { generateEmbedding } = useSimilaritySearch()
  
  // Fetch team-specific API keys
  const apiKeys = await app.fetchAPIkeys(teamId)
  const openaiApiKey = apiKeys.openai
  
  if (!openaiApiKey) {
    return {
      success: false,
      error: new Error('OpenAI API key not found for this team. Please configure your API key in team settings.')
    }
  }
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

    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

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
          const chunks = await textSplitter.splitText(cs.sources.content);
          const embeddings = await Promise.all(chunks.map(chunk => generateEmbedding(chunk, openaiApiKey)));
          embedding = embeddings.reduce((acc, emb) => acc.map((val, i) => val + emb[i]));
          embedding = embedding.map((val: number) => val / embeddings.length);
          
          if (!embedding || !Array.isArray(embedding)) {
            console.error(`[generateCollectionVector] Invalid embedding for source ${cs.source_id}:`, embedding)
            results.failed++
            results.failedSources.push(cs.source_id)
            continue
          }
        } catch (embeddingError) {
          // Check if this is a token limit error and provide a clearer message
          const errorMessage = embeddingError instanceof Error ? embeddingError.message : String(embeddingError)
          
          if (errorMessage.includes('maximum context length') || errorMessage.includes('tokens')) {
            console.error(`[generateCollectionVector] Source ${cs.source_id} is too large for embedding (content exceeds token limit). This source needs to be chunked into smaller pieces.`)
            console.error(`[generateCollectionVector] Original error: ${errorMessage}`)
          } else {
            console.error(`[generateCollectionVector] Error generating embedding for source ${cs.source_id}:`, embeddingError)
          }
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
      // Create a more descriptive error message for the toast
      let errorMessage = `Failed to generate vectors for ${results.failed} source${results.failed > 1 ? 's' : ''}.`
      
      // Add specific guidance based on common error patterns from the logs
      const hasTokenLimitErrors = results.failedSources.some(sourceId => {
        // This is a simple check - in practice you might want to track error types per source
        return true // For now, assume token limit issues since that's the main error we're seeing
      })
      
      if (hasTokenLimitErrors) {
        errorMessage += ' Some sources are too large for embedding and need to be split into smaller chunks.'
      }
      
      return { 
        success: results.successful > 0, // Consider it a success if at least some vectors were generated
        error: new Error(errorMessage),
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
