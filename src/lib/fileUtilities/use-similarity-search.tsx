import { env } from '@xenova/transformers';
import { supabase } from '../agents/db';

// Configure transformers.js environment for browser
env.useBrowserCache = false;
env.allowLocalModels = false;

export interface SimilaritySearchResult {
  id: string;
  content: string;
  name: string;
  similarity: number;
  source_type: 'source' | 'live_data';
}

export function useSimilaritySearch() {

  const generateEmbedding = async (text: string, apiKey?: string) => {
    try {
      console.log('[useSimilaritySearch] Starting OpenAI embedding generation...');
      
      if (!apiKey) {
        throw new Error('No OpenAI API key provided. Please configure your API key.');
      }
      
      const input = text.replace(/\n/g, ' ');
      
      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'text-embedding-ada-002',
          input
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`);
      }
      
      const data = await response.json();
      const embedding = data.data[0].embedding;
      
      console.log('[useSimilaritySearch] OpenAI embedding generated successfully');
      
      if (embedding.length !== 1536) {
        throw new Error(`Expected embedding dimension of 1536, but got ${embedding.length}`);
      }
      
      return embedding;
    } catch (error) {
      console.error('[useSimilaritySearch] Error generating OpenAI embedding:', error);
      throw error;
    }
  };

  const searchSimilarContent = async (text: string, apiKey?: string): Promise<SimilaritySearchResult[]> => {
    try {
      console.log('[useSimilaritySearch] Starting similarity search for:', text);
      
      const queryVector = await generateEmbedding(text, apiKey);
      
      const { data, error } = await supabase.rpc('similarity_search', {
        query_vector: queryVector as string,
        target_collection_id: '',
        match_threshold: 5,
        match_count: 0.3
      }) as { data: SimilaritySearchResult[] | null, error: any };

      if (error) {
        console.error('[useSimilaritySearch] Database error:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('[useSimilaritySearch] Error in searchSimilarContent:', error);
      throw error;
    }
  };

  return {
    searchSimilarContent,
    generateEmbedding
  };
} 