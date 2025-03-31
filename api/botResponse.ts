// api/botResponse.ts

// Takes as an input the content from similarity search if present ... selects the model and calls the AI API. NOTE: It only uses Claude models and the mappings aren't quite right. I'm waiting to see if we want to use a model gateway like the one in Databricks before finalizing this mapping and setting up the API routes for OpenAI and others.
import { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';
import { createClient } from '@supabase/supabase-js';

// Map of internal model IDs to Claude model identifiers
const MODEL_MAPPING: Record<string, string> = {
  "claude-3-opus": "claude-3-opus-20240229",
  "claude-3-sonnet": "claude-3-sonnet-20240229",
  "claude-3-haiku": "claude-3-haiku-20240307",
  "claude-2": "claude-2.1",
  "default":  "claude-3-5-sonnet-latest"
};

// Setup Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

// Function to generate embedding using OpenAI API
async function generateEmbedding(text: string) {
  try {
    console.log('[botResponse] Starting OpenAI embedding generation...');
    
    // OpenAI recommends replacing newlines with spaces for best results
    const input = text.replace(/\n/g, ' ');
    
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'text-embedding-ada-002',
        input
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`);
    }
    
    const data = await response.json();
    const embedding = data.data[0].embedding;
    
    console.log('[botResponse] OpenAI embedding generated successfully');
    
    // Verify the embedding is the correct size (1536 for text-embedding-ada-002)
    if (embedding.length !== 1536) {
      throw new Error(`Expected embedding dimension of 1536, but got ${embedding.length}`);
    }
    
    return embedding;
  } catch (error) {
    console.error('[botResponse] Error generating OpenAI embedding:', error);
    throw error;
  }
}

// Function to perform similarity search
async function searchSimilarContent(supabase: any, text: string) {
  try {
    console.log('[botResponse] Starting similarity search for:', text);
    
    // Generate embedding for the search query
    const queryVector = await generateEmbedding(text);
    
    // Call the Supabase RPC function for similarity search
    const { data, error } = await supabase.rpc('similarity_search', {
      query_vector: queryVector
    });

    if (error) {
      console.error('[botResponse] Database error:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('[botResponse] Error in searchSimilarContent:', error);
    throw error;
  }
}

export default async function handler(
  request: VercelRequest,
  response: VercelResponse
): Promise<void> {
  try {
    // Log environment info for debugging
    console.log('Vercel environment:', process.env.VERCEL_ENV);
    console.log('Node environment:', process.env.NODE_ENV);
    
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase configuration');
    }
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Get minimal parameters from the request
    const { botId, userPrompt } = request.body;
    
    console.log('Request body parameters:', {
      botId,
      hasUserPrompt: !!userPrompt
    });
    
    if (!botId) {
      response.status(400).json({
        error: 'Missing required parameter: botId'
      });
      return;
    }

    // Fetch bot information from database
    const { data: bot, error: botError } = await supabase
      .from('bots')
      .select('*, models:model(*)')
      .eq('id', botId)
      .single();
      
    if (botError || !bot) {
      response.status(404).json({
        error: 'Bot not found',
        details: botError
      });
      return;
    }
    
    console.log('Bot fetched from database:', bot);
    
    // Fetch the system prompt if bot has a system_prompt_id
    let systemPromptContent = bot.system_prompt || 'You are a helpful AI assistant.';
    
    if (bot.system_prompt_id) {
      const { data: systemPrompt, error: systemPromptError } = await supabase
        .from('system_prompts')
        .select('content')
        .eq('id', bot.system_prompt_id)
        .single();
        
      if (!systemPromptError && systemPrompt) {
        systemPromptContent = systemPrompt.content;
      } else {
        console.warn(`System prompt not found for ID: ${bot.system_prompt_id}`, systemPromptError);
      }
    }
    
    // Check if bot has a collection (knowledge base)
    let similarContent = [];
    if (bot.collection) {
      try {
        console.log(`Bot has collection: ${bot.collection}, performing similarity search`);
        // Perform similarity search
        similarContent = await searchSimilarContent(supabase, userPrompt || '');
        
        // Log detailed similarity information
        console.log('[botResponse] Similar content found:');
        similarContent.forEach((result: any, index: number) => {
          console.log(`\nResult ${index + 1}:
            Source: ${result.source_type}
            Name: ${result.name}
            Similarity: ${(result.similarity * 100).toFixed(2)}%
            Content Preview: ${result.content.substring(0, 100)}...`
          );
        });
      } catch (searchError) {
        console.error('Error performing similarity search:', searchError);
        // Continue without similar content rather than failing
        similarContent = [];
      }
    }

    const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
    
    if (!CLAUDE_API_KEY) {
      response.status(500).json({
        error: 'Missing Claude API key in environment variables'
      });
      return;
    }

    // Determine the actual Claude model to use
    const modelId = bot.model;
    let claudeModel = "claude-3-sonnet-20240229"; // default model
    
    if (modelId) {
      // Check if this is a UUID (likely your internal ID)
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(modelId);
      
      if (!isUUID) {
        // If it's not a UUID, check if it's a known model name
        claudeModel = MODEL_MAPPING[modelId] || MODEL_MAPPING.default;
      }
    }

    console.log('Using Claude model:', claudeModel);

    // Format similar content into context if available
    let enhancedPrompt = userPrompt || 'Hello! Can you introduce yourself?';
    if (similarContent && similarContent.length > 0) {
      try {
        const contextString = `
Here is some relevant information that might help with your response:

${similarContent.map((item: any) => `
[Source: ${item.source_type} - ${item.name}]
[Similarity: ${(item.similarity * 100).toFixed(1)}%]
${item.content}
---`).join('\n')}

Based on this context, please respond to the following:
${enhancedPrompt}`;
        
        enhancedPrompt = contextString;
        console.log('Enhanced prompt with context:', contextString);
      } catch (e) {
        console.error('Error processing similar content:', e);
        // Continue with original prompt if processing fails
      }
    }

    // Make the Claude API call with enhanced prompt
    const claudeResponse = await axios({
      method: 'POST',
      url: 'https://api.anthropic.com/v1/messages',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      data: {
        model: claudeModel,
        max_tokens: 1000,
        temperature: parseFloat(bot.temperature?.toString() || '0.7'),
        system: systemPromptContent,
        messages: [
          {
            role: 'user',
            content: enhancedPrompt
          }
        ]
      }
    });

    console.log('Claude API response status:', claudeResponse.status);
    
    if (claudeResponse.status !== 200) {
      let errorDetails = { 
        status: claudeResponse.status, 
        statusText: claudeResponse.statusText,
        data: claudeResponse.data
      };
      
      response.status(claudeResponse.status).json({
        error: 'Claude API error',
        details: errorDetails,
        requestedModel: bot.model,
        mappedModel: claudeModel
      });
      return;
    }

    // Get model name
    const modelName = bot.models?.name || bot.model;

    // Successfully processed the request
    const safeResponse = {
      success: true,
      message: 'Claude API response successful',
      botId: botId,
      botName: bot.name,
      prompt: userPrompt || null,
      timestamp: new Date().toISOString(),
      modelUsed: claudeModel,
      modelName: modelName,
      systemPrompt: systemPromptContent,
      response: claudeResponse.data,
      similarContent: similarContent
    };
    
    console.log('Successfully generated response');
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
      debug: {
        nodeEnv: process.env.NODE_ENV,
        vercelEnv: process.env.VERCEL_ENV,
        hasClaudeKey: !!process.env.CLAUDE_API_KEY,
        hasOpenaiKey: !!process.env.OPENAI_API_KEY,
        hasSupabase: !!process.env.SUPABASE_URL && !!process.env.SUPABASE_ANON_KEY,
        errorName: error instanceof Error ? error.name : 'Non-Error exception',
        stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : null) : null
      }
    };
    
    response.status(500).json(errorResponse);
  }
}
