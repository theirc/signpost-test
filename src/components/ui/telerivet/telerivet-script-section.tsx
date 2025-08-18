import { Button } from "../button"
import { toast } from "sonner"
import { TELERIVET_SCRIPT_TEMPLATE } from "./telerivet-script-template"
import { app } from "@/lib/app"
import { useTeamStore } from "@/lib/hooks/useTeam"
import { useEffect, useState } from "react"

interface TelerivetScriptSectionProps {
  teamId: string
  agentId: string
  worker: any // Add worker to access Telerivet project ID and API key
}

export function TelerivetScriptSection({ teamId, agentId, worker }: TelerivetScriptSectionProps) {
  const { selectedTeam } = useTeamStore()
  const [openaiApiKey, setOpenaiApiKey] = useState<string>("")

  useEffect(() => {
    async function fetchOpenAIKey() {
      if (selectedTeam?.id) {
        const apiKeys = await app.fetchAPIkeys(selectedTeam.id)
        setOpenaiApiKey(apiKeys.openai || "")
      }
    }
    fetchOpenAIKey()
  }, [selectedTeam?.id])

  const handleCopyScript = async () => {
    try {
      // Replace placeholders with actual values
      const scriptWithValues = TELERIVET_SCRIPT_TEMPLATE
        .replace(/\{\{TEAM_ID\}\}/g, teamId)
        .replace(/\{\{AGENT_ID\}\}/g, agentId)
        .replace(/\{\{OPENAI_API_KEY\}\}/g, openaiApiKey || "{{OPENAI_API_KEY}}") // Use actual key if available, fallback to placeholder
      
      await navigator.clipboard.writeText(scriptWithValues)
      toast.success("Script copied to clipboard!")
    } catch (error) {
      toast.error("Failed to copy script")
    }
  }



  return (
    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
      <div className="text-sm font-medium text-blue-800 mb-2">
        💬 For Conversational Flows (Two-Way Messaging)
      </div>
      <div className="text-xs text-blue-700 space-y-2">
        <p>
          If you're building a conversational flow that needs to receive incoming messages, 
          you'll also need to set up a messaging service in Telerivet.
        </p>
        <div className="flex items-center gap-2">
          <a
            href="https://telerivet.com/dashboard/services"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline flex items-center gap-1 font-medium"
          >
            Configure Services
          </a>
        </div>
        <div className="mt-2 p-2 bg-blue-100 rounded text-xs">
          <p className="font-medium mb-1">Incoming Service Script Template:</p>
          <div className="flex items-center justify-between">
            <span className="text-xs text-blue-600">Click to copy the script</span>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCopyScript}
              className="h-6 px-2 text-xs"
            >
              Copy Script
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
} 