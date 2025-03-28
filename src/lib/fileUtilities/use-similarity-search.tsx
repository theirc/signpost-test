import { pipeline, env } from '@xenova/transformers';
import { useSupabase } from '@/hooks/use-supabase';

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
  const supabase = useSupabase();

  const generateEmbedding = async (text: string) => {
    try {
      console.log('[useSimilaritySearch] Starting embedding generation...');
      
      const generateEmbedding = await pipeline('feature-extraction', 'Supabase/gte-small', {
        revision: 'main',
        quantized: true
      });
      
      const output = await generateEmbedding(text, {
        pooling: 'mean',
        normalize: true,
      });
      
      console.log('[useSimilaritySearch] Embedding generated successfully');
      
      // Convert to array and ensure it's the correct size (384 for gte-small)
      const embedding = Array.from(output.data);
      if (embedding.length !== 384) {
        throw new Error(`Expected embedding dimension of 384, but got ${embedding.length}`);
      }
      
      return embedding;
    } catch (error) {
      console.error('[useSimilaritySearch] Error generating embedding:', error);
      throw error;
    }
  };

  const searchSimilarContent = async (text: string): Promise<SimilaritySearchResult[]> => {
    try {
      console.log('[useSimilaritySearch] Starting similarity search for:', text);
      
      // Generate embedding for the search query
      const queryVector = await generateEmbedding(text);
      
      // Call the Supabase RPC function for similarity search
      const { data, error } = await supabase.rpc('similarity_search', {
        query_vector: queryVector
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