#!/usr/bin/env python3
"""
AI-Powered Documentation Generator for Signpost AI

This script automatically generates and updates documentation using AI models.
It analyzes code changes and generates comprehensive documentation updates.
"""

import os
import json
import requests
import subprocess
from pathlib import Path
from typing import Dict, List, Optional
import openai
import anthropic
from datetime import datetime

class DocumentationGenerator:
    def __init__(self):
        # Load environment variables from .env.local files
        try:
            from load_env import load_environment
            load_environment()
        except ImportError:
            print("⚠️  Environment loader not found, using system environment only")
        
        # Try multiple possible OpenAI API key environment variables
        openai_key = (os.getenv('OPENAI_API_KEY') or 
                     os.getenv('VITE_OPENAI_API_KEY') or 
                     os.getenv('REACT_APP_OPENAI_API_KEY'))
        
        if openai_key:
            self.openai_client = openai.OpenAI(api_key=openai_key)
        else:
            self.openai_client = None
            print("⚠️  No OpenAI API key found. Set OPENAI_API_KEY, VITE_OPENAI_API_KEY, or REACT_APP_OPENAI_API_KEY")
        
        anthropic_key = os.getenv('ANTHROPIC_API_KEY')
        if anthropic_key:
            self.anthropic_client = anthropic.Anthropic(api_key=anthropic_key)
        else:
            self.anthropic_client = None
        self.project_root = Path(__file__).parent.parent
        self.docs_dir = self.project_root / 'docs'
        
    def analyze_code_changes(self) -> Dict[str, List[str]]:
        """Analyze recent code changes to determine what documentation needs updating."""
        try:
            # Get recent commits
            result = subprocess.run(
                ['git', 'log', '--oneline', '-10'],
                capture_output=True, text=True, cwd=self.project_root
            )
            
            changes = {
                'workers': [],
                'components': [],
                'api': [],
                'integrations': []
            }
            
            # Analyze commit messages for patterns
            for line in result.stdout.split('\n'):
                if 'worker' in line.lower():
                    changes['workers'].append(line)
                elif 'component' in line.lower():
                    changes['components'].append(line)
                elif 'api' in line.lower():
                    changes['api'].append(line)
                elif 'integration' in line.lower():
                    changes['integrations'].append(line)
                    
            return changes
            
        except Exception as e:
            print(f"Error analyzing code changes: {e}")
            return {}
    
    def generate_worker_documentation(self, worker_name: str, worker_code: str) -> str:
        """Generate documentation for a specific worker using AI."""
        
        prompt = f"""
        You are a technical documentation expert. Generate comprehensive documentation for the Signpost AI worker: {worker_name}
        
        Worker Code:
        {worker_code[:2000]}...
        
        CRITICAL: You MUST start your response with EXACTLY this frontmatter format:
        ---
        title: {worker_name.title()} Worker
        description: [Brief one-line description of what this worker does]
        ---
        
        # {worker_name.title()} Worker
        
        Then include these sections:
        1. Overview and purpose
        2. Configuration parameters
        3. Input/output handles
        4. Usage examples with code
        5. Integration examples
        6. Best practices
        7. Troubleshooting tips
        
        IMPORTANT: 
        - Start with the EXACT frontmatter format shown above
        - The title MUST be quoted if it contains spaces
        - The description MUST be a quoted string
        - Follow with a single # heading using the worker name
        
        Be technical but accessible. Include practical examples.
        """
        
        try:
            # Try OpenAI first if available
            if self.openai_client:
                response = self.openai_client.chat.completions.create(
                    model="gpt-4",
                    messages=[
                        {"role": "system", "content": "You are a technical documentation expert."},
                        {"role": "user", "content": prompt}
                    ],
                    max_tokens=4000,
                    temperature=0.3
                )
                content = response.choices[0].message.content
                content = self.escape_handlebars_syntax(content)
                return self.fix_frontmatter(content, worker_name)
            
            # Try Anthropic if OpenAI is not available
            elif self.anthropic_client:
                response = self.anthropic_client.messages.create(
                    model="claude-3-5-sonnet-20241022",
                    max_tokens=4000,
                    messages=[
                        {
                            "role": "user",
                            "content": prompt
                        }
                    ]
                )
                content = response.content[0].text
                content = self.escape_handlebars_syntax(content)
                return self.fix_frontmatter(content, worker_name)
            
            else:
                print(f"⚠️  No AI client available for {worker_name}. Please set up API keys.")
                return self.generate_fallback_docs(worker_name)
            
        except Exception as e:
            print(f"❌ Error generating documentation for {worker_name}: {e}")
            return self.generate_fallback_docs(worker_name)
    
    def fix_frontmatter(self, content: str, worker_name: str) -> str:
        """Ensure the content has proper frontmatter."""
        
        # Check if content starts with frontmatter
        if not content.strip().startswith('---'):
            # Add frontmatter if missing
            frontmatter = f"""---
title: "{worker_name.title()} Worker"
description: "Documentation for the {worker_name} worker in Signpost AI"
---

"""
            # Remove any existing title if it exists
            lines = content.split('\n')
            if lines and lines[0].startswith('#'):
                content = '\n'.join(lines[1:]).strip()
            
            return frontmatter + f"# {worker_name.title()} Worker\n\n" + content
        
        # Fix existing frontmatter if it's malformed
        lines = content.split('\n')
        if '---' in lines:
            first_dash = lines.index('---')
            try:
                second_dash = lines.index('---', first_dash + 1)
                
                # Extract and fix frontmatter
                frontmatter_lines = lines[first_dash + 1:second_dash]
                fixed_frontmatter = ['---']
                
                for line in frontmatter_lines:
                    if line.startswith('title:'):
                        title_part = line.split(':', 1)[1].strip()
                        if not title_part.startswith('"'):
                            title_part = f'"{title_part}"'
                        fixed_frontmatter.append(f'title: {title_part}')
                    elif line.startswith('description:'):
                        desc_part = line.split(':', 1)[1].strip()
                        if not desc_part.startswith('"'):
                            desc_part = f'"{desc_part}"'
                        fixed_frontmatter.append(f'description: {desc_part}')
                    else:
                        fixed_frontmatter.append(line)
                
                fixed_frontmatter.append('---')
                
                # Reconstruct content
                remaining_content = '\n'.join(lines[second_dash + 1:])
                return '\n'.join(fixed_frontmatter) + '\n' + remaining_content
                
            except ValueError:
                # Malformed frontmatter, replace it
                return self.fix_frontmatter(content.replace('---', ''), worker_name)
        
        return content
    
    def escape_handlebars_syntax(self, content: str) -> str:
        """Escape Handlebars syntax to prevent MDX parsing issues."""
        import re
        
        # Find patterns like {{variable}} and {{{variable}}} and escape them
        # But only if they're not already in code blocks (between backticks)
        
        def escape_match(match):
            full_match = match.group(0)
            # Replace { with HTML entity &#123; and } with &#125;
            return full_match.replace('{', '&#123;').replace('}', '&#125;')
        
        # Handle triple braces first
        content = re.sub(r'\{\{\{[^}]+\}\}\}', escape_match, content)
        
        # Then handle double braces (but not if they're already escaped or in code)
        content = re.sub(r'(?<!`)\{\{[^}]+\}\}(?!`)', escape_match, content)
        
        return content
    
    def generate_component_documentation(self, component_name: str, component_code: str) -> str:
        """Generate documentation for UI components using AI."""
        
        prompt = f"""
        You are a React component documentation expert. Generate comprehensive documentation for the Signpost AI component: {component_name}
        
        Component Code:
        {component_code[:2000]}...
        
        Please create documentation that includes:
        1. Component overview and purpose
        2. Props interface
        3. Usage examples
        4. Styling and customization
        5. Accessibility considerations
        6. Performance notes
        7. Related components
        
        Format the output as Markdown with proper frontmatter.
        Include React code examples and TypeScript interfaces.
        """
        
        try:
            response = self.openai_client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": "You are a React documentation expert."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=4000
            )
            
            return response.choices[0].message.content
            
        except Exception as e:
            print(f"Error generating component documentation for {component_name}: {e}")
            return self.generate_fallback_docs(component_name)
    
    def generate_api_documentation(self, api_section: str) -> str:
        """Generate API reference documentation using AI."""
        
        prompt = f"""
        You are an API documentation expert. Generate comprehensive API reference documentation for Signpost AI.
        
        Focus on: {api_section}
        
        Please create documentation that includes:
        1. API overview and authentication
        2. Endpoint specifications
        3. Request/response schemas
        4. Code examples in multiple languages
        5. Error handling
        6. Rate limiting
        7. SDK examples
        
        Format the output as Markdown with proper frontmatter.
        Include OpenAPI-style specifications and practical examples.
        """
        
        try:
            response = self.anthropic_client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=4000,
                messages=[
                    {
                        "role": "user",
                        "content": prompt
                    }
                ]
            )
            
            return response.content[0].text
            
        except Exception as e:
            print(f"Error generating API documentation: {e}")
            return self.generate_fallback_docs("API Reference")
    
    def generate_integration_guide(self, integration_name: str) -> str:
        """Generate integration guides using AI."""
        
        prompt = f"""
        You are an integration documentation expert. Generate a comprehensive integration guide for: {integration_name}
        
        Please create documentation that includes:
        1. Integration overview and benefits
        2. Prerequisites and setup
        3. Step-by-step configuration
        4. Code examples
        5. Testing and validation
        6. Troubleshooting
        7. Best practices
        8. Security considerations
        
        Format the output as Markdown with proper frontmatter.
        Include practical examples and common use cases.
        """
        
        try:
            response = self.openai_client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": "You are an integration documentation expert."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=4000
            )
            
            return response.choices[0].message.content
            
        except Exception as e:
            print(f"Error generating integration guide for {integration_name}: {e}")
            return self.generate_fallback_docs(integration_name)
    
    def generate_fallback_docs(self, name: str) -> str:
        """Generate basic fallback documentation when AI generation fails."""
        
        return f"""---
title: "{name}"
description: "Documentation for {name}"
---

# {name}

## Overview

This is a placeholder documentation for {name}. Please update with proper content.

## Configuration

*Configuration details to be added*

## Usage

*Usage examples to be added*

## Examples

*Code examples to be added*

---

*This documentation was auto-generated and needs manual review.*
"""
    
    def update_changelog(self, changes: Dict[str, List[str]]):
        """Update the changelog with recent changes."""
        
        changelog_file = self.docs_dir / 'content' / 'docs' / 'changelog.mdx'
        
        if not changelog_file.exists():
            changelog_file.parent.mkdir(parents=True, exist_ok=True)
            changelog_file.write_text("""---
title: Changelog
description: Recent changes and updates to Signpost AI
---

# Changelog

## Recent Updates

""")
        
        # Read existing changelog
        content = changelog_file.read_text()
        
        # Add new entry
        today = datetime.now().strftime("%Y-%m-%d")
        new_entry = f"""
## {today}

### Documentation Updates
"""
        
        for category, items in changes.items():
            if items:
                new_entry += f"\n#### {category.title()}\n"
                for item in items[:5]:  # Limit to 5 items per category
                    new_entry += f"- {item}\n"
        
        # Insert at the beginning of the content
        lines = content.split('\n')
        insert_index = 0
        for i, line in enumerate(lines):
            if line.startswith('# Changelog'):
                insert_index = i + 2
                break
        
        lines.insert(insert_index, new_entry)
        
        # Write updated content
        changelog_file.write_text('\n'.join(lines))
    
    def generate_examples(self) -> str:
        """Generate example documentation using AI."""
        
        prompt = """
        You are a technical documentation expert. Generate comprehensive examples for Signpost AI workflows.
        
        Please create documentation that includes:
        1. Basic agent creation
        2. Conversational flow setup
        3. Document generation workflow
        4. Search integration example
        5. Multi-worker orchestration
        6. Error handling patterns
        7. Performance optimization
        
        Each example should include:
        - Clear description
        - Step-by-step instructions
        - Code examples
        - Expected output
        - Common pitfalls
        
        Format the output as Markdown with proper frontmatter.
        Make examples practical and immediately usable.
        """
        
        try:
            response = self.anthropic_client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=4000,
                messages=[
                    {
                        "role": "user",
                        "content": prompt
                    }
                ]
            )
            
            return response.content[0].text
            
        except Exception as e:
            print(f"Error generating examples: {e}")
            return self.generate_fallback_docs("Examples")
    
    def run(self):
        """Main execution method."""
        
        print("🚀 Starting AI-powered documentation generation...")
        
        # Analyze code changes
        changes = self.analyze_code_changes()
        print(f"📊 Detected changes: {changes}")
        
        # Generate documentation based on changes
        if changes['workers']:
            print("🔧 Generating worker documentation...")
            # Generate worker docs for each changed worker
            for worker in ['ai', 'api', 'documentgenerator', 'search', 'message']:
                worker_file = self.project_root / 'src' / 'lib' / 'agents' / 'workers' / f'{worker}.ts'
                if worker_file.exists():
                    worker_code = worker_file.read_text()
                    docs_content = self.generate_worker_documentation(worker, worker_code)
                    
                    # Write to docs directory
                    docs_file = self.docs_dir / 'content' / 'docs' / 'workers' / f'{worker}.mdx'
                    docs_file.parent.mkdir(parents=True, exist_ok=True)
                    docs_file.write_text(docs_content)
                    print(f"✅ Generated docs for {worker}")
        
        if changes['components']:
            print("🎨 Generating component documentation...")
            # Generate component docs
            components_doc = self.generate_component_documentation("UI Components", "")
            docs_file = self.docs_dir / 'content' / 'docs' / 'components' / 'ui.mdx'
            docs_file.parent.mkdir(parents=True, exist_ok=True)
            docs_file.write_text(components_doc)
            print("✅ Generated component documentation")
        
        if changes['api']:
            print("🔌 Generating API documentation...")
            # Generate API docs
            api_doc = self.generate_api_documentation("Core API")
            docs_file = self.docs_dir / 'content' / 'docs' / 'api' / 'core.mdx'
            docs_file.parent.mkdir(parents=True, exist_ok=True)
            docs_file.write_text(api_doc)
            print("✅ Generated API documentation")
        
        if changes['integrations']:
            print("🔗 Generating integration guides...")
            # Generate integration guides
            for integration in ['telerivet', 'zendesk', 'web-scraping']:
                integration_doc = self.generate_integration_guide(integration)
                docs_file = self.docs_dir / 'content' / 'docs' / 'integrations' / f'{integration}.mdx'
                docs_file.parent.mkdir(parents=True, exist_ok=True)
                docs_file.write_text(integration_doc)
                print(f"✅ Generated integration guide for {integration}")
        
        # Always generate examples
        print("📚 Generating examples...")
        examples_doc = self.generate_examples()
        docs_file = self.docs_dir / 'content' / 'docs' / 'examples' / 'index.mdx'
        docs_file.parent.mkdir(parents=True, exist_ok=True)
        docs_file.write_text(examples_doc)
        print("✅ Generated examples")
        
        # Update changelog
        print("📝 Updating changelog...")
        self.update_changelog(changes)
        print("✅ Updated changelog")
        
        print("🎉 Documentation generation complete!")
        print(f"📁 Documentation written to: {self.docs_dir}")
    
    def generate_all_worker_docs(self):
        """Generate documentation for all workers in the workers directory."""
        workers_dir = self.project_root / 'src' / 'lib' / 'agents' / 'workers'
        
        if not workers_dir.exists():
            print(f"❌ Workers directory not found: {workers_dir}")
            return
        
        worker_files = list(workers_dir.glob('*.ts'))
        print(f"📁 Found {len(worker_files)} worker files")
        
        for worker_file in worker_files:
            worker_name = worker_file.stem
            print(f"📝 Generating documentation for: {worker_name}")
            
            try:
                with open(worker_file, 'r') as f:
                    worker_code = f.read()
                
                # Generate documentation
                docs = self.generate_worker_documentation(worker_name, worker_code)
                
                # Save documentation
                docs_file = self.docs_dir / 'content' / 'docs' / 'workers' / f'{worker_name}.mdx'
                docs_file.parent.mkdir(parents=True, exist_ok=True)
                docs_file.write_text(docs)
                
                print(f"✅ Generated documentation for {worker_name}")
                
            except Exception as e:
                print(f"❌ Error generating documentation for {worker_name}: {e}")
    
    def generate_specific_workers(self, worker_names):
        """Generate documentation for specific workers."""
        workers_dir = self.project_root / 'src' / 'lib' / 'agents' / 'workers'
        
        if not workers_dir.exists():
            print(f"❌ Workers directory not found: {workers_dir}")
            return
        
        for worker_name in worker_names:
            worker_file = workers_dir / f'{worker_name}.ts'
            
            if not worker_file.exists():
                print(f"❌ Worker file not found: {worker_file}")
                continue
            
            print(f"📝 Generating documentation for: {worker_name}")
            
            try:
                with open(worker_file, 'r') as f:
                    worker_code = f.read()
                
                # Generate documentation
                docs = self.generate_worker_documentation(worker_name, worker_code)
                
                # Save documentation
                docs_file = self.docs_dir / 'content' / 'docs' / 'workers' / f'{worker_name}.mdx'
                docs_file.parent.mkdir(parents=True, exist_ok=True)
                docs_file.write_text(docs)
                
                print(f"✅ Generated documentation for {worker_name}")
                
            except Exception as e:
                print(f"❌ Error generating documentation for {worker_name}: {e}")
    
    def generate_app_section_documentation(self, section_name: str) -> str:
        """Generate documentation for an app section using AI."""
        
        # Analyze the section directory
        section_info = self.analyze_app_section(section_name)
        
        prompt = f"""
        You are a technical documentation expert specializing in React applications and user interfaces. 
        Generate comprehensive documentation for the {section_name.title()} section of Signpost AI.

        CRITICAL: You MUST start your response with EXACTLY this frontmatter format:
        ---
        title: "{section_name.title()} Section"
        description: "Complete guide to the {section_name} section of Signpost AI"
        ---

        # {section_name.title()} Section

        Section Analysis:
        - Main files: {section_info.get('main_files', [])}
        - Components: {section_info.get('components', [])}
        - Key features: {section_info.get('features', [])}
        
        Please create documentation that includes:
        
        ## 1. Overview
        - Purpose and main functionality of this section
        - Who uses this section and when
        - Key capabilities and features
        
        ## 2. User Interface
        - Main interface elements and layout
        - Navigation and user flow
        - Key actions users can perform
        
        ## 3. Features
        - Detailed explanation of each major feature
        - How to use each feature effectively
        - Best practices for optimal results
        
        ## 4. Components
        - Overview of main UI components
        - How components work together
        - Component hierarchy and relationships
        
        ## 5. Workflows
        - Common user workflows and processes
        - Step-by-step guides for typical tasks
        - Integration with other sections
        
        ## 6. Configuration
        - Settings and customization options
        - How to configure for different use cases
        - Advanced configuration scenarios
        
        ## 7. Troubleshooting
        - Common issues and solutions
        - Error messages and their meanings
        - Performance optimization tips
        
        ## 8. Related Sections
        - How this section integrates with others
        - Cross-section workflows
        - Data flow between sections
        
        Be comprehensive but accessible. Focus on practical usage and user experience.
        """
        
        try:
            # Try OpenAI first if available
            if self.openai_client:
                response = self.openai_client.chat.completions.create(
                    model="gpt-4",
                    messages=[
                        {"role": "system", "content": "You are a technical documentation expert specializing in React applications."},
                        {"role": "user", "content": prompt}
                    ],
                    max_tokens=4000,
                    temperature=0.3
                )
                content = response.choices[0].message.content
                content = self.escape_handlebars_syntax(content)
                return self.fix_frontmatter(content, f"{section_name}_section")
            
            # Try Anthropic if OpenAI is not available
            elif self.anthropic_client:
                response = self.anthropic_client.messages.create(
                    model="claude-3-5-sonnet-20241022",
                    max_tokens=4000,
                    messages=[
                        {
                            "role": "user",
                            "content": prompt
                        }
                    ]
                )
                content = response.content[0].text
                content = self.escape_handlebars_syntax(content)
                return self.fix_frontmatter(content, f"{section_name}_section")
            
            else:
                print(f"⚠️  No AI client available for {section_name}. Please set up API keys.")
                return self.generate_fallback_docs(f"{section_name.title()} Section")
            
        except Exception as e:
            print(f"❌ Error generating documentation for {section_name}: {e}")
            return self.generate_fallback_docs(f"{section_name.title()} Section")
    
    def analyze_app_section(self, section_name: str) -> dict:
        """Analyze an app section to extract key information."""
        
        section_mapping = {
            'playground': {
                'main_files': ['playground.tsx', 'playground/agentview.tsx', 'playground/chatmessage.tsx', 'playground/history.tsx', 'playground/search.tsx'],
                'features': ['Agent testing', 'Chat interface', 'Agent history', 'Search functionality'],
                'components': ['AgentView', 'ChatMessage', 'History', 'Search'],
                'sub_sections': {
                    'agent-view': {
                        'title': 'Agent View',
                        'description': 'Interactive agent testing and configuration interface',
                        'files': ['playground/agentview.tsx'],
                        'features': ['Agent selection', 'Configuration', 'Testing interface']
                    },
                    'chat-interface': {
                        'title': 'Chat Interface', 
                        'description': 'Real-time conversation interface with AI agents',
                        'files': ['playground/chatmessage.tsx'],
                        'features': ['Message display', 'Input handling', 'Conversation flow']
                    },
                    'history': {
                        'title': 'Conversation History',
                        'description': 'View and manage past agent interactions',
                        'files': ['playground/history.tsx'],
                        'features': ['History viewing', 'Search past conversations', 'Export conversations']
                    },
                    'search': {
                        'title': 'Search Functionality',
                        'description': 'Search through agents and conversations',
                        'files': ['playground/search.tsx'],
                        'features': ['Agent search', 'Conversation search', 'Filter options']
                    }
                }
            },
            'evaluation': {
                'main_files': ['evaluation/logs.tsx', 'evaluation/scores.tsx', 'evaluation/custom-view.tsx', 'evaluation/log.tsx', 'evaluation/score.tsx'],
                'features': ['Performance scoring', 'Log analysis', 'Custom evaluation views', 'Agent metrics'],
                'components': ['LogViewer', 'ScoreViewer', 'CustomView', 'EvaluationTable'],
                'sub_sections': {
                    'logs': {
                        'title': 'Logs Management',
                        'description': 'View and analyze agent execution logs',
                        'files': ['evaluation/logs.tsx', 'evaluation/log.tsx'],
                        'features': ['Log viewing', 'Log filtering', 'Error analysis', 'Performance tracking']
                    },
                    'scores': {
                        'title': 'Performance Scores',
                        'description': 'Agent performance scoring and metrics',
                        'files': ['evaluation/scores.tsx', 'evaluation/score.tsx'],
                        'features': ['Score calculation', 'Performance metrics', 'Comparison tools', 'Trending analysis']
                    },
                    'custom-views': {
                        'title': 'Custom Evaluation Views',
                        'description': 'Create custom evaluation dashboards and views',
                        'files': ['evaluation/custom-view.tsx'],
                        'features': ['Custom dashboards', 'Metric configuration', 'View templates', 'Data visualization']
                    }
                }
            },
            'knowledge': {
                'main_files': ['knowledge.tsx', 'knowledge/index.tsx', 'knowledge/collections-logic.ts', 'knowledge/vector-generation.ts'],
                'features': ['Document management', 'Vector embeddings', 'Knowledge collections', 'Source management'],
                'components': ['CollectionsTable', 'SourcesTable', 'VectorGeneration', 'DocumentUpload'],
                'sub_sections': {
                    'collections': {
                        'title': 'Knowledge Collections',
                        'description': 'Organize and manage document collections',
                        'files': ['knowledge/collections-logic.ts', 'knowledge/components/collections-table.tsx'],
                        'features': ['Collection creation', 'Document organization', 'Collection management', 'Access control']
                    },
                    'sources': {
                        'title': 'Document Sources',
                        'description': 'Upload and manage document sources',
                        'files': ['knowledge/sources-hooks.ts', 'knowledge/components/sources-table.tsx'],
                        'features': ['File upload', 'Source management', 'Document processing', 'Format support']
                    },
                    'vector-generation': {
                        'title': 'Vector Generation',
                        'description': 'Generate and manage document embeddings',
                        'files': ['knowledge/vector-generation.ts'],
                        'features': ['Embedding generation', 'Vector storage', 'Similarity search', 'Index management']
                    }
                }
            },
            'settings': {
                'main_files': ['settings/teams.tsx', 'settings/users.tsx', 'settings/projects.tsx', 'settings/api-keys.tsx', 'settings/billing.tsx'],
                'features': ['Team management', 'User administration', 'API key management', 'Billing', 'Access control'],
                'components': ['TeamManager', 'UserManager', 'ApiKeyManager', 'BillingDashboard', 'AccessControl'],
                'sub_sections': {
                    'teams': {
                        'title': 'Team Management',
                        'description': 'Manage teams and team memberships',
                        'files': ['settings/teams.tsx', 'settings/team.tsx', 'settings/team-members.tsx'],
                        'features': ['Team creation', 'Member management', 'Team settings', 'Team permissions']
                    },
                    'users': {
                        'title': 'User Management',
                        'description': 'Manage user accounts and permissions',
                        'files': ['settings/users.tsx', 'settings/user.tsx', 'settings/profile.tsx'],
                        'features': ['User creation', 'Permission management', 'Profile settings', 'Account management']
                    },
                    'projects': {
                        'title': 'Project Management',
                        'description': 'Manage projects and project settings',
                        'files': ['settings/projects.tsx', 'settings/project.tsx'],
                        'features': ['Project creation', 'Project configuration', 'Access control', 'Project sharing']
                    },
                    'api-keys': {
                        'title': 'API Key Management',
                        'description': 'Manage API keys and integrations',
                        'files': ['settings/api-keys.tsx', 'settings/api-key.tsx'],
                        'features': ['Key generation', 'Key management', 'Integration setup', 'Security settings']
                    },
                    'billing': {
                        'title': 'Billing & Usage',
                        'description': 'Manage billing, subscriptions, and usage monitoring',
                        'files': ['settings/billing.tsx', 'settings/usage.tsx'],
                        'features': ['Subscription management', 'Usage tracking', 'Payment methods', 'Billing history']
                    },
                    'access-control': {
                        'title': 'Access Control',
                        'description': 'Manage roles, permissions, and access control',
                        'files': ['settings/access-control.tsx', 'settings/roles.tsx'],
                        'features': ['Role management', 'Permission assignment', 'Access policies', 'Security rules']
                    }
                }
            }
        }
        
        return section_mapping.get(section_name, {
            'main_files': [],
            'features': ['Core functionality'],
            'components': ['Main components'],
            'sub_sections': {}
        })

    def generate_sub_section_documentation(self, section_name: str, sub_section_key: str, sub_section_info: dict) -> str:
        """Generate documentation for a specific sub-section using AI."""
        
        prompt = f"""
        You are a technical documentation expert specializing in React applications and user interfaces. 
        Generate comprehensive documentation for the {sub_section_info['title']} sub-section of the {section_name.title()} section in Signpost AI.

        CRITICAL: You MUST start your response with EXACTLY this frontmatter format:
        ---
        title: "{sub_section_info['title']}"
        description: "{sub_section_info['description']}"
        ---

        # {sub_section_info['title']}

        Sub-section Analysis:
        - Related files: {sub_section_info.get('files', [])}
        - Key features: {sub_section_info.get('features', [])}
        - Description: {sub_section_info['description']}
        
        Please create detailed documentation that includes:
        
        ## Overview
        - Purpose and main functionality of this sub-section
        - How it fits within the larger {section_name.title()} section
        - When and why users would use this feature
        
        ## Key Features
        - Detailed explanation of each feature
        - How to access and use each feature
        - Expected user workflows and processes
        
        ## User Interface
        - Layout and design elements
        - Navigation within this sub-section
        - Interactive elements and controls
        
        ## How to Use
        - Step-by-step guides for common tasks
        - Screenshots descriptions (where applicable)
        - Best practices for effective usage
        
        ## Configuration & Settings
        - Available options and settings
        - How to customize the interface
        - Advanced configuration scenarios
        
        ## Integration
        - How this sub-section connects to other parts of the system
        - Data flow and dependencies
        - Related functionality in other sections
        
        ## Troubleshooting
        - Common issues and solutions
        - Error messages and their meanings
        - Performance tips and optimization
        
        Be specific, practical, and user-focused. Include actionable guidance and real-world usage scenarios.
        """
        
        try:
            # Try OpenAI first if available
            if self.openai_client:
                response = self.openai_client.chat.completions.create(
                    model="gpt-4",
                    messages=[
                        {"role": "system", "content": "You are a technical documentation expert specializing in user interface documentation."},
                        {"role": "user", "content": prompt}
                    ],
                    max_tokens=4000,
                    temperature=0.3
                )
                content = response.choices[0].message.content
                content = self.escape_handlebars_syntax(content)
                return self.fix_frontmatter(content, f"{section_name}_{sub_section_key}")
            
            # Try Anthropic if OpenAI is not available
            elif self.anthropic_client:
                response = self.anthropic_client.messages.create(
                    model="claude-3-5-sonnet-20241022",
                    max_tokens=4000,
                    messages=[
                        {
                            "role": "user",
                            "content": prompt
                        }
                    ]
                )
                content = response.content[0].text
                content = self.escape_handlebars_syntax(content)
                return self.fix_frontmatter(content, f"{section_name}_{sub_section_key}")
            
            else:
                print(f"⚠️  No AI client available for {sub_section_info['title']}. Please set up API keys.")
                return self.generate_fallback_docs(sub_section_info['title'])
            
        except Exception as e:
            print(f"❌ Error generating documentation for {sub_section_info['title']}: {e}")
            return self.generate_fallback_docs(sub_section_info['title'])
    
    def generate_all_app_sections(self):
        """Generate documentation for all app sections and their sub-sections."""
        sections = ['playground', 'evaluation', 'knowledge', 'settings']
        
        total_docs = 0
        for section in sections:
            section_info = self.analyze_app_section(section)
            total_docs += 1 + len(section_info.get('sub_sections', {}))
        
        print(f"🏗️ Generating documentation for {len(sections)} app sections with {total_docs} total documents")
        
        for section in sections:
            print(f"📝 Generating documentation for section: {section}")
            section_info = self.analyze_app_section(section)
            
            try:
                # Generate main section documentation (index file)
                docs = self.generate_app_section_documentation(section)
                
                # Save main section documentation
                docs_file = self.docs_dir / 'content' / 'docs' / 'app-sections' / section / 'index.mdx'
                docs_file.parent.mkdir(parents=True, exist_ok=True)
                docs_file.write_text(docs)
                
                print(f"✅ Generated main documentation for {section}")
                
                # Generate sub-section documentation
                sub_sections = section_info.get('sub_sections', {})
                for sub_key, sub_info in sub_sections.items():
                    print(f"  📝 Generating sub-section: {sub_info['title']}")
                    
                    try:
                        sub_docs = self.generate_sub_section_documentation(section, sub_key, sub_info)
                        
                        # Save sub-section documentation
                        sub_docs_file = self.docs_dir / 'content' / 'docs' / 'app-sections' / section / f'{sub_key}.mdx'
                        sub_docs_file.parent.mkdir(parents=True, exist_ok=True)
                        sub_docs_file.write_text(sub_docs)
                        
                        print(f"  ✅ Generated sub-section: {sub_info['title']}")
                        
                    except Exception as e:
                        print(f"  ❌ Error generating sub-section {sub_info['title']}: {e}")
                
            except Exception as e:
                print(f"❌ Error generating documentation for {section}: {e}")

