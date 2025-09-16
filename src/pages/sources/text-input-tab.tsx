import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"
import { useState } from "react"
import { TagManager } from "./components/tag-manager"
import { useTeamStore } from "@/lib/hooks/useTeam"
import { supabase } from "@/lib/agents/db"
import { useQueryClient } from '@tanstack/react-query'

interface TextInputTabProps {
  onSourcesUpdated: () => void
  onOpenChange: (open: boolean) => void
}

export function TextInputTab({ onSourcesUpdated, onOpenChange }: TextInputTabProps) {
  const queryClient = useQueryClient()
  const [isLoading, setIsLoading] = useState(false)
  const [sourceName, setSourceName] = useState("")
  const [sourceContent, setSourceContent] = useState("")
  const [currentTags, setCurrentTags] = useState<string[]>([])

  const handleAddTag = (tag: string) => {
    setCurrentTags(prev => [...prev, tag])
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setCurrentTags(prev => prev.filter(tag => tag !== tagToRemove))
  }

  const handleSubmit = async () => {
    if (!sourceName.trim() || !sourceContent.trim()) return

    setIsLoading(true)

    try {
      const selectedTeam = useTeamStore.getState().selectedTeam
      if (!selectedTeam) {
        throw new Error('No team selected')
      }

      const tagPromises = currentTags.map(async tagName => {
        const { data: tags } = await supabase
          .from('tags')
          .select('*')
          .eq('name', tagName)
          .maybeSingle()

        if (tags) return tags.id

        const { data: newTag } = await supabase
          .from('tags')
          .insert([{ name: tagName }])
          .select()
          .single()

        return newTag?.id
      })

      await Promise.all(tagPromises)

        await supabase
          .from('sources')
          .insert([{
            name: sourceName.trim(),
            type: 'Text',
            content: sourceContent.trim(),
            tags: currentTags,
            team_id: selectedTeam.id
          }])

      queryClient.invalidateQueries({
        queryKey: ['supabase-table', 'sources'],
        exact: false
      })

      onSourcesUpdated()
      onOpenChange(false)
      
      setSourceName("")
      setSourceContent("")
      setCurrentTags([])
    } catch (error) {
      console.error('Error creating text source:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="source-name" className="text-right">Source Name</Label>
        <Input
          id="source-name"
          value={sourceName}
          onChange={(e) => setSourceName(e.target.value)}
          placeholder="Enter a name for this source"
          className="col-span-3"
          disabled={isLoading}
        />
      </div>

      <div className="grid grid-cols-4 items-start gap-4">
        <Label htmlFor="source-content" className="text-right pt-2">Content</Label>
        <Textarea
          id="source-content"
          value={sourceContent}
          onChange={(e) => setSourceContent(e.target.value)}
          placeholder="Enter the text content for this source..."
          className="col-span-3 min-h-[200px]"
          disabled={isLoading}
        />
      </div>

      <div className="grid grid-cols-4 items-center gap-4">
        <Label className="text-right">Tags</Label>
        <div className="col-span-3">
          <TagManager
            currentTags={currentTags}
            onAddTag={handleAddTag}
            onRemoveTag={handleRemoveTag}
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          onClick={handleSubmit}
          disabled={!sourceName.trim() || !sourceContent.trim() || isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            'Add Source'
          )}
        </Button>
      </div>
    </div>
  )
}
