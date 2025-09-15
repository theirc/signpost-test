import { Button } from "@/components/ui/button"

interface SourceActionsProps {
  onUploadFiles: () => void
  onAddLiveData: () => void
}

export function SourceActions({ onUploadFiles, onAddLiveData }: SourceActionsProps) {
  return (
    <div className="flex gap-2">
      <Button onClick={onAddLiveData} variant="outline" className="rounded-lg">
        Add Live Data
      </Button>
      <Button onClick={onUploadFiles} className="rounded-lg">
        Add Sources
      </Button>
    </div>
  )
} 