if __name__ == "__main__":
    import argparse
    import sys
    
    parser = argparse.ArgumentParser(description='AI-powered documentation generator for Signpost AI')
    parser.add_argument('--all', action='store_true', help='Generate documentation for all workers')
    parser.add_argument('--workers', type=str, help='Comma-separated list of specific workers to generate')
    parser.add_argument('--worker', type=str, help='Generate documentation for a single worker')
    parser.add_argument('--app-sections', action='store_true', help='Generate documentation for all app sections')
    parser.add_argument('--section', type=str, help='Generate documentation for a specific app section (playground, evaluation, knowledge, settings)')
    parser.add_argument('--analyze', action='store_true', help='Only analyze code changes without generating docs')
    
    args = parser.parse_args()
    
    generator = DocumentationGenerator()
    
    if args.all:
        print("🚀 Generating documentation for ALL workers...")
        generator.generate_all_worker_docs()
    elif args.workers:
        worker_list = [w.strip() for w in args.workers.split(',')]
        print(f"🚀 Generating documentation for workers: {worker_list}")
        generator.generate_specific_workers(worker_list)
    elif args.worker:
        print(f"🚀 Generating documentation for worker: {args.worker}")
        generator.generate_specific_workers([args.worker])
    elif args.app_sections:
        print("🏗️ Generating documentation for ALL app sections...")
        generator.generate_all_app_sections()
    elif args.section:
        print(f"🏗️ Generating documentation for section: {args.section}")
        if args.section in ['playground', 'evaluation', 'knowledge', 'settings']:
            docs = generator.generate_app_section_documentation(args.section)
            docs_file = generator.docs_dir / 'content' / 'docs' / 'app-sections' / f'{args.section}.mdx'
            docs_file.parent.mkdir(parents=True, exist_ok=True)
            docs_file.write_text(docs)
            print(f"✅ Generated documentation for {args.section}")
        else:
            print(f"❌ Invalid section: {args.section}. Valid options: playground, evaluation, knowledge, settings")
    elif args.analyze:
        changes = generator.analyze_code_changes()
        print(f"📊 Detected changes: {changes}")
    else:
        generator.run()
