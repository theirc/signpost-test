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
    
    // Process tags logic moved here
    const displaySources = sources.map(source => {
      let tags: string[] = [];
      if (source.tags) {
        if (typeof source.tags === 'string') {
          tags = source.tags.replace('{', '').replace('}', '').split(',');
        } else if (Array.isArray(source.tags)) {
          tags = source.tags;
        }
      }
      
      return {
        id: source.id,
        name: source.name,
        type: source.type_id,
        lastUpdated: source.last_updated || source.created_at,
        content: source.content,
        tags: tags
      };
    });
    
    setSourcesDisplay(displaySources);
  }, [sources, loading]);
  
  return { sourcesDisplay, setSourcesDisplay };
} 