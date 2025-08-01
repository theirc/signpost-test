# Deployed Agent Playground

This document describes the new full-page playground interface for deployed agents.

## Overview

The deployed agent playground provides a full-page, modern chat interface that connects directly to the individual agent attached to a deployment. Unlike the main playground, this interface:

- Is full-page (no sidebar, navigation, or other UI elements)
- Only allows interaction with the specific agent attached to the deployment
- Provides a clean, modern chat interface
- Supports both conversational and non-conversational agents

## How It Works

### 1. Deployment Process

When an agent is deployed via the flow interface:

1. The deployment configuration is stored in localStorage with the agent ID
2. A deployment URL is generated (e.g., `/webpage/my-agent`)
3. The deployment info includes the agent configuration and metadata

### 2. Playground Interface

When users visit a deployed agent URL:

1. The system loads the deployment configuration from localStorage
2. The agent is loaded using the stored agent ID
3. A full-page chat interface is rendered with the agent's branding
4. Users can interact directly with the deployed agent

### 3. Agent Execution

The playground supports both types of agents:

- **Conversational Agents**: Use chat history and maintain context
- **Non-conversational Agents**: Use question-based input with conversation history

## Key Features

### Full-Page Design
- No navigation or sidebar distractions
- Clean, focused chat interface
- Responsive design for all screen sizes

### Agent Branding
- Custom title and description from deployment config
- Custom colors and logo support
- Branded header with agent information

### Modern Chat Interface
- Real-time message display
- Loading states and animations
- Auto-scroll to latest messages
- Support for both text and JSON input

### Error Handling
- Graceful error handling for agent execution
- User-friendly error messages
- Fallback states for missing configurations

## File Structure

```
src/pages/webpage/
├── [slug].tsx          # Main playground component
└── test.tsx            # Test deployment setup
```

## Usage

### For Developers

1. **Create a deployment** via the flow interface
2. **Visit the deployment URL** (e.g., `/webpage/test`)
3. **Test the playground** with the deployed agent

### For End Users

1. **Visit the deployed agent URL**
2. **Start chatting** with the agent
3. **Use the "New Chat" button** to reset the conversation

## Configuration

The deployment configuration includes:

```typescript
interface DeploymentConfig {
  agentId: string
  agentTitle: string
  agentDescription?: string
  title: string
  description: string
  primaryColor: string
  secondaryColor: string
  logoUrl?: string
  theme: 'light' | 'dark' | 'auto'
}
```

## Testing

To test the playground:

1. Visit `/webpage/test` to create a test deployment
2. Click "View Playground" to see the interface
3. Try sending messages to test the agent interaction

## Future Enhancements

- [ ] Add support for custom domains
- [ ] Implement analytics tracking
- [ ] Add theme switching
- [ ] Support for file uploads
- [ ] Add conversation history persistence
- [ ] Implement rate limiting and security measures 