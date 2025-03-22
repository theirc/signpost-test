// api/hello.cjs.ts
import { VercelRequest, VercelResponse } from '@vercel/node';
import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';

// Helper function to add timeout to promises
const withTimeout = <T>(promise: Promise<T>, timeoutMs: number, errorMsg: string): Promise<T> => {
  let timeoutId: NodeJS.Timeout;
  
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`Timeout after ${timeoutMs}ms: ${errorMsg}`));
    }, timeoutMs);
  });
  
  return Promise.race([
    promise.then(result => {
      clearTimeout(timeoutId);
      return result;
    }),
    timeoutPromise
  ]);
};

// Define interfaces for our data structures
interface LiveDataElement {
  id: string;
  title: string;
  lastUpdated: string;
  contentPreview: string;
}

interface SourceDetail {
  id: string;
  name: string;
  tags: string[];
  contentPreview: string;
  liveDataElements?: LiveDataElement[];
}

// Define interface for Supabase collection source response
interface CollectionSourceItem {
  source_id: string;
  sources: {
    id: string;
    name: string;
    content: string;
    tags: string[] | null;
  };
}

// Map of internal model IDs to Claude model identifiers
const MODEL_MAPPING: Record<string, string> = {
  // Add your known model mappings here, for example:
  // "your-internal-id": "claude-3-opus-20240229",
  // Default mappings for common Claude models
  "claude-3-opus": "claude-3-opus-20240229",
  "claude-3-sonnet": "claude-3-sonnet-20240229",
  "claude-3-haiku": "claude-3-haiku-20240307",
  "claude-2": "claude-2.1",
  // Add a fallback for unknown models
  "default": "claude-3-sonnet-20240229"
};

// Changed from "export default" to "export const" for ES modules
module.exports.config = {
  api: {
    bodyParser: true,
  },
};

