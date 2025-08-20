# 📚 Documentation System Overview

This folder contains the complete documentation system for Signpost AI.

## 📁 Structure

```
docs/
├── README.md                    # Documentation system setup & usage
├── VERCEL_DEPLOYMENT_GUIDE.md   # Vercel deployment instructions
├── DEPLOYMENT_GUIDE.md          # GitHub Pages deployment (alternative)
├── OVERVIEW.md                  # This file
│
├── content/docs/                # Documentation content (MDX files)
│   ├── app-sections/           # Application sections
│   ├── workers/                # Worker components by category
│   ├── components/             # UI components
│   ├── api/                    # API reference
│   └── examples/               # Usage examples
│
├── public/                     # Static assets
│   └── images/                 # Screenshots and images
│       └── screenshots/        # Application screenshots
│
├── src/                        # Next.js documentation app
└── [config files]              # Build and deployment configuration
```

## 🚀 Quick Start

```bash
# Install dependencies
yarn install

# Start development server
yarn dev

# Build for production
yarn build
```

## 📖 Key Files

- **`README.md`**: Complete setup and usage guide
- **`VERCEL_DEPLOYMENT_GUIDE.md`**: Recommended deployment method
- **`source.config.ts`**: Documentation structure configuration
- **`content/docs/`**: All documentation content in MDX format

## 🔗 Related

- **Main App**: `../` (parent directory)
- **Scripts**: `../scripts/` (AI generation scripts)
- **GitHub Actions**: `../.github/workflows/docs-update.yml`
