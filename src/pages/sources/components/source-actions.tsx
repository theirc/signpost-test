import { Button } from "@/components/ui/button"

interface SourceActionsProps {
  onUploadFiles: () => void
  onAddLiveData: () => void
}

export function SourceActions({ onUploadFiles, onAddLiveData }: SourceActionsProps) {
  return (
    <div className="flex gap-2">
      <Button onClick={onAddLiveData} variant="outline">
        Add Live Data
      </Button>
      <Button onClick={onUploadFiles}>
        Upload Files
      </Button>
    </div>
  )
} 