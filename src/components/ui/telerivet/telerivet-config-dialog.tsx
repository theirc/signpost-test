import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { toast } from "sonner"
import { Settings, AlertCircle } from "lucide-react"
import { TelerivetApiKeyInput, TelerivetProjectSelector, TelerivetScriptSection, TELERIVET_SCRIPT_TEMPLATE } from "./index"
import { useTelerivetProjects, TelerivetProject } from "@/hooks/use-telerivet-projects"
import { useTeamStore } from "@/lib/hooks/useTeam"
import { app } from "@/lib/app"


interface TelerivetConfigDialogProps {
  worker: MessageWorker
  onSave: (values: any) => void
}

export function TelerivetConfigDialog({ worker, onSave }: TelerivetConfigDialogProps) {
  const [apiKey, setApiKey] = useState(worker.parameters.telerivetApiKey || "")
  const [selectedProject, setSelectedProject] = useState<TelerivetProject | null>(null)
  
  const { projects, isLoading, error, fetchProjects } = useTelerivetProjects()
  const { selectedTeam } = useTeamStore()
  const agentId = String(app.agent?.id || "")

    const [isConfigSaved, setIsConfigSaved] = useState(false)
  const [isCreatingService, setIsCreatingService] = useState(false)

  const handleSaveConfig = () => {
    if (!selectedProject) return

    // Save the configuration values
    onSave({
      telerivetApiKey: apiKey,
      telerivetProjectId: selectedProject.id,
      defaultRouteId: selectedProject.default_route_id
    })

    setIsConfigSaved(true)
    toast.success(`Configuration saved for project: ${selectedProject.name}`)
  }

  const handleCreateService = async () => {
    if (!selectedProject || !isConfigSaved) return

    setIsCreatingService(true)
    
    try {
      const serviceName = `Signpost AI Service - ${agentId}`
      
      // First check if a service with this name already exists
      const checkResponse = await fetch(`/api/axiosFetch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: `https://api.telerivet.com/v1/projects/${selectedProject.id}/services`,
          method: 'GET',
          headers: {
            'Authorization': `Basic ${btoa(apiKey + ':')}`,
            'Content-Type': 'application/json'
          }
        })
      })

      const existingServices = await checkResponse.json()
      
      // Check if the axiosFetch proxy returned an error
      if (existingServices.status && existingServices.status >= 400) {
        throw new Error(existingServices.data?.error?.message || existingServices.statusText || `HTTP ${existingServices.status}: Failed to check existing services`)
      }

      // Check if a service with the same name already exists
      if (existingServices.data && Array.isArray(existingServices.data)) {
        const duplicateService = existingServices.data.find((service: any) => 
          service.name === serviceName && service.service_type === 'incoming_message_script'
        )
        
        if (duplicateService) {
          toast.error(`Service "${serviceName}" already exists in this project. Please delete it first or use a different name.`)
          return
        }
      }

      // Create the Telerivet service
      const apiKeys = await app.fetchAPIkeys(selectedTeam?.id || "")
      const openaiApiKey = apiKeys.openai || "{{OPENAI_API_KEY}}"

      // Get the script with values replaced
      const scriptWithValues = TELERIVET_SCRIPT_TEMPLATE
        .replace(/\{\{TEAM_ID\}\}/g, selectedTeam?.id || "")
        .replace(/\{\{AGENT_ID\}\}/g, agentId)
        .replace(/\{\{OPENAI_API_KEY\}\}/g, openaiApiKey)

      // Create the service via Telerivet API
      const response = await fetch(`/api/axiosFetch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: `https://api.telerivet.com/v1/projects/${selectedProject.id}/services`,
          method: 'POST',
          headers: {
            'Authorization': `Basic ${btoa(apiKey + ':')}`,
            'Content-Type': 'application/json'
          },
          data: {
            name: serviceName,
            service_type: 'incoming_message_script',
            config: {
              code: scriptWithValues
            },
            active: true,
            message_types: ['text', 'sms', 'mms'],
            contact_number_filter: 'long_number',
            apply_mode: 'unhandled',
            priority: 1
          }
        })
      })

      const result = await response.json()
      
      // Check if the axiosFetch proxy returned an error
      if (result.status && result.status >= 400) {
        throw new Error(result.data?.error?.message || result.statusText || `HTTP ${result.status}: Failed to create service`)
      }
      
      toast.success(`Service "${serviceName}" created successfully for project: ${selectedProject.name}`)
      console.log("Service created:", result)
    } catch (error: any) {
      console.error("Error creating service:", error)
      toast.error(`Failed to create service: ${error.message}`)
    } finally {
      setIsCreatingService(false)
    }
  }

  return (
         <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Configure Telerivet Integration
        </DialogTitle>
        <DialogDescription>
          Set your Telerivet API key and select a project to enable messaging functionality over WhatsApp or SMS. This project needs at least one route to send messages. The integration service may need to be customized if you want to use other messaging channels.
        </DialogDescription>
      </DialogHeader>
      
      <div className="space-y-4">
        {/* API Key Input */}
        <TelerivetApiKeyInput
          apiKey={apiKey}
          onApiKeyChange={setApiKey}
          onTestApiKey={fetchProjects}
          isLoading={isLoading}
        />

        {/* Script Section */}
        <TelerivetScriptSection 
          teamId={useTeamStore().selectedTeam?.id || ""}
          agentId={String(app.agent?.id || "")}
          worker={worker}
        />

        {/* Error Display */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md text-red-800">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Project Selector */}
        <TelerivetProjectSelector
          projects={projects}
          selectedProject={selectedProject}
          onProjectSelect={setSelectedProject}
        />

                 {/* Action Buttons */}
         <div className="space-y-2 pt-2">
           <div className="flex gap-2">
             <Button variant="outline" className="flex-1">
               Cancel
             </Button>
             <Button
               onClick={handleSaveConfig}
               disabled={!selectedProject}
               className="flex-1"
             >
               Save Configuration
             </Button>
           </div>
                       <Button
              onClick={handleCreateService}
              disabled={!selectedProject || !isConfigSaved || isCreatingService}
              className="w-full"
              variant="default"
            >
              {isCreatingService ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating Service...
                </>
              ) : (
                "Create Service"
              )}
            </Button>
                  </div>
       </div>


     </DialogContent>
   )
 } 