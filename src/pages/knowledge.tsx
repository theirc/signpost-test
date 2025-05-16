import Knowledge from "./knowledge/index"

// Re-export the Knowledge component as default
export default Knowledge

// Re-export the CollectionsManagement component for backward compatibility
export { default as CollectionsManagement } from "./knowledge/index"

// Re-export types for backward compatibility
export type {
  Collection,
  Source,
  CollectionSource,
  CollectionWithSourceCount,
  SourceDisplay,
  CollectionSourcesMap,
  DeleteCollectionResult,
  VectorGenerationResult
} from "./knowledge/types"
