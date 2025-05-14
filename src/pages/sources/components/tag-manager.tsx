import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X } from "lucide-react"
import { useState } from "react"

interface TagManagerProps {
  currentTags: string[]
  onAddTag: (tag: string) => void
  onRemoveTag: (tag: string) => void
}

export function TagManager({ currentTags, onAddTag, onRemoveTag }: TagManagerProps) {
  const [newTag, setNewTag] = useState('')

  const handleAddTag = () => {
    if (newTag.trim() && !currentTags.includes(newTag.trim())) {
      onAddTag(newTag.trim())
      setNewTag('')
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
          placeholder="Add a tag..."
          className="flex-1"
        />
        <Button onClick={handleAddTag}>Add</Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {currentTags.map(tag => (
          <div
            key={tag}
            className="flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-sm"
          >
            {tag}
            <button
              onClick={() => onRemoveTag(tag)}
              className="ml-1 rounded-full hover:bg-secondary-foreground/20"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
} 