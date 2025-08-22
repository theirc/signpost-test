# Signpost AI Documentation

This documentation system contains the comprehensive documentation for Signpost AI, built with [Fumadocs](https://fumadocs.dev/) and automatically deployed via GitHub Actions.

## 📚 Documentation Structure

### App Sections
- **Agents** - Agent creation and management guide
- **Templates** - Pre-built agent templates library  
- **Playground** - Agent testing and interaction environment

### Evaluation
- **Logs** - Conversation monitoring and analysis
- **Scores** - Quality assessment and performance metrics

### Knowledge
- **Collections** - Document organization and management
- **Sources** - File uploads and live data integration

### Settings
- **Projects** - Project configuration and management
- **Team** - Team member and collaboration management
- **Users** - Individual user management and permissions
- **Billing** - Subscription and payment management
- **Usage** - Resource consumption and analytics
- **API Keys** - API access and security management
- **Access Control** - Advanced security and permissions

### Workers (Components)
- **Input & Output** - Input, Response, API Call
- **Generators** - AI, Schema, Structured Output, Agent, Content, LLM Agent, Handoff
- **Tools** - Search, Combine, Selector, Document Generator, Persist, STT, TTS, Translate, Template, Chat History, Send Message
- **Debug** - Mock Data, Display, Tooltip

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Yarn package manager

### Local Development
```bash
# Install dependencies
cd docs
yarn install

# Start development server
yarn dev

# Build for production
yarn build
```

The documentation will be available at `http://localhost:3000`

## 🤖 AI Documentation Generation

This project includes AI-powered documentation generation for workers and components.

### Setup
```bash
# Create Python environment
python3 -m venv docs-env
source docs-env/bin/activate
pip install requests openai anthropic

# Set your OpenAI API key
export VITE_OPENAI_API_KEY='your-api-key-here'
```

### Generate Documentation
```bash
# Generate all worker documentation
source docs-env/bin/activate
python3 scripts/generate_docs.py --all

# Generate specific worker documentation
python3 scripts/generate_docs.py --worker search

# Generate app section documentation  
python3 scripts/generate_docs.py --app-sections
```

## 🔧 Manual Documentation Updates

### Adding New Workers
1. Create new MDX file in the appropriate category:
   - `docs/content/docs/workers/input-output/` 
   - `docs/content/docs/workers/generators/`
   - `docs/content/docs/workers/tools/`
   - `docs/content/docs/workers/debug/`

2. Use this template:
```mdx
---
title: "Worker Name"
description: "Brief description of what this worker does"
---

# Worker Name

## Screenshots

![Worker Interface](/images/screenshots/workers/worker-name.png)
*Worker Interface - Description of the interface*

## Overview
Description of the worker's purpose and functionality.

## Configuration
Step-by-step configuration instructions.

## Use Cases
Common use cases and examples.

## Best Practices
Recommendations for optimal usage.
```

### Adding Screenshots
1. Capture screenshots of your application
2. Save them as PNG files in `docs/public/images/screenshots/{section}/`
3. Reference them in your MDX files using:
```mdx
![Description](/images/screenshots/section/filename.png)
*Caption describing the screenshot*
```

## 📁 Project Structure

```
docs/
├── content/docs/          # Documentation content
│   ├── app-sections/      # Main application sections
│   └── workers/           # Worker components organized by category
├── public/images/         # Static assets and screenshots
├── src/                   # Next.js application source
└── package.json          # Dependencies and scripts

scripts/
├── generate_docs.py       # AI documentation generator
└── load_env.py           # Environment variable loader
```

## 🔄 Automated Documentation Updates

The documentation is automatically updated when changes are merged to the main branch using GitHub Actions and deployed to Vercel.

### Deployment Options

#### 🚀 **Vercel (Recommended)**
- ⚡ Lightning-fast global CDN
- 👀 Automatic PR preview deployments  
- 🌐 Custom domain support
- 📊 Built-in analytics
- 🔒 HTTPS by default

#### 📄 **GitHub Pages (Alternative)**
- 🆓 Free hosting on GitHub
- 📝 Simple static site deployment
- 🔧 Basic functionality

### Vercel Deployment Setup

See `VERCEL_DEPLOYMENT_GUIDE.md` for complete instructions.

#### Quick Vercel Setup:
1. Connect your repo to Vercel
2. Set root directory to `docs`
3. Add repository secrets: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`
4. Push to main branch

### GitHub Pages Setup (Alternative)

#### Step 1: Create Workflow File
Create `.github/workflows/docs-update.yml` in your main repository:

```yaml
name: Update Documentation

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  update-docs:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout main repository
      uses: actions/checkout@v4
      with:
        token: ${{ secrets.DOCS_UPDATE_TOKEN }}
        
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'yarn'
        
    - name: Setup Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.11'
        
    - name: Install Python dependencies
      run: |
        python -m pip install --upgrade pip
        pip install requests openai anthropic
        
    - name: Install Node.js dependencies
      run: |
        cd docs
        yarn install
        
    - name: Generate updated documentation
      env:
        OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
      run: |
        python scripts/generate_docs.py --all
        python scripts/generate_docs.py --app-sections
        
    - name: Build documentation
      run: |
        cd docs
        yarn build
        
    - name: Deploy to GitHub Pages
      if: github.ref == 'refs/heads/main'
      uses: peaceiris/actions-gh-pages@v3
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./docs/out
        cname: docs.signpost-ai.com  # Your custom domain (optional)
```

#### Step 2: Configure Repository Secrets
In your GitHub repository settings, add these secrets:

1. **`OPENAI_API_KEY`**: Your OpenAI API key for documentation generation
2. **`DOCS_UPDATE_TOKEN`**: Personal access token with repository write permissions

#### Step 3: Configure GitHub Pages
1. Go to repository Settings > Pages
2. Set source to "GitHub Actions"
3. (Optional) Configure custom domain

#### Step 4: Enable Actions
1. Go to repository Settings > Actions > General
2. Ensure "Allow all actions and reusable workflows" is selected
3. Set workflow permissions to "Read and write permissions"

### Deployment Process

When code is merged to main:
1. **Trigger**: GitHub Action activates on push to main branch
2. **Analysis**: AI analyzes codebase changes and updates documentation
3. **Generation**: New documentation is generated for modified components
4. **Build**: Documentation site is built and optimized
5. **Deploy**: Updates are deployed to GitHub Pages
6. **Notify**: Team is notified of documentation updates

## 🛡️ Security Considerations

- API keys are stored securely as GitHub secrets
- Documentation generation runs in isolated environment
- All generated content is reviewed before deployment
- Access tokens have minimal required permissions

## 📊 Monitoring and Maintenance

### Regular Tasks
- **Monthly**: Review and update documentation accuracy
- **Quarterly**: Audit and optimize documentation structure
- **As needed**: Update screenshots and visual assets

### Troubleshooting
- Check GitHub Actions logs for deployment issues
- Verify API key validity and permissions
- Ensure documentation builds locally before pushing

## 🤝 Contributing

1. **Documentation Updates**: Edit MDX files directly or use AI generation
2. **New Features**: Add documentation alongside feature development  
3. **Screenshots**: Update visual assets when UI changes
4. **Review**: All documentation changes should be reviewed for accuracy

## 📞 Support

For questions about the documentation system:
- Check the [Fumadocs documentation](https://fumadocs.dev/)
- Review GitHub Actions logs for deployment issues
- Contact the development team for system-specific questions

---

**Built with ❤️ using [Fumadocs](https://fumadocs.dev/) and automated with GitHub Actions**