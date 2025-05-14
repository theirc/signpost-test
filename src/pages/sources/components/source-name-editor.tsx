import { Input } from "@/components/ui/input"
import { ParsedFile } from "@/lib/fileUtilities/use-file-parser"

interface SourceNameEditorProps {
  sources: ParsedFile[]
  sourceNames: Record<string, string>
  onNameChange: (id: string, name: string) => void
}

export function SourceNameEditor({ sources, sourceNames, onNameChange }: SourceNameEditorProps) {
  return (
    <div className="space-y-2">
      {sources.map(source => (
        <div key={source.id} className="flex items-center gap-2">
          <Input
            value={sourceNames[source.id] || source.name}
            onChange={(e) => onNameChange(source.id, e.target.value)}
            className="flex-1"
          />
        </div>
      ))}
    </div>
  )
} 