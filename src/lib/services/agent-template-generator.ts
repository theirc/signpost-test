import { createModel } from "@/lib/agents/utils"
import { generateText } from 'ai'
import { workerRegistry } from "@/lib/agents/registry"

export interface GeneratedAgentTemplate {
  agentName: string
  agentDescription: string
  suggestedPrompts: string[]
  recommendedWorkers: WorkerConfig[]
  suggestedConnections: ConnectionSuggestion[]
}

export interface WorkerConfig {
  type: string
  title: string
  description: string
  config: any
  position?: { x: number; y: number }
}

export interface ConnectionSuggestion {
  from: string
  to: string
  fromHandle: string
  toHandle: string
  description: string
}

export class AgentTemplateGenerator {
  private apiKeys: APIKeys

  constructor(apiKeys: APIKeys) {
    this.apiKeys = apiKeys
  }

  async generateTemplate(description: string): Promise<GeneratedAgentTemplate> {
    const model = this.getModel()
    if (!model) {
      // If no model available, use specialized template
      return this.createSpecializedTemplate(description)
    }

    const prompt = this.buildGenerationPrompt(description)
    
    try {
      const { text } = await generateText({
        model,
        temperature: 0.7,
        messages: [
          { role: "system", content: "You are an expert AI agent template generator. Generate structured, practical agent configurations with proper prompts and configurations." },
          { role: "user", content: prompt }
        ],
      })

      return this.parseGeneratedResponse(text, description)
    } catch (error) {
      console.error("Error generating template:", error)
      // Fallback to specialized template
      return this.createSpecializedTemplate(description)
    }
  }

  private getModel() {
    // Try to get a suitable model from available API keys
    const availableModels = [
      { provider: "openai", model: "openai/gpt-4.1" },
      { provider: "anthropic", model: "anthropic/claude-3-sonnet" },
      { provider: "google", model: "google/gemini-2.0-flash" },
    ]

    for (const { provider, model } of availableModels) {
      if (this.apiKeys[provider]) {
        return createModel(this.apiKeys, model)
      }
    }

    return null
  }

  private buildGenerationPrompt(description: string): string {
    const availableWorkers = Object.keys(workerRegistry)
      .map(key => `${key}: ${workerRegistry[key].description}`)
      .join('\n')

    return `
Generate an AI agent template based on this description: "${description}"

Available worker types:
${availableWorkers}

Please provide a JSON response with the following structure:
{
  "agentName": "Descriptive name for the agent",
  "agentDescription": "Detailed description of what this agent does",
  "suggestedPrompts": [
    "First suggested prompt for the agent",
    "Second suggested prompt for the agent"
  ],
  "recommendedWorkers": [
    {
      "type": "worker_type",
      "title": "Worker title (use descriptive names like 'Input Handler', 'Main Agent', 'Output Formatter')",
      "description": "What this worker does",
      "config": {
        "model": "openai/gpt-4.1",
        "instructions": "Specific instructions for this worker",
        "temperature": 0.7,
        "prompt": "The actual prompt text for this worker"
      },
      "position": { "x": 100, "y": 100 }
    }
  ],
  "suggestedConnections": [
    {
      "from": "Worker title from recommendedWorkers",
      "to": "Worker title from recommendedWorkers", 
      "fromHandle": "output",
      "toHandle": "input",
      "description": "Why these should be connected"
    }
  ]
}

Important guidelines:
1. Use descriptive worker titles that clearly indicate their function
2. Create logical connections between workers (e.g., Input → Main Agent → Output)
3. Focus on creating practical, functional agents
4. Use appropriate worker types for the described functionality
5. Ensure connections make sense (output of one worker goes to input of another)
6. For AI workers, include specific prompts and instructions
7. For API workers, include endpoint URLs and methods
8. For Search workers, include search queries and parameters
9. Always include at least one Input and one Response worker
10. Make sure all workers have proper configuration for immediate testing
`
  }

