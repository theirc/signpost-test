// api/hello.ts
import { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';

// Map of internal model IDs to Claude model identifiers
const MODEL_MAPPING: Record<string, string> = {
  "claude-3-opus": "claude-3-opus-20240229",
  "claude-3-sonnet": "claude-3-sonnet-20240229",
  "claude-3-haiku": "claude-3-haiku-20240307",
  "claude-2": "claude-2.1",
  "default": "claude-3-sonnet-20240229"
};

export default async function handler(
  request: VercelRequest,
  response: VercelResponse
): Promise<void> {
  try {
    // Log environment info for debugging
    console.log('Vercel environment:', process.env.VERCEL_ENV);
    console.log('Node environment:', process.env.NODE_ENV);
    
    // Get bot parameters from the request
    const { 
      botId, 
      botName, 
      model, 
      modelName, 
      temperature, 
      systemPrompt, 
      userPrompt,
      similarContent
    } = request.body;
    
    console.log('Request body parameters:', {
      botId, botName, model, modelName,
      hasSystemPrompt: !!systemPrompt,
      hasUserPrompt: !!userPrompt,
      hasSimilarContent: !!similarContent
    });
    
    if (!botId) {
      response.status(400).json({
        error: 'Missing required parameter: botId'
      });
      return;
    }

    const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
    
    if (!CLAUDE_API_KEY) {
      response.status(500).json({
        error: 'Missing Claude API key in environment variables'
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

    console.log('Using Claude model:', claudeModel);

    // Format similar content into context if available
    let enhancedPrompt = userPrompt || 'Hello! Can you introduce yourself?';
    if (similarContent && Array.isArray(similarContent)) {
      try {
        if (similarContent.length > 0) {
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
        }
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
        temperature: parseFloat(temperature as string) || 0.7,
        system: systemPrompt || 'You are a helpful AI assistant.',
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
        requestedModel: model,
        mappedModel: claudeModel
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
      systemPrompt: systemPrompt || null,
      response: claudeResponse.data
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
        errorName: error instanceof Error ? error.name : 'Non-Error exception',
        stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : null) : null
      }
    };
    
    response.status(500).json(errorResponse);
  }
}