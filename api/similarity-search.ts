import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Interface to match the Supabase function's return type
interface SimilaritySearchResult {
  id: string
  content: string
  name: string
  similarity: number
  source_type: 'source' | 'live_data'
}

export default async function handler(
  request: VercelRequest,
  response: VercelResponse
): Promise<void> {
  try {
    // Only allow POST requests
    if (request.method !== 'POST') {
      response.status(405).json({ error: 'Method not allowed' });
      return;
    }

    // Get the search text from the request body
    const { text } = request.body;

    if (!text || typeof text !== 'string') {
      response.status(400).json({ error: 'Missing or invalid text parameter' });
      return;
    }

    // Initialize Supabase client using the environment variables from .env.local
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!
    );

    console.log('[API] Generating embedding for search query...');
    
    // Use Function constructor for dynamic import
    const TransformersApi = Function('return import("@xenova/transformers")')();
    const { pipeline } = await TransformersApi;
    
    const generateEmbedding = await pipeline('feature-extraction', 'Supabase/gte-small', {
      revision: 'main',
      quantized: true
    });
    
    const output = await generateEmbedding(text, {
      pooling: 'mean',
      normalize: true,
    });
    
    const queryVector = Array.from(output.data);
    
    // Call the existing similarity_search function
    const { data, error } = await supabase.rpc('similarity_search', {
      query_vector: queryVector
    }) as { data: SimilaritySearchResult[] | null, error: any };

    if (error) {
      console.error('[API] Error:', error);
      response.status(500).json({ error: 'Database error', details: error });
      return;
    }

    // Return the results
    response.status(200).json({
      success: true,
      results: data || []
    });

  } catch (error) {
    console.error('[API] Error:', error);
    response.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 