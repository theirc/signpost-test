import { Button } from "../button"
import { Input } from "../input"
import { Label } from "../label"
import { ExternalLink } from "lucide-react"

interface TelerivetApiKeyInputProps {
  apiKey: string
  onApiKeyChange: (apiKey: string) => void
  onTestApiKey: (apiKey: string) => void
  isLoading: boolean
}

export function TelerivetApiKeyInput({
  apiKey,
  onApiKeyChange,
  onTestApiKey,
  isLoading
}: TelerivetApiKeyInputProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="api-key">Telerivet API Key</Label>
      <div className="flex gap-2">
        <Input
          id="api-key"
          type="password"
          value={apiKey}
          onChange={(e) => onApiKeyChange(e.target.value)}
          placeholder="Enter your Telerivet API key"
          className="flex-1"
        />
        <Button
          onClick={() => onTestApiKey(apiKey)}
          disabled={!apiKey.trim() || isLoading}
          size="sm"
        >
          {isLoading ? "Loading..." : "Connect"}
        </Button>
      </div>
      
      <div className="text-sm text-gray-600">
        <p>Don't have an API key? Get one from:</p>
        <div className="flex gap-2 mt-1">
          <a
            href="https://telerivet.com/dashboard/api"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline flex items-center gap-1"
          >
            Dashboard <ExternalLink className="h-3 w-3" />
          </a>
          <span>•</span>
          <a
            href="https://telerivet.com/api/rest#authentication"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline flex items-center gap-1"
          >
            Documentation <ExternalLink className="h-3 w-3" />
          </a>
        </div>
        

      </div>
    </div>
  )
} 