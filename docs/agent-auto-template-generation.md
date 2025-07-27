# Agent Auto-Template Generation

## Overview

The Agent Auto-Template Generation feature allows users to rapidly create and configure AI agents by describing their desired function in natural language. The system automatically generates an agent template, including its core function, relevant prompts, and suggested inter-agent connections.

## Features

### 1. Natural Language Input
- Users can describe their desired agent in plain English
- Examples:
  - "Create an agent that summarizes long research papers and extracts key findings"
  - "Create an agent that analyzes customer feedback and categorizes sentiment"
  - "Create an agent that translates text between multiple languages"

### 2. Intelligent Template Generation
- Uses LLM (Gemini 2.0 Flash, GPT-4, or Claude) to interpret descriptions
- Generates appropriate worker configurations
- Suggests relevant prompts and instructions
- Proposes logical connections between workers

### 3. Editable Template Review
- Users can review and customize all generated components
- Edit agent name, description, and prompts
- Modify worker configurations
- Adjust suggested connections

### 4. One-Click Agent Creation
- Save the generated template as a new agent
- Automatically navigates to the new agent for further customization
- Integrates with existing agent management system

## How to Use

### Step 1: Access the Feature
1. Navigate to the Agents page
2. Click "Create Agent" dropdown
3. Select "Auto-Generate"

### Step 2: Describe Your Agent
1. Enter a detailed description of what you want your agent to do
2. Be specific about inputs, outputs, and functionality
3. Use the example descriptions for inspiration

### Step 3: Generate Template
1. Click "Generate Template"
2. Wait for the LLM to process your description
3. Review the generated template

### Step 4: Customize and Save
1. Edit any part of the generated template
2. Review suggested workers and connections
3. Click "Create Agent" to save

## Technical Implementation

### Core Components

#### AgentTemplateGenerator Service
- Located at `src/lib/services/agent-template-generator.ts`
- Handles LLM integration for template generation
- Validates and enhances generated templates
- Provides fallback templates if generation fails

#### UI Components
- Enhanced agents list page with auto-generation interface
- Template review dialog with editing capabilities
- Loading states and error handling

### LLM Integration
- Supports multiple LLM providers (OpenAI, Anthropic, Google)
- Uses structured prompts for consistent generation
- Handles API errors gracefully with fallback templates

### Template Structure
```typescript
interface GeneratedAgentTemplate {
  agentName: string
  agentDescription: string
  suggestedPrompts: string[]
  recommendedWorkers: WorkerConfig[]
  suggestedConnections: ConnectionSuggestion[]
}
```

## Error Handling

### Generation Failures
- Graceful fallback to basic templates
- Clear error messages to users
- Retry functionality

### Validation
- Ensures worker types exist in registry
- Validates template structure
- Provides sensible defaults

## Future Enhancements

### Planned Features
1. **Template Library**: Save and reuse generated templates
2. **Advanced Orchestration**: More sophisticated connection suggestions
3. **Custom Prompts**: User-defined generation prompts
4. **Batch Generation**: Generate multiple related agents
5. **Template Sharing**: Share templates across teams

### Technical Improvements
1. **Caching**: Cache generated templates for similar descriptions
2. **Optimization**: Faster generation with model optimization
3. **Analytics**: Track usage patterns and success rates
4. **A/B Testing**: Test different generation strategies

## Configuration

### API Keys
The feature requires API keys for LLM providers:
- OpenAI API key for GPT models
- Anthropic API key for Claude models
- Google API key for Gemini models

### Model Selection
The system automatically selects the best available model:
1. Gemini 2.0 Flash (preferred for speed)
2. GPT-4.1 (preferred for quality)
3. Claude 3 Sonnet (fallback)

## Troubleshooting

### Common Issues

#### "No suitable model available"
- Ensure API keys are configured
- Check API key permissions
- Verify network connectivity

#### "Generation failed"
- Try rephrasing your description
- Check API rate limits
- Ensure sufficient API credits

#### "Invalid worker type"
- The system will automatically use safe defaults
- Check worker registry for available types

## Support

For issues or questions about the Agent Auto-Template Generation feature:
1. Check the troubleshooting section above
2. Review the technical documentation
3. Contact the development team 