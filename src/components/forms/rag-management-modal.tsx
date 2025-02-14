import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import React from "react"

interface RAGManagementModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

// This would come from your backend in reality
const sampleSources = [
  { 
    id: '1', 
    name: 'Help Center Articles', 
    type: 'Zendesk', 
    lastUpdated: '2024-02-20',
    content: `How to Reset Your Password
    1. Click on the "Forgot Password" link
    2. Enter your email address
    3. Check your inbox for reset instructions
    4. Click the reset link and create a new password
    
    Common Account Issues
    - Unable to log in
    - Email verification problems
    - Two-factor authentication setup
    - Account recovery options`
  },
  { 
    id: '2', 
    name: 'Product Documentation', 
    type: 'Files', 
    lastUpdated: '2024-02-19',
    content: `Product Features Overview
    Our platform offers a comprehensive suite of tools:
    - Real-time data processing
    - Advanced analytics dashboard
    - Custom report generation
    - Team collaboration features
    
    System Requirements
    - Minimum 8GB RAM
    - 4-core processor
    - 100GB storage
    - Modern web browser`
  },
  { 
    id: '3', 
    name: 'Service Mapping Points', 
    type: 'Directus', 
    lastUpdated: '2024-02-18',
    content: `API Integration Points
    Base URL: api.example.com/v1
    
    Available Endpoints:
    - /users - User management
    - /data - Data processing
    - /analytics - Analytics services
    - /reports - Report generation
    
    Authentication:
    All requests require Bearer token authentication`
  },
  { 
    id: '5', 
    name: 'Technical Specs', 
    type: 'Files', 
    lastUpdated: '2024-02-16',
    content: `Database Schema
    Tables:
    - users (id, name, email, role)
    - projects (id, name, owner_id, status)
    - tasks (id, project_id, title, due_date)
    
    Performance Metrics:
    - Max concurrent users: 10,000
    - Average response time: <200ms
    - Uptime guarantee: 99.9%`
  },
  { 
    id: '6', 
    name: 'Knowledge Base', 
    type: 'Exa', 
    lastUpdated: '2024-02-15',
    content: `Troubleshooting Guide
    Common Issues:
    1. Connection Timeout
       - Check network connectivity
       - Verify server status
       - Review firewall settings
    
    2. Data Sync Errors
       - Validate data format
       - Check sync logs
       - Confirm API access
    
    3. Performance Issues
       - Monitor system resources
       - Review active processes
       - Check for bottlenecks`
  }
]

export function RAGManagementModal({ open, onOpenChange }: RAGManagementModalProps) {
  const [sources, setSources] = React.useState(sampleSources)
  const [selectedSources, setSelectedSources] = React.useState<string[]>([])
  const [previewContent, setPreviewContent] = React.useState<{ name: string; content: string } | null>(null)

  const handleDelete = (id: string) => {
    setSources(sources.filter(source => source.id !== id))
    setSelectedSources(selectedSources.filter(sourceId => sourceId !== id))
  }

  const handleToggleSelect = (id: string) => {
    setSelectedSources(prev => 
      prev.includes(id) 
        ? prev.filter(sourceId => sourceId !== id)
        : [...prev, id]
    )
  }

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedSources(event.target.checked ? sources.map(source => source.id) : [])
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Library</DialogTitle>
            <DialogDescription>
              Available data sources in your knowledge library.
            </DialogDescription>
          </DialogHeader>
          
          <div className="border rounded-md">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="p-3 text-left font-medium">
                    <input
                      type="checkbox"
                      checked={selectedSources.length === sources.length}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th className="p-3 text-left font-medium">Name</th>
                  <th className="p-3 text-left font-medium">Type</th>
                  <th className="p-3 text-left font-medium">Last Updated</th>
                  <th className="p-3 text-left font-medium">Preview</th>
                  <th className="p-3 text-left font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sources.map((source) => (
                  <tr key={source.id} className="border-b last:border-b-0">
                    <td className="p-3">
                      <input
                        type="checkbox"
                        checked={selectedSources.includes(source.id)}
                        onChange={() => handleToggleSelect(source.id)}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="p-3">{source.name}</td>
                    <td className="p-3">{source.type}</td>
                    <td className="p-3">{source.lastUpdated}</td>
                    <td className="p-3">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setPreviewContent({ 
                          name: source.name,
                          content: source.content 
                        })}
                      >
                        View Content
                      </Button>
                    </td>
                    <td className="p-3">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDelete(source.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-100"
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <DialogFooter className="mt-4">
            <div className="flex justify-between w-full">
              <div className="text-sm text-gray-500">
                {selectedSources.length} sources selected
              </div>
              <div className="space-x-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
                <Button 
                  variant="default" 
                  disabled={selectedSources.length === 0}
                  onClick={() => {
                    // Handle save selected sources
                    console.log('Selected sources:', selectedSources)
                    onOpenChange(false)
                  }}
                >
                  Save Selection
                </Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!previewContent} onOpenChange={() => setPreviewContent(null)}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>{previewContent?.name}</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <div className="bg-muted p-4 rounded-md">
              <pre className="whitespace-pre-wrap text-sm font-mono">
                {previewContent?.content}
              </pre>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewContent(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
} 