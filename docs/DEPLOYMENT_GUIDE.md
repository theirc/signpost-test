# 🚀 Documentation Deployment Guide

Step-by-step guide to set up automatic documentation updates for the Signpost AI repository.

## Prerequisites
- Admin access to the Signpost AI GitHub repository
- OpenAI API key for documentation generation
- Basic knowledge of GitHub Actions and repository settings

## Step 1: Repository Secrets Configuration

### 1.1 Access Repository Settings
1. Go to your Signpost AI repository on GitHub
2. Click **Settings** tab
3. Navigate to **Secrets and variables** > **Actions**

### 1.2 Add Required Secrets
Add the following repository secrets:

**`OPENAI_API_KEY`**
- Click **New repository secret**
- Name: `OPENAI_API_KEY`
- Value: Your OpenAI API key (starts with `sk-`)
- Click **Add secret**

## Step 2: Enable GitHub Pages

### 2.1 Configure Pages Settings
1. In repository **Settings**, navigate to **Pages**
2. Under **Source**, select **GitHub Actions**
3. (Optional) Configure custom domain if desired
4. Click **Save**

### 2.2 Update Repository Permissions
1. Go to **Settings** > **Actions** > **General**
2. Under **Workflow permissions**, select:
   - ✅ **Read and write permissions**
   - ✅ **Allow GitHub Actions to create and approve pull requests**
3. Click **Save**

## Step 3: Deploy Workflow File

The workflow file `.github/workflows/docs-update.yml` is already included in your repository. This workflow will:

- ✅ Trigger on pushes to main branch
- ✅ Generate updated documentation using AI
- ✅ Build the documentation site
- ✅ Deploy to GitHub Pages
- ✅ Add preview comments to pull requests

## Step 4: First Deployment

### 4.1 Trigger Initial Build
1. Push the updated code to your main branch:
```bash
git add .
git commit -m "docs: Add automated documentation system"
git push origin main
```

2. Monitor the deployment:
   - Go to **Actions** tab in your repository
   - Watch the "Update Documentation" workflow run
   - Check for any errors in the workflow logs

### 4.2 Verify Deployment
1. Once the workflow completes successfully
2. Your documentation will be available at:
   - Default: `https://[username].github.io/[repository-name]`
   - Custom domain (if configured): `https://docs.signpost-ai.com`

## Step 5: Verification and Testing

### 5.1 Test Documentation Generation
1. Make a small change to a worker file in your main codebase
2. Commit and push to main branch
3. Verify the documentation updates automatically
4. Check that AI-generated content reflects your changes

### 5.2 Test Pull Request Previews
1. Create a pull request with documentation changes
2. Verify the workflow runs successfully
3. Check that a comment is added with preview information

## Step 6: Optional Configurations

### 6.1 Custom Domain Setup
If you want to use a custom domain (e.g., `docs.signpost-ai.com`):

1. **DNS Configuration**:
   - Add a CNAME record: `docs.signpost-ai.com` → `[username].github.io`

2. **GitHub Pages Settings**:
   - In repository **Settings** > **Pages**
   - Under **Custom domain**, enter: `docs.signpost-ai.com`
   - Click **Save**

3. **Update Workflow** (if needed):
   - Edit `.github/workflows/docs-update.yml`
   - Add `cname: docs.signpost-ai.com` under the deploy step

### 6.2 Notification Setup
To get notified of deployment status:

1. **Slack Integration**:
   - Add Slack webhook URL as repository secret: `SLACK_WEBHOOK_URL`
   - Update workflow to include Slack notifications

2. **Email Notifications**:
   - Go to repository **Settings** > **Notifications**
   - Configure email preferences for Actions

## Step 7: Monitoring and Maintenance

### 7.1 Regular Checks
- **Weekly**: Review GitHub Actions logs for any failures
- **Monthly**: Verify documentation accuracy and completeness
- **Quarterly**: Update dependencies and review workflow efficiency

### 7.2 Troubleshooting Common Issues

**"OpenAI API key not available" Warning**
- Verify the `OPENAI_API_KEY` secret is correctly set
- Check API key validity and quotas
- Ensure the key has appropriate permissions

**Build Failures**
- Check GitHub Actions logs for detailed error messages
- Verify all dependencies are correctly specified
- Ensure Node.js and Python versions are compatible

**Deployment Failures**
- Verify GitHub Pages is enabled and configured correctly
- Check repository permissions allow Actions to deploy
- Review workflow file for syntax errors

**Documentation Not Updating**
- Ensure changes are pushed to the main branch
- Verify the workflow is triggered (check Actions tab)
- Check if AI generation is working correctly

## Step 8: Advanced Features

### 8.1 Multiple Environment Deployment
For staging and production environments:

1. Create separate workflows for different branches
2. Use environment-specific secrets and configurations
3. Set up branch protection rules

### 8.2 Custom AI Prompts
To customize documentation generation:

1. Update `scripts/generate_docs.py` with custom prompts
2. Add organization-specific context and guidelines
3. Test changes in a development branch first

### 8.3 Analytics Integration
To track documentation usage:

1. Add Google Analytics or similar to the documentation site
2. Monitor user engagement and popular sections
3. Use insights to improve documentation quality

## 🎉 Success!

Your automated documentation system is now live! 

**What happens next:**
- ✅ Documentation automatically updates when you merge code
- ✅ Team members can contribute to docs through normal PR process  
- ✅ AI ensures consistency and completeness
- ✅ Users always have access to up-to-date documentation

**Access your documentation at:**
- 🌐 **Live Site**: Your GitHub Pages URL
- 📝 **Source**: `docs/` directory in your repository
- 🔧 **Management**: GitHub Actions for automation

## 📞 Support

If you encounter any issues:
1. Check the GitHub Actions logs for detailed error information
2. Verify all secrets and permissions are correctly configured
3. Review this guide for common troubleshooting steps
4. Contact the development team for system-specific assistance

---

**🎯 Your documentation is now automated and always up-to-date!**
