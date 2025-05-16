import { format } from "date-fns"
import { Source, SourceDisplay, CollectionWithSourceCount } from "./types"

/**
 * Formats a date string to a readable format
 * @param date Date string to format
 * @returns Formatted date string
 */
export const formatDate = (date: string): string => {
  return format(new Date(date), "MMM dd, yyyy")
}

/**
 * Transforms sources from database format to display format
 * @param sources Array of sources from database
 * @returns Array of sources formatted for display
 */
export const transformSourcesForDisplay = (sources: Source[]): SourceDisplay[] => {
  return sources.map(source => {
    // Process tags: convert from string or string[] to string[]
    let tags: string[] = []
    if (source.tags) {
      if (typeof source.tags === 'string') {
        try {
          // First try JSON parse for ["tag1","tag2"] format
          tags = JSON.parse(source.tags)
        } catch {
          // If that fails, try PostgreSQL {tag1,tag2} format
          tags = source.tags
            .replace('{', '')
            .replace('}', '')
            .split(',')
            .map(tag => tag.trim())
            .filter(tag => tag.length > 0)
        }
      } else if (Array.isArray(source.tags)) {
        tags = source.tags
      }
    }

    return {
      id: source.id,
      name: source.name,
      type: source.type,
      lastUpdated: source.last_updated || source.created_at,
      content: source.content,
      tags: tags
    }
  })
}

/**
 * Calculates the percentage of sources with vectors
 * @param vectorizedCount Number of sources with vectors
 * @param totalCount Total number of sources
 * @returns Percentage as a number between 0-100
 */
export const calculateVectorPercentage = (vectorizedCount: number, totalCount: number): number => {
  if (totalCount === 0) return 0
  return Math.round((vectorizedCount / totalCount) * 100)
}

/**
 * Enhances collections with source count information
 * @param collections Array of collections
 * @param collectionSourceCounts Map of collection IDs to source counts
 * @returns Collections with source count information
 */
export const enhanceCollectionsWithSourceCounts = (
  collections: any[],
  collectionSourceCounts: Record<string, { total: number, vectorized: number }>
): CollectionWithSourceCount[] => {
  return collections.map(collection => {
    const counts = collectionSourceCounts[collection.id] || { total: 0, vectorized: 0 }
    return {
      ...collection,
      sourceCount: counts.total,
      vectorizedCount: counts.vectorized
    }
  })
}
