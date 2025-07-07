import JSZip from 'jszip'
import { supabase } from "@/lib/agents/db"
import { Source } from "./types"

/**
 * Downloads all text files from sources in a collection as a ZIP file
 */
export const downloadCollectionSources = async (collectionId: string, collectionName: string): Promise<void> => {
  try {
    console.log(`[downloadCollectionSources] Starting download for collection: ${collectionId}`)

    // Fetch all sources for the collection
    const { data: collectionSources, error } = await supabase
      .from('collection_sources')
      .select(`
        source_id,
        sources:source_id (
          id,
          name,
          content,
          type
        )
      `)
      .eq('collection_id', collectionId)

    if (error) {
      console.error('[downloadCollectionSources] Error fetching sources:', error)
      throw new Error('Failed to fetch collection sources')
    }

    if (!collectionSources || collectionSources.length === 0) {
      throw new Error('No sources found in this collection')
    }

    // Filter sources that have content
    const sourcesWithContent = collectionSources
      .filter(cs => cs.sources?.content)
      .map(cs => cs.sources as Source)

    if (sourcesWithContent.length === 0) {
      throw new Error('No sources with content found in this collection')
    }

    console.log(`[downloadCollectionSources] Found ${sourcesWithContent.length} sources with content`)

    // Create ZIP file
    const zip = new JSZip()
    
    // Track filename counts to handle duplicates
    const filenameCount: Record<string, number> = {}

    sourcesWithContent.forEach((source) => {
      // Create a safe filename
      let filename = source.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()
      
      // Ensure it ends with .txt
      if (!filename.endsWith('.txt')) {
        filename += '.txt'
      }

      // Handle duplicate filenames
      if (filenameCount[filename]) {
        filenameCount[filename]++
        const nameWithoutExt = filename.replace('.txt', '')
        filename = `${nameWithoutExt}_${filenameCount[filename]}.txt`
      } else {
        filenameCount[filename] = 1
      }

      // Add file to ZIP with metadata header
      const fileContent = `# ${source.name}
# Type: ${source.type}
# Source ID: ${source.id}
# Generated: ${new Date().toISOString()}

${source.content}`

      zip.file(filename, fileContent)
    })

    // Generate ZIP file
    console.log('[downloadCollectionSources] Generating ZIP file...')
    const zipBlob = await zip.generateAsync({ type: 'blob' })

    // Create download link
    const url = URL.createObjectURL(zipBlob)
    const link = document.createElement('a')
    link.href = url
    
    // Create safe collection name for filename
    const safeCollectionName = collectionName.replace(/[^a-z0-9]/gi, '_').toLowerCase()
    link.download = `${safeCollectionName}_sources.zip`
    
    // Trigger download
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    // Clean up
    URL.revokeObjectURL(url)
    
    console.log(`[downloadCollectionSources] Download completed: ${link.download}`)
  } catch (error) {
    console.error('[downloadCollectionSources] Error:', error)
    throw error
  }
}
