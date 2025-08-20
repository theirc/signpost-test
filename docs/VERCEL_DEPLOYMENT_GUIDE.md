# 🚀 Vercel Deployment Guide for Signpost AI Documentation

Complete guide to deploy your Fumadocs documentation to Vercel with automated GitHub Actions.

## Why Vercel?

✅ **Perfect for Next.js**: Fumadocs is built on Next.js, making Vercel the ideal platform  
✅ **Automatic Preview Deployments**: Every PR gets its own preview URL  
✅ **Global CDN**: Fast loading worldwide  
✅ **Custom Domains**: Easy custom domain setup  
✅ **Serverless Functions**: Built-in API support  
✅ **Zero Configuration**: Works out of the box  

## 🎯 Deployment Options

### Option 1: Manual Deployment (Quick Start)
### Option 2: Automated GitHub Actions (Recommended)

---

## 📋 Option 1: Manual Deployment

### Step 1: Install Vercel CLI
```bash
npm install -g vercel
```

### Step 2: Login to Vercel
```bash
vercel login
```

### Step 3: Deploy from docs directory
```bash
cd docs
vercel
```

Follow the prompts:
- **Set up and deploy**: Yes
- **Which scope**: Select your account/team
- **Link to existing project**: No (first time)
- **Project name**: `signpost-ai-docs` (or your preference)
- **Directory**: `.` (current directory)
- **Override settings**: No

Your documentation will be live at: `https://signpost-ai-docs.vercel.app`

---

## 🤖 Option 2: Automated GitHub Actions (Recommended)

### Step 1: Create Vercel Project

