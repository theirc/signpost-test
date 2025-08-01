import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2, ExternalLink, Copy } from "lucide-react"
import { DeploymentService } from "@/lib/services/deployment-service"
import { toast } from "sonner"

interface WebpageViewerProps {
  deploymentUrl: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function WebpageViewer({ deploymentUrl, open, onOpenChange }: WebpageViewerProps) {
  const [htmlContent, setHtmlContent] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open && deploymentUrl) {
      loadWebpage()
    }
  }, [open, deploymentUrl])

  const loadWebpage = async () => {
    setLoading(true)
    try {
      const content = await DeploymentService.getDeploymentHTML(deploymentUrl)
      setHtmlContent(content)
    } catch (error) {
      console.error('Failed to load webpage:', error)
      toast.error("Failed to load webpage")
    } finally {
      setLoading(false)
    }
  }

  const copyUrl = () => {
    navigator.clipboard.writeText(deploymentUrl)
    toast.success("URL copied to clipboard")
  }

  const openInNewTab = () => {
    // Use the full URL for opening in new tab
    const fullUrl = window.location.origin + deploymentUrl
    window.open(fullUrl, '_blank')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Webpage Preview</span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={copyUrl}
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy URL
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={openInNewTab}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open in New Tab
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 relative">
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex items-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span>Loading webpage...</span>
              </div>
            </div>
          ) : htmlContent ? (
            <iframe
              srcDoc={htmlContent}
              className="w-full h-full border rounded-lg"
              title="Deployed Webpage"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <p className="text-gray-500 mb-2">Webpage not found</p>
                <p className="text-sm text-gray-400">The deployed webpage content could not be loaded.</p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
} 