/**
 * useSourceDisplay Hook
 * 
 * A hook to transform database source objects into display-ready format.
 * Handles converting PostgreSQL array notation to JavaScript arrays,
 * and standardizes source data for UI components.
 * 
 * @param {Source[]} sources - Raw source objects from the database
 * @param {boolean} loading - Loading state from the useSources hook
 * @returns {Object} An object containing:
 *   - sourcesDisplay: Array of sources formatted for display
 *   - setSourcesDisplay: Function to update the display sources
 */
import { useState, useEffect } from 'react'
import { Source } from './use-sources'

// Define the display source type
export type SourceDisplay = {
  id: string
  name: string
  type: string
  lastUpdated: string
  content: string
  tags: string[]
}

export function useSourceDisplay(sources: Source[], loading: boolean) {
  const [sourcesDisplay, setSourcesDisplay] = useState<SourceDisplay[]>([]);
  
  useEffect(() => {
    if (loading) return;
    
    const displaySources = sources.map(source => {
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
    
    setSourcesDisplay(displaySources);
  }, [sources, loading]);
  
  return { sourcesDisplay, setSourcesDisplay };
} 