1. **Go to [Vercel Dashboard](https://vercel.com/dashboard)**
2. **Click "Add New..." → "Project"**
3. **Import your GitHub repository**
4. **Configure project**:
   - **Project Name**: `signpost-ai-docs`
   - **Framework Preset**: `Next.js`
   - **Root Directory**: `docs`
   - **Build Command**: `yarn build`
   - **Output Directory**: `.next`
5. **Click "Deploy"**

### Step 2: Get Vercel Configuration

After your first deployment, get these values:

#### 2.1 Get Project ID
```bash
# In your docs directory
cd docs
vercel link
cat .vercel/project.json
```

#### 2.2 Get Organization ID
```bash
# In your Vercel settings
# Go to: https://vercel.com/account
# Copy your Team/User ID
```

#### 2.3 Create Vercel Token
1. **Go to [Vercel Tokens](https://vercel.com/account/tokens)**
2. **Click "Create Token"**
3. **Name**: `GitHub Actions Deployment`
4. **Scope**: Full access (or specific to your team)
5. **Expiration**: No expiration (or as per policy)
6. **Copy the token** (you won't see it again!)

### Step 3: Configure GitHub Secrets

In your GitHub repository settings:

1. **Go to Settings → Secrets and variables → Actions**
2. **Add these repository secrets**:

| Secret Name | Value | Description |
|-------------|-------|-------------|
| `VERCEL_TOKEN` | `vercel_xxx...` | Your Vercel API token |
| `VERCEL_ORG_ID` | `team_xxx...` | Your Vercel organization ID |
| `VERCEL_PROJECT_ID` | `prj_xxx...` | Your Vercel project ID |
| `OPENAI_API_KEY` | `sk-xxx...` | Your OpenAI API key (for AI docs) |

### Step 4: Configure Custom Domain (Optional)

#### 4.1 Add Domain in Vercel
1. **Go to Project Settings → Domains**
2. **Add domain**: `docs.signpost-ai.com`
3. **Follow DNS instructions**

#### 4.2 Update DNS Records
Add these DNS records with your domain provider:

**For Apex Domain** (`docs.signpost-ai.com`):
```
Type: A
Name: docs
Value: 76.76.19.61
```

**For Subdomain** (`docs.signpost-ai.com`):
```
Type: CNAME  
Name: docs
Value: cname.vercel-dns.com
```

### Step 5: Test Deployment

1. **Push to main branch**:
```bash
git add .
git commit -m "feat: Add Vercel deployment configuration"
git push origin main
```

2. **Monitor deployment**:
   - Check **GitHub Actions** tab
   - Check **Vercel Dashboard**
   - Your docs will be live at your Vercel URL

3. **Test PR previews**:
   - Create a pull request
   - GitHub will comment with preview URL
   - Each push updates the preview

---

## 🔧 Advanced Configuration

### Environment Variables

Add environment variables in Vercel dashboard:

1. **Go to Project Settings → Environment Variables**
2. **Add variables**:

| Name | Value | Environment |
|------|-------|-------------|
| `NODE_ENV` | `production` | Production |
| `NEXT_PUBLIC_SITE_URL` | `https://docs.signpost-ai.com` | All |

### Custom Build Commands

Update `docs/vercel.json` for custom configuration:

```json
{
  "buildCommand": "yarn build",
  "installCommand": "yarn install --frozen-lockfile",
  "framework": "nextjs",
  "regions": ["iad1", "sfo1"],
  "functions": {
    "app/api/search/route.ts": {
      "maxDuration": 30
    }
  }
}
```

### Preview Deployment Branch

By default, all branches get preview deployments. To limit:

1. **Project Settings → Git**
2. **Production Branch**: `main`
3. **Preview Deployments**: Enable/disable as needed

---

## 📊 Monitoring and Analytics

### Vercel Analytics

1. **Go to Project → Analytics**
2. **Enable Analytics**
3. **Monitor**:
   - Page views
   - Performance metrics
   - Geographic distribution
   - Device types

### Custom Analytics

Add Google Analytics to your documentation:

```tsx
// docs/src/app/layout.tsx
import { GoogleAnalytics } from '@next/third-parties/google'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <GoogleAnalytics gaId="GA_MEASUREMENT_ID" />
      </body>
    </html>
  )
}
```

---

## 🚨 Troubleshooting

### Common Issues

#### Build Failures
```bash
# Check build locally
cd docs
yarn build

# Common fixes:
yarn install --frozen-lockfile
rm -rf .next node_modules
yarn install
yarn build
```

#### Environment Variables Not Loading
- Verify secrets are set correctly in GitHub
- Check case sensitivity
- Ensure Vercel project is linked correctly

#### Domain Issues
- Verify DNS propagation: `dig docs.signpost-ai.com`
- Check SSL certificate status in Vercel
- Wait 24-48 hours for full propagation

#### Preview Deployments Not Working
- Check GitHub Actions logs
- Verify Vercel token permissions
- Ensure PR has changes to documentation

### Debug Steps

1. **Check GitHub Actions logs**:
   - Actions tab → Latest workflow
   - Look for error messages
   - Check each step status

2. **Check Vercel deployment logs**:
   - Vercel Dashboard → Project → Deployments
   - Click on failed deployment
   - Review build logs

3. **Test locally**:
```bash
cd docs
yarn dev
# Test in browser
yarn build
# Check for build errors
```

---

## 🎯 Deployment Workflow

### What Happens Automatically

#### On Pull Request:
1. ✅ **AI generates updated documentation** (if API key available)
2. ✅ **Builds documentation site**
3. ✅ **Deploys to preview URL**
4. ✅ **Comments on PR with preview link**
5. ✅ **Updates preview on subsequent pushes**

#### On Merge to Main:
1. ✅ **AI generates updated documentation**
2. ✅ **Builds documentation site**
3. ✅ **Deploys to production URL**
4. ✅ **Invalidates CDN cache**
5. ✅ **Updates search index**

### Manual Deployments

When needed, deploy manually:

```bash
# Preview deployment
cd docs
vercel

# Production deployment  
cd docs
vercel --prod
```

---

## 🎉 Success Checklist

After setup, verify:

- ✅ **Production site loads**: `https://your-project.vercel.app`
- ✅ **Custom domain works** (if configured): `https://docs.signpost-ai.com`
- ✅ **Search functionality**: Test documentation search
- ✅ **Mobile responsive**: Test on mobile devices
- ✅ **PR previews**: Create test PR and verify preview URL
- ✅ **Auto-deployment**: Push to main and verify production update
- ✅ **Analytics**: Verify tracking is working

## 📞 Support

### Documentation Resources
- **Fumadocs**: [https://fumadocs.dev/](https://fumadocs.dev/)
- **Vercel Docs**: [https://vercel.com/docs](https://vercel.com/docs)
- **Next.js Docs**: [https://nextjs.org/docs](https://nextjs.org/docs)

### Common Commands
```bash
# Local development
cd docs && yarn dev

# Build and test
cd docs && yarn build

# Deploy preview
cd docs && vercel

# Deploy production
cd docs && vercel --prod

# Check logs
vercel logs [deployment-url]
```

---

## 🚀 **Your Documentation is Now Enterprise-Ready!**

With Vercel deployment, you get:

- ⚡ **Lightning-fast global delivery**
- 🔄 **Automatic deployments on code changes**
- 👀 **Preview deployments for every PR**
- 🌐 **Custom domain support**
- 📊 **Built-in analytics and monitoring**
- 🔒 **HTTPS by default**
- 🎯 **Zero-configuration setup**

Your documentation will automatically stay up-to-date and provide the best possible experience for your users! 🎉
