import { useEffect } from 'react'

export default function TestPage() {
  useEffect(() => {
    // Create a test deployment for the playground
    const testDeployment = {
      id: 'test-deployment-123',
      agentId: '1', // This would be the actual agent ID
      deploymentUrl: '/webpage/test',
      customDomain: undefined,
      config: {
        title: 'Test AI Agent',
        description: 'A test deployment for the playground interface',
        primaryColor: '#3b82f6',
        secondaryColor: '#1e40af',
        logoUrl: '',
        customDomain: '',
        enableChat: true,
        enableAnalytics: false,
        theme: 'light' as const,
        agentId: '1',
        agentTitle: 'Test AI Agent',
        agentDescription: 'This is a test agent for the playground interface'
      },
      createdAt: new Date().toISOString(),
      status: 'deployed' as const
    }

    // Store the test deployment
    const deployments = JSON.parse(localStorage.getItem('deployments') || '[]')
    const existingIndex = deployments.findIndex((d: any) => d.deploymentUrl === '/webpage/test')
    
    if (existingIndex >= 0) {
      deployments[existingIndex] = testDeployment
    } else {
      deployments.push(testDeployment)
    }
    
    localStorage.setItem('deployments', JSON.stringify(deployments))
    
    // Store a placeholder HTML content for the old system
    const testHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Test Agent</title>
        </head>
        <body>
          <h1>Test Agent</h1>
          <p>This is a test deployment.</p>
        </body>
      </html>
    `
    localStorage.setItem('deployment_/webpage/test', testHtml)
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Test Deployment Created</h1>
        <p className="text-gray-600 mb-4">
          A test deployment has been created for the playground interface.
        </p>
        <a 
          href="/webpage/test" 
          className="inline-block bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
        >
          View Playground
        </a>
      </div>
    </div>
  )
} 