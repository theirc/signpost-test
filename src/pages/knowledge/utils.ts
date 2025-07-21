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

export const transformSourcesForDisplay = (sources: Source[]): SourceDisplay[] => {
    if (!sources) return []
    return sources.map(source => ({
        id: source.id,
        name: source.name,
        type: source.type || 'Unknown',
        lastUpdated: source.last_updated || source.created_at || new Date().toISOString(),
        content: source.content || '',
        tags: Array.isArray(source.tags) ? source.tags : [],
    }))
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
