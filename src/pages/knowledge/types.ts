import { LiveDataElement } from '@/types/common'

export interface Collection {
  id: string
  name: string
  created_at: string
  team_id?: string
  vector?: number[]
}

export interface Source {
  id: string
  name: string
  type: string
  content: string
  url?: string
  tags?: string[] | string
  created_at: string
  last_updated?: string
  vector?: number[]
  team_id?: string
}

export interface CollectionSource {
  collection_id: string
  source_id: string
  sources?: Source
}

export interface CollectionWithSourceCount extends Collection {
  sourceCount: number
  vectorizedCount: number
}

export interface SourceDisplay {
  id: string
  name: string
  type: string
  lastUpdated: string
  content: string
  tags: string[]
}

export interface CollectionSourcesMap {
  [key: string]: Source[]
}

export interface DeleteCollectionResult {
  success: boolean
  error: Error | null
}

export interface VectorGenerationResult {
  success: boolean
  error: Error | null
  partialSuccess?: boolean
  results?: {
    successful: number
    failed: number
    failedSources: string[]
  }
}
