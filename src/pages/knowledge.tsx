import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import React from "react"
import { FilesModal } from "../components/forms/files-modal"
import { LiveDataModal } from "../components/forms/live-data-modal"
import { availableSources, updateAvailableSources } from "../components/forms/files-modal"
import { SourcesTable } from "@/components/sources-table"

interface RAGManagementProps {
  onClose?: () => void
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

type SortConfig = {
  key: string
  direction: 'asc' | 'desc'
}

export function RAGManagement({ onClose }: RAGManagementProps) {
  const [sources, setSources] = React.useState(availableSources)
  const [selectedSources, setSelectedSources] = React.useState<string[]>([])
  const [previewContent, setPreviewContent] = React.useState<{ name: string; content: string } | null>(null)
  const [filesModalOpen, setFilesModalOpen] = React.useState(false)
  const [liveDataModalOpen, setLiveDataModalOpen] = React.useState(false)

  // Keep sources in sync with availableSources and ensure tags are present
  React.useEffect(() => {
    // Map over sources to ensure each has a tags array
    const sourcesWithTags = availableSources.map(source => ({
      ...source,
      tags: source.tags || [] // Ensure tags is at least an empty array
    }))
    setSources(sourcesWithTags)
  }, [filesModalOpen])

  const handleDelete = (id: string) => {
    // Update both local state and availableSources
    const newSources = sources.filter(source => source.id !== id)
    setSources(newSources)
    updateAvailableSources(availableSources.filter(source => source.id !== id))
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

  // Update sources when files modal closes
  const handleFilesModalOpenChange = (open: boolean) => {
    setFilesModalOpen(open)
    if (!open) {
      // Update sources when files modal closes
      setSources(availableSources)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Library</h2>
            <p className="text-muted-foreground">
              Available data sources in your knowledge library.
            </p>
          </div>
        </div>
        
        <div className="space-y-4">
          <SourcesTable 
            sources={sources}
            selectedSources={selectedSources}
            onToggleSelect={handleToggleSelect}
            onSelectAll={handleSelectAll}
            onPreview={(source) => setPreviewContent({ 
              name: source.name,
              content: source.content 
            })}
            onDelete={handleDelete}
            onAddNew={() => {
              setFilesModalOpen(true)
            }}
            onConnectLiveData={() => {
              setLiveDataModalOpen(true)
            }}
            showCheckboxes={true}
            showActions={true}
            showAddButton={true}
          />

          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              {selectedSources.length} sources selected
            </div>
            <div className="space-x-2">
              {onClose && (
                <Button variant="outline" onClick={onClose}>Close</Button>
              )}
              <Button 
                variant="default" 
                disabled={selectedSources.length === 0}
                onClick={() => {
                  // Handle save selected sources
                  console.log('Selected sources:', selectedSources)
                  onClose?.()
                }}
              >
                Save Selection
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content Preview Dialog */}
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

      <FilesModal 
        open={filesModalOpen}
        onOpenChange={handleFilesModalOpenChange}
      />

      <LiveDataModal 
        open={liveDataModalOpen}
        onOpenChange={setLiveDataModalOpen}
      />
    </div>
  )
} 