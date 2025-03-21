// api/hello.ts
import { VercelRequest, VercelResponse } from '@vercel/node';
import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';

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

export default async function handler(
  request: VercelRequest,
  response: VercelResponse
): Promise<void> {
  try {
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
    
    if (!botId) {
      response.status(400).json({
        error: 'Missing required parameter: botId'
      });
      return;
    }

    const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
    const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    
    if (!CLAUDE_API_KEY) {
      response.status(500).json({
        error: 'Missing Claude API key in environment variables'
      });
      return;
    }

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
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
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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
    let sourceDetails = [];
    
    // Fetch knowledge base sources if a collection is specified
    if (collectionId) {
      try {
        console.log(`Fetching sources for collection: ${collectionId}`);
        
        // Get all sources for this collection using the collection_sources table
        const { data: collectionSources, error: sourcesError } = await supabase
          .from('collection_sources')
          .select(`
            source_id,
            sources:source_id(id, name, content, tags)
          `)
          .eq('collection_id', collectionId);

        if (sourcesError) {
          console.error('Error fetching collection sources:', sourcesError);
          throw sourcesError;
        }

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
    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
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
    });

    if (!claudeResponse.ok) {
      const errorData = await claudeResponse.json();
      response.status(claudeResponse.status).json({
        error: 'Claude API error',
        details: errorData,
        requestedModel: model,
        mappedModel: claudeModel
      });
      return;
    }

    const data = await claudeResponse.json();
    
    // Successfully processed the request
    response.status(200).json({
      success: true,
      message: 'Claude API response successful',
      botId: botId,
      botName: botName,
      prompt: userPrompt,
      timestamp: new Date().toISOString(),
      modelUsed: claudeModel,
      modelName: modelName,
      collectionId: collectionId || null,
      collectionName: collectionName !== 'None' ? collectionName : null,
      sourceCount: sourceDetails.length,
      sources: sourceDetails.map(s => ({
        id: s.id,
        name: s.name,
        tags: s.tags,
        hasLiveData: !!(s.liveDataElements && s.liveDataElements.length > 0)
      })),
      systemPrompt: enhancedSystemPrompt,
      response: data
    });
    
  } catch (error) {
    console.error('Error in Claude API handler:', error);
    response.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}