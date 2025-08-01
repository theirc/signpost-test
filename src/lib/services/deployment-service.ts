import { generateWebpageHTML, generateDeploymentUrl, WebpageConfig, DeploymentInfo } from "./webpage-generator"
import { ulid } from "ulid"

export class DeploymentService {
  static async deployWebpage(config: WebpageConfig): Promise<DeploymentInfo> {
    try {
      console.log('DeploymentService: Config received:', config)
      console.log('DeploymentService: Logo URL:', config.logoUrl)
      // Generate deployment URL
      const deploymentUrl = generateDeploymentUrl(config)
      
      // Generate HTML content
      const htmlContent = generateWebpageHTML(config)
      
      // Create deployment record
      const deploymentId = ulid()
      const deploymentInfo: DeploymentInfo = {
        id: deploymentId,
        agentId: config.agentId,
        deploymentUrl,
        customDomain: config.customDomain,
        config,
        createdAt: new Date().toISOString(),
        status: 'pending'
      }
      
      // In a real implementation, you would:
      // 1. Upload the HTML file to a CDN or hosting service (Vercel, Netlify, etc.)
      // 2. Configure custom domains if provided
      // 3. Set up SSL certificates
      // 4. Configure analytics if enabled
      // 5. Store deployment info in database
      
      // For now, we'll simulate the deployment process
      await this.simulateDeployment(deploymentUrl, htmlContent)
      
      deploymentInfo.status = 'deployed'
      
      // Store deployment info in localStorage for demo purposes
      if (typeof window !== 'undefined') {
        let deployments = JSON.parse(localStorage.getItem('deployments') || '[]')
        
        // Check if a deployment for this agent already exists
        const existingIndex = deployments.findIndex((d: any) => d.agentId === config.agentId)
        
        if (existingIndex !== -1) {
          // Update existing deployment
          deployments[existingIndex] = deploymentInfo
        } else {
          // Add new deployment
          deployments.push(deploymentInfo)
        }
        
        localStorage.setItem('deployments', JSON.stringify(deployments))
      }
      
      return deploymentInfo
    } catch (error) {
      console.error('Deployment failed:', error)
      throw new Error(`Deployment failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
  
  private static async simulateDeployment(url: string, htmlContent: string): Promise<void> {
    // Simulate deployment delay
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // In a real implementation, you would:
    // - Upload the HTML file to your hosting service (Vercel, Netlify, etc.)
    // - Configure the domain
    // - Set up SSL certificates
    // - Configure CDN settings
    
    console.log(`Deploying to: ${url}`)
    console.log('HTML content length:', htmlContent.length)
    
    // For demo purposes, we'll store the HTML in localStorage to simulate deployment
    if (typeof window !== 'undefined') {
      localStorage.setItem(`deployment_${url}`, htmlContent)
    }
  }
  
  static async getDeployments(agentId?: string): Promise<DeploymentInfo[]> {
    // For demo purposes, retrieve from localStorage
    if (typeof window !== 'undefined') {
      const deployments = JSON.parse(localStorage.getItem('deployments') || '[]')
      if (agentId) {
        return deployments.filter((d: DeploymentInfo) => d.agentId === agentId)
      }
      return deployments
    }
    return []
  }
  
  static async deleteDeployment(deploymentId: string): Promise<void> {
    // For demo purposes, remove from localStorage
    if (typeof window !== 'undefined') {
      const deployments = JSON.parse(localStorage.getItem('deployments') || '[]')
      const filtered = deployments.filter((d: DeploymentInfo) => d.id !== deploymentId)
      localStorage.setItem('deployments', JSON.stringify(filtered))
    }
  }
  
  static async getDeploymentHTML(deploymentUrl: string): Promise<string | null> {
    // In a real implementation, this would fetch the HTML from your hosting service
    // For demo purposes, we'll retrieve from localStorage
    if (typeof window !== 'undefined') {
      return localStorage.getItem(`deployment_${deploymentUrl}`)
    }
    return null
  }
} 