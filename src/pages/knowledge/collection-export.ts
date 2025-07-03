import { supabase } from "@/lib/agents/db"
import { Source } from "./types"
import JSZip from "jszip"

/**
 * Export collection sources as a zip file containing individual txt documents
 */
export async function exportCollectionSources(collectionId: string, collectionName: string): Promise<void> {
  try {
    console.log(`[exportCollectionSources] Starting export for collection: ${collectionId}`)
    
    // Fetch all sources for the collection
    type CollectionSourceResponse = {
      source_id: string;
      sources: Source;
    }
    
    const { data, error } = await supabase
      .from('collection_sources')
      .select(`
        source_id,
        sources:source_id(*)
      `)
      .eq('collection_id', collectionId) as {
        data: CollectionSourceResponse[] | null,
        error: Error | null
      }

    if (error) {
      console.error(`[exportCollectionSources] Error fetching sources:`, error)
      throw new Error(`Failed to fetch collection sources: ${error.message}`)
    }

    if (!data || data.length === 0) {
      throw new Error('No sources found in this collection')
    }

    // Extract sources and filter out any null entries
    const sources = data
      .map(item => item.sources)
      .filter((source): source is Source => source !== null)

    if (sources.length === 0) {
      throw new Error('No valid sources found in this collection')
    }

    console.log(`[exportCollectionSources] Found ${sources.length} sources to export`)

    // Create a new JSZip instance
    const zip = new JSZip()
    
    // Create a folder for the collection
    const collectionFolder = zip.folder(sanitizeFileName(collectionName))
    
    if (!collectionFolder) {
      throw new Error('Failed to create collection folder in zip')
    }

    // Add each source as a separate txt file
    sources.forEach((source, index) => {
      const fileName = sanitizeFileName(source.name) || `source_${index + 1}`
      const fileContent = createSourceFileContent(source)
      
      collectionFolder.file(`${fileName}.txt`, fileContent)
    })

    // Generate the zip file
    console.log(`[exportCollectionSources] Generating zip file...`)
    const zipBlob = await zip.generateAsync({ type: "blob" })
    
    // Create download link and trigger download
    const downloadUrl = URL.createObjectURL(zipBlob)
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = `${sanitizeFileName(collectionName)}_sources.zip`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    // Clean up the URL object
    URL.revokeObjectURL(downloadUrl)
    
    console.log(`[exportCollectionSources] Export completed successfully`)
  } catch (error) {
    console.error(`[exportCollectionSources] Error:`, error)
    throw error
  }
}

function createSourceFileContent(source: Source): string {
  const lines = [
    `Source: ${source.name}`,
    `Type: ${source.type}`,
    `Created: ${new Date(source.created_at).toLocaleString()}`,
  ]
  
  if (source.url) lines.push(`URL: ${source.url}`)
  if (source.last_updated) lines.push(`Last Updated: ${new Date(source.last_updated).toLocaleString()}`)
  
  if (source.tags && Array.isArray(source.tags) && source.tags.length > 0) {
    lines.push(`Tags: ${source.tags.join(', ')}`)
  } else if (source.tags && typeof source.tags === 'string') {
    lines.push(`Tags: ${source.tags}`)
  }
  
  lines.push('')
  lines.push('--- CONTENT ---')
  lines.push('')
  lines.push(source.content || 'No content available')
  
  return lines.join('\n')
}

function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/[<>:"/\\|?*]/g, '_')
    .replace(/\s+/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^_+|_+$/g, '')
    .substring(0, 100)
}