  private parseGeneratedResponse(response: string, originalDescription: string): GeneratedAgentTemplate {
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        return this.validateAndEnhanceTemplate(parsed, originalDescription)
      }
    } catch (error) {
      console.error("Error parsing generated response:", error)
    }

    // Fallback if parsing fails
    return this.createFallbackTemplate(originalDescription)
  }

  private validateAndEnhanceTemplate(parsed: any, originalDescription: string): GeneratedAgentTemplate {
    // Ensure all required fields exist
    const template: GeneratedAgentTemplate = {
      agentName: parsed.agentName || `Auto-Generated Agent`,
      agentDescription: parsed.agentDescription || `An agent designed to: ${originalDescription}`,
      suggestedPrompts: Array.isArray(parsed.suggestedPrompts) ? parsed.suggestedPrompts : [
        `Process the following input according to the specified requirements: {input}`,
        `Analyze and respond to: {input}`
      ],
      recommendedWorkers: Array.isArray(parsed.recommendedWorkers) ? parsed.recommendedWorkers : [],
      suggestedConnections: Array.isArray(parsed.suggestedConnections) ? parsed.suggestedConnections : []
    }

    // Validate and enhance workers
    if (template.recommendedWorkers.length === 0) {
      template.recommendedWorkers = this.createDefaultWorkers(originalDescription)
    }

    // Validate worker types and enhance with positions
    template.recommendedWorkers = template.recommendedWorkers.map((worker, index) => ({
      ...worker,
      type: this.validateWorkerType(worker.type),
      title: worker.title || `Worker ${index + 1}`,
      description: worker.description || `Worker for ${originalDescription}`,
      config: worker.config || {},
      position: worker.position || { x: 100 + (index * 200), y: 100 }
    }))

    // Validate and enhance connections
    if (template.suggestedConnections.length === 0 && template.recommendedWorkers.length > 1) {
      // Create default connections if none provided
      template.suggestedConnections = this.createDefaultConnections(template.recommendedWorkers)
    }

    // Validate that connection references exist
    template.suggestedConnections = template.suggestedConnections.filter(connection => {
      const fromExists = template.recommendedWorkers.some(w => w.title === connection.from)
      const toExists = template.recommendedWorkers.some(w => w.title === connection.to)
      return fromExists && toExists
    })

    return template
  }

  private validateWorkerType(type: string): string {
    // Ensure the worker type exists in the registry
    if (workerRegistry[type]) {
      return type
    }
    
    // Return a safe default
    return "promptAgent"
  }

  private createDefaultWorkers(description: string): WorkerConfig[] {
    return [
      {
        type: "request",
        title: "Input Handler",
        description: `Receives and processes input for: ${description}`,
        config: {
          // Request workers typically don't need much config
        },
        position: { x: 100, y: 100 }
      },
      {
        type: "ai",
        title: "Main AI Processor",
        description: `Primary AI agent for: ${description}`,
        config: {
          model: "openai/gpt-4.1",
          temperature: 0.7,
          prompt: `You are an AI assistant designed to: ${description}

Your task is to process the input and provide a helpful, accurate response.

Input: {input}

Please analyze the input and respond appropriately based on the requirements: ${description}`,
          instructions: `Process the input according to the specified requirements and provide a clear, helpful response.`
        },
        position: { x: 300, y: 100 }
      },
      {
        type: "response",
        title: "Output Formatter",
        description: `Formats and returns the final response`,
        config: {
          // Response workers typically don't need much config
        },
        position: { x: 500, y: 100 }
      }
    ]
  }

  private createDefaultConnections(workers: WorkerConfig[]): ConnectionSuggestion[] {
    const connections: ConnectionSuggestion[] = []
    
    // Create a simple chain if we have multiple workers
    for (let i = 0; i < workers.length - 1; i++) {
      connections.push({
        from: workers[i].title,
        to: workers[i + 1].title,
        fromHandle: "output",
        toHandle: "input",
        description: `Data flows from ${workers[i].title} to ${workers[i + 1].title}`
      })
    }
    
    return connections
  }

  private createFallbackTemplate(description: string): GeneratedAgentTemplate {
    const defaultWorkers = this.createDefaultWorkers(description)
    
    return {
      agentName: `Auto-Generated Agent`,
      agentDescription: `An agent designed to: ${description}`,
      suggestedPrompts: [
        `Process the following input according to the specified requirements: {input}`,
        `Analyze and respond to: {input}`,
        `Based on the input provided, please: ${description}`
      ],
      recommendedWorkers: defaultWorkers,
      suggestedConnections: [
        {
          from: "Input Handler",
          to: "Main AI Processor",
          fromHandle: "output",
          toHandle: "input",
          description: "Input flows from the input handler to the main AI processor for analysis"
        },
        {
          from: "Main AI Processor",
          to: "Output Formatter",
          fromHandle: "answer",
          toHandle: "input",
          description: "Processed results flow from the main AI processor to the output formatter"
        }
      ]
    }
  }

  private createSpecializedTemplate(description: string): GeneratedAgentTemplate {
    const lowerDescription = description.toLowerCase()
    
    // Sentiment Analysis Agent
    if (lowerDescription.includes('sentiment') || lowerDescription.includes('emotion') || lowerDescription.includes('feedback')) {
      return {
        agentName: "Sentiment Analysis Agent",
        agentDescription: `Analyzes sentiment and emotions in text: ${description}`,
        suggestedPrompts: [
          "Analyze the sentiment of the following text and classify it as positive, negative, or neutral: {input}",
          "Determine the emotional tone of this text: {input}",
          "Extract sentiment scores and key emotional indicators from: {input}"
        ],
        recommendedWorkers: [
          {
            type: "request",
            title: "Text Input",
            description: "Receives text input for sentiment analysis",
            config: {},
            position: { x: 100, y: 100 }
          },
          {
            type: "ai",
            title: "Sentiment Analyzer",
            description: "Analyzes sentiment and emotions in text",
            config: {
              model: "openai/gpt-4.1",
              temperature: 0.3,
              prompt: `You are a sentiment analysis expert. Analyze the sentiment of the provided text.

Text: {input}

Please provide:
1. Overall sentiment (positive/negative/neutral)
2. Confidence score (0-100%)
3. Key emotional indicators
4. Brief explanation of your analysis

Format your response as JSON:
{
  "sentiment": "positive/negative/neutral",
  "confidence": 85,
  "emotional_indicators": ["joy", "satisfaction"],
  "explanation": "Brief explanation of the analysis"
}`,
              instructions: "Analyze sentiment accurately and provide structured output"
            },
            position: { x: 300, y: 100 }
          },
          {
            type: "response",
            title: "Sentiment Results",
            description: "Returns the sentiment analysis results",
            config: {},
            position: { x: 500, y: 100 }
          }
        ],
        suggestedConnections: [
          {
            from: "Text Input",
            to: "Sentiment Analyzer",
            fromHandle: "output",
            toHandle: "input",
            description: "Text flows to sentiment analyzer"
          },
          {
            from: "Sentiment Analyzer",
            to: "Sentiment Results",
            fromHandle: "answer",
            toHandle: "input",
            description: "Analysis results flow to output"
          }
        ]
      }
    }
    
    // Research Paper Summarizer
    if (lowerDescription.includes('research') || lowerDescription.includes('paper') || lowerDescription.includes('summarize')) {
      return {
        agentName: "Research Paper Summarizer",
        agentDescription: `Summarizes research papers and extracts key findings: ${description}`,
        suggestedPrompts: [
          "Summarize the following research paper and extract key findings: {input}",
          "Analyze this research paper and provide a structured summary: {input}",
          "Extract the main points, methodology, and conclusions from: {input}"
        ],
        recommendedWorkers: [
          {
            type: "request",
            title: "Paper Input",
            description: "Receives research paper text",
            config: {},
            position: { x: 100, y: 100 }
          },
          {
            type: "ai",
            title: "Research Analyzer",
            description: "Analyzes and summarizes research papers",
            config: {
              model: "openai/gpt-4.1",
              temperature: 0.4,
              prompt: `You are a research paper analysis expert. Summarize the provided research paper.

Research Paper: {input}

Please provide a structured summary including:
1. **Title and Authors** (if available)
2. **Abstract/Summary** (2-3 sentences)
3. **Key Findings** (bullet points)
4. **Methodology** (brief description)
5. **Conclusions** (main takeaways)
6. **Relevance** (why this research matters)

Format your response clearly with headers and bullet points.`,
              instructions: "Provide comprehensive yet concise research paper summaries"
            },
            position: { x: 300, y: 100 }
          },
          {
            type: "response",
            title: "Summary Output",
            description: "Returns the research paper summary",
            config: {},
            position: { x: 500, y: 100 }
          }
        ],
        suggestedConnections: [
          {
            from: "Paper Input",
            to: "Research Analyzer",
            fromHandle: "output",
            toHandle: "input",
            description: "Research paper flows to analyzer"
          },
          {
            from: "Research Analyzer",
            to: "Summary Output",
            fromHandle: "answer",
            toHandle: "input",
            description: "Summary flows to output"
          }
        ]
      }
    }
    
    // Content Generator
    if (lowerDescription.includes('content') || lowerDescription.includes('generate') || lowerDescription.includes('creative')) {
      return {
        agentName: "Content Generator",
        agentDescription: `Generates creative content based on requirements: ${description}`,
        suggestedPrompts: [
          "Generate creative content based on these requirements: {input}",
          "Create engaging content following these guidelines: {input}",
          "Produce content that matches this description: {input}"
        ],
        recommendedWorkers: [
          {
            type: "request",
            title: "Content Requirements",
            description: "Receives content generation requirements",
            config: {},
            position: { x: 100, y: 100 }
          },
          {
            type: "ai",
            title: "Content Creator",
            description: "Generates creative content based on requirements",
            config: {
              model: "openai/gpt-4.1",
              temperature: 0.8,
              prompt: `You are a creative content generator. Create engaging content based on the provided requirements.

Requirements: {input}

Please generate content that:
- Matches the specified tone and style
- Is engaging and well-structured
- Meets the length and format requirements
- Includes relevant details and examples

Make the content compelling and professional.`,
              instructions: "Generate creative, engaging content that meets the specified requirements"
            },
            position: { x: 300, y: 100 }
          },
          {
            type: "response",
            title: "Generated Content",
            description: "Returns the generated content",
            config: {},
            position: { x: 500, y: 100 }
          }
        ],
        suggestedConnections: [
          {
            from: "Content Requirements",
            to: "Content Creator",
            fromHandle: "output",
            toHandle: "input",
            description: "Requirements flow to content creator"
          },
          {
            from: "Content Creator",
            to: "Generated Content",
            fromHandle: "answer",
            toHandle: "input",
            description: "Generated content flows to output"
          }
        ]
      }
    }
    
    // API Integration Agent
    if (lowerDescription.includes('api') || lowerDescription.includes('integration') || lowerDescription.includes('external')) {
      return {
        agentName: "API Integration Agent",
        agentDescription: `Integrates with external APIs and processes data: ${description}`,
        suggestedPrompts: [
          "Process the API response and extract relevant information: {input}",
          "Format the data for the API request: {input}",
          "Handle the API response and provide insights: {input}"
        ],
        recommendedWorkers: [
          {
            type: "request",
            title: "Data Input",
            description: "Receives data for API processing",
            config: {},
            position: { x: 100, y: 100 }
          },
          {
            type: "api",
            title: "External API",
            description: "Makes API calls to external services",
            config: {
              endpoint: "https://api.example.com/data",
              method: "GET",
              authType: "none",
              timeout: 10000,
              params: "{}",
              headers: "{}"
            },
            position: { x: 300, y: 100 }
          },
          {
            type: "ai",
            title: "Response Processor",
            description: "Processes and analyzes API responses",
            config: {
              model: "openai/gpt-4.1",
              temperature: 0.3,
              prompt: `You are an API response processor. Analyze the API response and extract relevant information.

API Response: {input}

Please:
1. Extract key data points
2. Identify any errors or issues
3. Format the response for easy consumption
4. Provide insights or recommendations if applicable

Format your response clearly and concisely.`,
              instructions: "Process API responses efficiently and provide clear insights"
            },
            position: { x: 500, y: 100 }
          },
          {
            type: "response",
            title: "Processed Results",
            description: "Returns the processed API results",
            config: {},
            position: { x: 700, y: 100 }
          }
        ],
        suggestedConnections: [
          {
            from: "Data Input",
            to: "External API",
            fromHandle: "output",
            toHandle: "body",
            description: "Data flows to API call"
          },
          {
            from: "External API",
            to: "Response Processor",
            fromHandle: "response",
            toHandle: "input",
            description: "API response flows to processor"
          },
          {
            from: "Response Processor",
            to: "Processed Results",
            fromHandle: "answer",
            toHandle: "input",
            description: "Processed results flow to output"
          }
        ]
      }
    }
    
    // Search and Analysis Agent
    if (lowerDescription.includes('search') || lowerDescription.includes('find') || lowerDescription.includes('query')) {
      return {
        agentName: "Search and Analysis Agent",
        agentDescription: `Searches for information and analyzes results: ${description}`,
        suggestedPrompts: [
          "Search for relevant information about: {input}",
          "Find and analyze data related to: {input}",
          "Query the knowledge base for: {input}"
        ],
        recommendedWorkers: [
          {
            type: "request",
            title: "Search Query",
            description: "Receives search queries",
            config: {},
            position: { x: 100, y: 100 }
          },
          {
            type: "search",
            title: "Knowledge Search",
            description: "Searches knowledge base for relevant information",
            config: {
              engine: "weaviate",
              maxResults: 5,
              query: "{input}"
            },
            position: { x: 300, y: 100 }
          },
          {
            type: "ai",
            title: "Search Analyzer",
            description: "Analyzes and summarizes search results",
            config: {
              model: "openai/gpt-4.1",
              temperature: 0.4,
              prompt: `You are a search results analyzer. Analyze the search results and provide insights.

Search Query: {input}
Search Results: {documents}

Please:
1. Summarize the key findings
2. Identify the most relevant information
3. Provide insights and recommendations
4. Highlight any patterns or trends

Format your response clearly with sections and bullet points.`,
              instructions: "Analyze search results effectively and provide actionable insights"
            },
            position: { x: 500, y: 100 }
          },
          {
            type: "response",
            title: "Analysis Results",
            description: "Returns the search analysis results",
            config: {},
            position: { x: 700, y: 100 }
          }
        ],
        suggestedConnections: [
          {
            from: "Search Query",
            to: "Knowledge Search",
            fromHandle: "output",
            toHandle: "input",
            description: "Query flows to search engine"
          },
          {
            from: "Knowledge Search",
            to: "Search Analyzer",
            fromHandle: "documents",
            toHandle: "documents",
            description: "Search results flow to analyzer"
          },
          {
            from: "Search Analyzer",
            to: "Analysis Results",
            fromHandle: "answer",
            toHandle: "input",
            description: "Analysis results flow to output"
          }
        ]
      }
    }
    
    // Default template for other cases
    return this.createFallbackTemplate(description)
  }
} 