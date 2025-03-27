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
    
    // Use .then() syntax for dynamic import
    import('@xenova/transformers')
      .then(({ pipeline }) => {
        return pipeline('feature-extraction', 'Supabase/gte-small', {
          revision: 'main',
          quantized: true
        });
      })
      .then(generateEmbedding => {
        return generateEmbedding(text, {
          pooling: 'mean',
          normalize: true,
        });
      })
      .then(output => {
        const queryVector = Array.from(output.data);
        
        // Call the existing similarity_search function
        return supabase.rpc('similarity_search', {
          query_vector: queryVector
        }).then(result => result as { data: SimilaritySearchResult[] | null, error: any });
      })
      .then(({ data, error }) => {
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
      })
      .catch(error => {
        console.error('[API] Error:', error);
        response.status(500).json({ 
          error: 'Internal server error',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      });

  } catch (error) {
    console.error('[API] Error:', error);
    response.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 