// Changed from "export default async function" to "export async function"
module.exports = async function handler(
  request: VercelRequest,
  response: VercelResponse
): Promise<void> {
  try {
    // Set explicit CORS headers to allow cross-origin requests and prevent middleware interference
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    response.setHeader('Content-Type', 'application/json');
    
    // Log environment info for debugging
    console.log('Vercel environment:', process.env.VERCEL_ENV);
    console.log('Node environment:', process.env.NODE_ENV);
    console.log('Available environment variables:', 
      Object.keys(process.env)
        .filter(key => !key.includes('KEY') && !key.includes('SECRET') && !key.includes('TOKEN') && !key.includes('PASSWORD'))
        .sort()
    );
    
    // Get bot parameters from the request
    const { 
      botId, 
      botName, 
      model, 
      modelName, 
      temperature, 
      systemPrompt, 
      userPrompt,
      collectionId,
      collectionName
    } = request.query;
    
    console.log('Request query parameters:', {
      botId, botName, model, modelName, collectionId, collectionName,
      hasSystemPrompt: !!systemPrompt,
      hasUserPrompt: !!userPrompt
    });
    
    if (!botId) {
      response.setHeader('Content-Type', 'application/json');
      response.status(400).json({
        error: 'Missing required parameter: botId'
      });
      return;
    }

    const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
    const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    
    if (!CLAUDE_API_KEY) {
      response.setHeader('Content-Type', 'application/json');
      response.status(500).json({
        error: 'Missing Claude API key in environment variables'
      });
      return;
    }

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      response.setHeader('Content-Type', 'application/json');
      response.status(500).json({
        error: 'Missing Supabase credentials in environment variables',
        details: {
          availableVars: Object.keys(process.env).filter(key => 
            !key.includes('KEY') && !key.includes('SECRET') && !key.includes('TOKEN')
          )
        }
      });
      return;
    }

    // Initialize Supabase client
    let supabase;
    try {
      supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      console.log('Supabase client initialized successfully');
    } catch (supabaseInitError) {
      console.error('Error initializing Supabase client:', supabaseInitError);
      response.setHeader('Content-Type', 'application/json');
      response.status(500).json({
        error: 'Failed to initialize database connection',
        details: (supabaseInitError as Error).message,
        env: {
          hasSupabaseUrl: !!SUPABASE_URL,
          hasSupabaseAnonKey: !!SUPABASE_ANON_KEY
        }
      });
      return;
    }

    // Determine the actual Claude model to use
    let claudeModel = "claude-3-sonnet-20240229"; // default model
    
    if (model) {
      // Check if this is a UUID (likely your internal ID)
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(model as string);
      
      if (!isUUID) {
        // If it's not a UUID, check if it's a known model name
        claudeModel = MODEL_MAPPING[model as string] || MODEL_MAPPING.default;
      }
    }

    // Create an enhanced system prompt that includes knowledge base info
    let enhancedSystemPrompt = systemPrompt as string || 'You are a helpful AI assistant.';
    let sourceDetails: SourceDetail[] = [];
    
    // Fetch knowledge base sources if a collection is specified
    if (collectionId) {
      try {
        console.log(`Fetching sources for collection: ${collectionId}`);
        
        // Test Supabase connection before trying to fetch data
        const { data: testData, error: testError } = await supabase
          .from('collection_sources')
          .select('count')
          .limit(1);
          
        if (testError) {
          console.error('Error testing Supabase connection:', testError);
          throw new Error(`Database connection test failed: ${testError.message}`);
        }
        
        console.log('Database connection successful, proceeding with query');
        
        // Get all sources for this collection using the collection_sources table
        console.log('Querying collection_sources table...');
        const { data: collectionSources, error: sourcesError } = await supabase
          .from('collection_sources')
          .select(`
            source_id,
            sources:source_id(id, name, content, tags)
          `)
          .eq('collection_id', collectionId) as { 
            data: CollectionSourceItem[] | null; 
            error: any 
          };

        if (sourcesError) {
          console.error('Error fetching collection sources:', sourcesError);
          throw sourcesError;
        }

        console.log(`Query result: Found ${collectionSources?.length || 0} sources`);

        if (collectionSources && collectionSources.length > 0) {
          // Transform the response to extract the sources
          sourceDetails = collectionSources.map(item => ({
            id: item.sources.id,
            name: item.sources.name,
            tags: item.sources.tags || [],
            contentPreview: item.sources.content 
              ? `${item.sources.content.substring(0, 150)}...` 
              : 'No content available'
          }));

          console.log(`Found ${sourceDetails.length} sources for collection ${collectionId}`);
          
          // Check for live data sources
          const liveDataSources = sourceDetails.filter(source => 
            source.tags && source.tags.includes('Live Data')
          );
          
          if (liveDataSources.length > 0) {
            console.log(`Collection has ${liveDataSources.length} live data sources`);
            
            // Get live data elements for these sources
            for (const source of liveDataSources) {
              // Get the source config
              const { data: sourceConfigs, error: configError } = await supabase
                .from('source_configs')
                .select('id')
                .eq('source', source.id)
                .eq('enabled', 1);
                
              if (configError) {
                console.error(`Error fetching config for source ${source.id}:`, configError);
                continue;
              }
              
              if (sourceConfigs && sourceConfigs.length > 0) {
                // Get live data elements for this config
                const { data: liveDataElements, error: elementsError } = await supabase
                  .from('live_data_elements')
                  .select('id, metadata, content, last_updated')
                  .in('source_config_id', sourceConfigs.map(config => config.id))
                  .order('last_updated', { ascending: false })
                  .limit(5); // Limit to most recent 5 elements
                  
                if (elementsError) {
                  console.error(`Error fetching live data elements:`, elementsError);
                  continue;
                }
                
                if (liveDataElements && liveDataElements.length > 0) {
                  // Add live data elements to the source details
                  source.liveDataElements = liveDataElements.map(element => ({
                    id: element.id,
                    title: element.metadata?.title || 'Untitled Element',
                    lastUpdated: element.last_updated,
                    contentPreview: element.content 
                      ? `${element.content.substring(0, 100)}...` 
                      : 'No content available'
                  }));
                }
              }
            }
          }
        }
      } catch (error) {
        console.error('Error processing knowledge base information:', error);
        // Continue with basic prompt even if KB fetching fails
      }
    }
    
    // Add knowledge base information to the system prompt
    if (collectionId && collectionName && collectionName !== 'None') {
      let kbInfo = `\n\nYou have access to a knowledge base named "${collectionName}" (ID: ${collectionId}).`;
      
      if (sourceDetails.length > 0) {
        kbInfo += `\nThe knowledge base contains ${sourceDetails.length} sources:\n`;
        
        sourceDetails.forEach((source, index) => {
          kbInfo += `${index + 1}. "${source.name}" (ID: ${source.id})`;
          
          if (source.tags && source.tags.length > 0) {
            kbInfo += ` - Tags: ${source.tags.join(', ')}`;
          }
          
          // Add info about live data elements if present
          if (source.liveDataElements && source.liveDataElements.length > 0) {
            kbInfo += `\n   This is a live data source with ${source.liveDataElements.length} recent elements, including:`;
            source.liveDataElements.forEach(element => {
              kbInfo += `\n   - "${element.title}" (last updated: ${new Date(element.lastUpdated).toLocaleString()})`;
            });
          }
          
          kbInfo += '\n';
        });
      } else {
        kbInfo += '\nThis knowledge base does not contain any sources yet.';
      }
      
      enhancedSystemPrompt += kbInfo;
    }
    
    console.log('Using Claude model:', claudeModel);
    console.log('Enhanced system prompt length:', enhancedSystemPrompt.length);

    // Make the Claude API call
    console.log('Making Claude API call with model:', claudeModel);
    let claudeResponse;
    try {
      claudeResponse = await withTimeout(
        fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': CLAUDE_API_KEY,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: claudeModel,
            max_tokens: 1000,
            temperature: parseFloat(temperature as string) || 0.7,
            system: enhancedSystemPrompt,
            messages: [
              {
                role: 'user',
                content: userPrompt || 'Hello! Can you introduce yourself?'
              }
            ]
          })
        }),
        15000, // 15 second timeout
        'Claude API request timed out'
      );
    } catch (timeoutError) {
      console.error('Claude API timeout:', timeoutError);
      response.setHeader('Content-Type', 'application/json');
      response.status(504).json({
        error: 'API Gateway Timeout',
        message: 'The Claude API request timed out',
        timeAllowed: '15 seconds'
      });
      return;
    }

    console.log('Claude API response status:', claudeResponse.status);
    console.log('Claude API response headers:', Object.fromEntries([...claudeResponse.headers.entries()]));
    
    if (!claudeResponse.ok) {
      let errorDetails: any = { status: claudeResponse.status, statusText: claudeResponse.statusText };
      
      try {
        // Try to parse error response as JSON
        errorDetails = await claudeResponse.json();
      } catch (parseError) {
        // If JSON parsing fails, get the raw text
        try {
          errorDetails.rawResponse = await claudeResponse.text();
          console.error('Non-JSON error response from Claude API:', errorDetails.rawResponse);
        } catch (textError) {
          console.error('Failed to get error text from Claude API response');
        }
      }
      
      response.setHeader('Content-Type', 'application/json');
      response.status(claudeResponse.status).json({
        error: 'Claude API error',
        details: errorDetails,
        requestedModel: model,
        mappedModel: claudeModel
      });
      return;
    }

    let data;
    try {
      data = await claudeResponse.json();
      console.log('Claude API response parsed successfully');
    } catch (parseError) {
      console.error('Error parsing Claude API response as JSON:', parseError);
      
      // Get the raw response text for debugging
      const rawResponse = await claudeResponse.text();
      console.error('Raw Claude API response:', rawResponse.substring(0, 500)); // Log first 500 chars
      
      response.setHeader('Content-Type', 'application/json');
      response.status(500).json({
        error: 'Failed to parse Claude API response',
        details: {
          message: (parseError as Error).message,
          responsePreview: rawResponse.substring(0, 200) // Include preview of the response
        }
      });
      return;
    }
    
    // Successfully processed the request
    const safeResponse = {
      success: true,
      message: 'Claude API response successful',
      botId: botId,
      botName: botName,
      prompt: userPrompt || null,
      timestamp: new Date().toISOString(),
      modelUsed: claudeModel,
      modelName: modelName || null,
      collectionId: collectionId || null,
      collectionName: collectionName !== 'None' ? collectionName : null,
      sourceCount: sourceDetails?.length || 0,
      sources: sourceDetails?.map(s => ({
        id: s.id,
        name: s.name,
        tags: s.tags || [],
        hasLiveData: !!(s.liveDataElements && s.liveDataElements.length > 0)
      })) || [],
      systemPrompt: enhancedSystemPrompt || null,
      response: data
    };
    
    console.log('Successfully generated response');
    response.setHeader('Content-Type', 'application/json');
    response.status(200).json(safeResponse);
    
  } catch (error) {
    console.error('Error in Claude API handler:', error);
    
    // Create a safe error response
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorResponse = {
      success: false,
      error: 'Internal server error',
      message: errorMessage,
      timestamp: new Date().toISOString(),
      // Include debug info that might help troubleshoot
      debug: {
        nodeEnv: process.env.NODE_ENV,
        vercelEnv: process.env.VERCEL_ENV,
        hasClaudeKey: !!process.env.CLAUDE_API_KEY,
        hasSupabaseUrl: !!(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL),
        hasSupabaseKey: !!(process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY),
        errorName: error instanceof Error ? error.name : 'Non-Error exception',
        // Include stack only in development
        stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : null) : null
      }
    };
    
    response.setHeader('Content-Type', 'application/json');
    response.status(500).json(errorResponse);
  }
}