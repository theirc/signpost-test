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
      collections: NodeIO

      condition: NodeIO
    },
    parameters: {
      engine?: "weaviate" | "exa" | "supabase"
      maxResults?: number
      domain?: string
      distance?: number
      collections?: string[]
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
  console.log("Executing search worker with parameters:", worker.parameters);

  worker.fields.output.value = [];
  worker.fields.references.value = [];

  const query = worker.fields.input.value || "";
  if (!query) {
    console.log("Search worker: No query provided.");
    return;
  }

  const engine = worker.parameters.engine || "weaviate"; // Default to an external engine
  let finalResults: VectorDocument[] = [];
  let deduped: VectorDocument[] = [];

  // --- Engine-Specific Search Logic --- 

  if (engine === 'supabase') {
    // --- Supabase Search Path --- 
    const collectionIds = worker.parameters.collections; // Array of IDs
    const limit = worker.parameters.maxResults || 5;
    const similarityThreshold = worker.parameters.distance ?? 0.3;

    if (collectionIds && collectionIds.length > 0) {
      console.log(`[Supabase Path] Searching ${collectionIds.length} collections:`, collectionIds);
      let queryEmbedding: number[] | null = null;
      try {
        // Generate embedding once
        const { data: embedding, error: embeddingError } = await generateEmbedding(query);
        if (embeddingError || !embedding) throw embeddingError || new Error("Failed to generate query embedding.");
        queryEmbedding = embedding;
        console.log(`[Supabase Path] Generated query embedding (length: ${queryEmbedding.length}).`);

        // Search all collections concurrently
        const searchPromises = collectionIds.map(async (collectionId) => {
            console.log(`  - Searching collection: ${collectionId} (Limit: ${limit}, Threshold: ${similarityThreshold})`);
            try {
                const { data: supabaseMatches, error: rpcError } = await supabase.rpc('similarity_search', {
                    query_vector: queryEmbedding,
                    target_collection_id: collectionId,
                    match_threshold: similarityThreshold,
                    match_count: limit
                });
                if (rpcError) throw rpcError; // Propagate error to Promise.all catch
                
                // Transform results
                return (supabaseMatches || []).map((match: any) => {
                    const title = `${match.name || `[DB] ${match.source_type}:${match.id.substring(0, 8)}`} (Sim: ${match.similarity?.toFixed(3) ?? 'N/A'})`;
                    return {
                        ref: `supabase:${match.source_type}:${match.id}`,
                        title: title,
                        body: match.content,
                        source: `supabase_collection:${collectionId}`,
                    };
                });
            } catch (error) {
                console.error(`  - Error searching collection ${collectionId}:`, error);
                return []; // Return empty for this collection on error
            }
        });
        
        // Aggregate results
        const resultsFromAllCollections = await Promise.all(searchPromises);
        finalResults = resultsFromAllCollections.flat(); // Assign directly to finalResults
        console.log(`[Supabase Path] Total results: ${finalResults.length}`);

      } catch (error) {
        console.error("[Supabase Path] Error during search process:", error);
        finalResults = []; // Ensure empty results on error
      }
    } else {
        console.log("[Supabase Path] No collection IDs provided.");
        finalResults = [];
    }

  } else {
    // --- External Engine Search Path (Weaviate, Exa, etc.) --- 
    const domain = worker.parameters.domain;
    const limit = worker.parameters.maxResults || 5;
    const externalSearchDistance = worker.parameters.distance ?? 0.5; // Use distance, default 0.5

    if (domain) {
      console.log(`[External Path] Searching engine '${engine}' in domain: ${domain} (Limit: ${limit}, Distance: ${externalSearchDistance})`);
      try {
        const externalSearchUrl = "https://directus-qa-support.azurewebsites.net/search"; // Assuming this URL handles different engines or we need logic here
        const r = await axios.post(externalSearchUrl, {
          query,
          domains: [domain], // Pass domain in array
          limit,
          distance: externalSearchDistance,
          // We might need to pass the 'engine' type to the backend if it handles multiple engines
          // engine: engine, 
        });
        finalResults = r.data as VectorDocument[] || []; // Assign directly
        console.log(`[External Path] Total results: ${finalResults.length}`);
      } catch (error) {
        console.error("[External Path] Error during search:", error);
        finalResults = []; // Ensure empty results on error
      }
    } else {
        console.log("[External Path] No domain provided.");
        finalResults = [];
    }
  }

  // --- Post-Search Processing (Deduplication) --- 
  console.log("Total results before deduplication:", finalResults.length);
  deduped = deduplicateDocuments(finalResults);
  console.log("Deduplicated results:", deduped.length);

  if (deduped.length === 0) {
    console.log("Search worker: No results found after search and deduplication.");
    return;
  }

  // --- Set Output --- 
  worker.fields.output.value = deduped;
  worker.fields.references.value = deduped.map(d => ({
    link: d.ref || d.source || "",
    title: d.title || "Search Result"
  }));

  console.log("Search worker execution finished.");
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
        { type: "string", direction: "input", title: "Collections", name: "collections" },

        { type: "unknown", direction: "input", title: "Condition", name: "condition", condition: true },
      ],
      search
    )
  },
  get registry() { return search },
}

