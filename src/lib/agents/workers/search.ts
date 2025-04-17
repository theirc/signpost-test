import axios from "axios"
import { generateEmbedding, supabase } from "@/lib/data/supabaseFunctions"

declare global {

  interface SearchWorker extends AIWorker {
    fields: {
      input: NodeIO
      output: NodeIO
      references: NodeIO

      engine: NodeIO
      domain: NodeIO
      distance: NodeIO
      maxResults: NodeIO
      collection: NodeIO

      condition: NodeIO
    },
    parameters: {
      engine?: "weaviate" | "exa"
      maxResults?: number
      domain?: string
      distance?: number
      collection?: string
    }
  }

  interface SearchParams {
    query: string
    domains?: string[]
    distance?: number
    limit?: number
    locales?: string[]
  }

  interface VectorDocument {
    ref?: string
    title: string
    body: string
    domain?: string
    source?: string
    locale?: string
    lat?: number
    lon?: number
  }
}

function deduplicateDocuments(array: VectorDocument[]): VectorDocument[] {
  const seen = {}
  const deduped: VectorDocument[] = []
  for (const d of array) {
    const key = `${d.source || 'unknown'}-${d.ref || d.title}`;
    if (!seen[key]) {
      deduped.push(d)
      seen[key] = true
    }
  }
  return deduped
}

async function execute(worker: SearchWorker) {

  console.log("Executing search worker with parameters:", worker.parameters)

  worker.fields.output.value = []
  worker.fields.references.value = []

  const query = worker.fields.input.value || ""
  if (!query) {
    console.log("Search worker: No query provided.")
    return
  }

  const domains = worker.parameters.domain ? [worker.parameters.domain] : []
  const limit = worker.parameters.maxResults || 5
  const similarityThreshold = worker.parameters.distance ?? 0.3
  const collectionId = worker.parameters.collection

  const externalSearchDistance = 0.5;

  let combinedResults: VectorDocument[] = []

  // 1. Perform external search (e.g., Directus)
  try {
    const externalSearchUrl = "https://directus-qa-support.azurewebsites.net/search"
    console.log(`Performing external search to ${externalSearchUrl} with query: "${query}", domains: ${domains}, limit: ${limit}, distance: ${externalSearchDistance}`)
    const r = await axios.post(externalSearchUrl, {
      query,
      domains,
      limit,
      distance: externalSearchDistance,
    })
    const externalData = r.data as VectorDocument[] || []
    console.log("External search results:", externalData.length)
    combinedResults = combinedResults.concat(externalData)
  } catch (error) {
    console.error("Error during external search:", error)
    // Decide if you want to stop or continue if external search fails
  }

  // 2. Perform Supabase vector search if collection is specified
  if (collectionId) {
    console.log(`Performing Supabase vector search in collection: ${collectionId} (Limit: ${limit}, Threshold: ${similarityThreshold})`)
    try {
      // Generate embedding for the query
      const { data: queryEmbedding, error: embeddingError } = await generateEmbedding(query)

      if (embeddingError || !queryEmbedding) {
        throw embeddingError || new Error("Failed to generate query embedding.")
      }

      console.log(`Generated query embedding (length: ${queryEmbedding.length}). Calling Supabase RPC 'similarity_search'...`)

      // Call the updated RPC function 'similarity_search' with all parameters
      const { data: supabaseMatches, error: rpcError } = await supabase.rpc('similarity_search', {
        query_vector: queryEmbedding,
        target_collection_id: collectionId,
        match_threshold: similarityThreshold,
        match_count: limit
      })

      if (rpcError) {
        throw rpcError
      }

      console.log("Supabase vector search raw results:", supabaseMatches)

      // Transform Supabase results based on 'similarity_search' function output
      // Assuming the RPC function now returns: { id, name, content, similarity, source_type }
      const supabaseVectorDocs: VectorDocument[] = (supabaseMatches || []).map((match: any) => {
        // Construct the title using the name (fallback to type/ID) and add similarity
        const title = `${match.name || `[DB] ${match.source_type}:${match.id.substring(0, 8)}`} (Sim: ${match.similarity?.toFixed(3) ?? 'N/A'})`;
        
        return {
          ref: `supabase:${match.source_type}:${match.id}`, // Construct ref using type and id
          title: title, // Assign the constructed title
          body: match.content, // Use content as body
          source: `supabase_collection:${collectionId}`, // Indicate it's from the specified Supabase collection
        };
      });

      console.log("Transformed Supabase results:", supabaseVectorDocs.length)
      combinedResults = combinedResults.concat(supabaseVectorDocs)

    } catch (error) {
      console.error("Error during Supabase vector search:", error)
      // Decide if you want to stop or continue if Supabase search fails
    }
  }

  // 3. Combine, deduplicate, and set output
  console.log("Total combined results before deduplication:", combinedResults.length)
  const deduped = deduplicateDocuments(combinedResults)
  console.log("Deduplicated results:", deduped.length)

  if (deduped.length === 0) {
    console.log("Search worker: No results found after combining and deduplicating.")
    return
  }

  // Sort by relevance if possible (might need match_score from results)
  // For now, just assign
  worker.fields.output.value = deduped

  worker.fields.references.value = deduped.map(d => ({
    link: d.ref || d.source || "", // Ensure link is populated
    title: d.title || "Search Result" // Ensure title is populated
  }))

  console.log("Search worker execution finished.")
}


export const search: WorkerRegistryItem = {
  title: "Search",
  execute,
  category: "tool",
  type: "search",
  description: "This worker allows you to search for information in the knowledge base",
  create(agent: Agent) {
    return agent.initializeWorker(
      {
        type: "search",
        parameters: {},
      },
      [
        { type: "string", direction: "input", title: "Input", name: "input" },
        { type: "doc", direction: "output", title: "Documents", name: "output" },
        { type: "references", direction: "output", title: "References", name: "references" },

        { type: "string", direction: "input", title: "Engine", name: "engine" },
        { type: "string", direction: "input", title: "Domain", name: "domain" },
        { type: "number", direction: "input", title: "Distance", name: "distance" },
        { type: "number", direction: "input", title: "Max Results", name: "maxResults" },
        { type: "string", direction: "input", title: "Collection", name: "collection" },

        { type: "unknown", direction: "input", title: "Condition", name: "condition", condition: true },
      ],
      search
    )
  },
  get registry() { return search },
}

