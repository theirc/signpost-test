import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useTeamStore } from "@/lib/hooks/useTeam"
import { supabase } from "@/lib/agents/db"
import { Edit2, Save, X } from "lucide-react"

interface SourcePreviewProps {
  sourceId: string | null
  onClose: () => void
  onSourceUpdate: () => void
}

interface Source {
  id: string
  name: string
  type: string
  content: string
  tags: string[]
  last_updated: string
  created_at: string
}

interface LiveDataElement {
  id: string
  content: string
  version: string
  status: string
  fetch_timestamp: string
  metadata?: any
}

const addTag = async (name: string): Promise<{
  data: any,
  error: Error | null
}> => {
  try {
    // Check if tag already exists
    const { data: existingTags } = await supabase
      .from('tags')
      .select('*')
      .eq('name', name)

    if (existingTags && existingTags.length > 0) {
      return { data: existingTags[0], error: null }
    }

    // Tag doesn't exist, create it
    const { data, error } = await supabase
      .from('tags')
      .insert([{ name }])
      .select()

    if (error) throw error
    return { data: data?.[0], error: null }
  } catch (error) {
    console.error('Error adding tag:', error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error(String(error))
    }
  }
}

export function SourcePreview({ sourceId, onClose, onSourceUpdate }: SourcePreviewProps) {
  const [source, setSource] = useState<Source | null>(null)
  const [loading, setLoading] = useState(true)
  const [newTag, setNewTag] = useState("")
  const [saving, setSaving] = useState(false)
  const [selectedElement, setSelectedElement] = useState<LiveDataElement | null>(null)
  const [liveDataElements, setLiveDataElements] = useState<LiveDataElement[]>([])
  
  // Editing states
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [isEditingContent, setIsEditingContent] = useState(false)
  const [editingTitle, setEditingTitle] = useState("")
  const [editingContent, setEditingContent] = useState("")

  useEffect(() => {
    if (sourceId) {
      fetchSourceData()
    }
  }, [sourceId])

  const fetchSourceData = async () => {
    if (!sourceId) return

    try {
      setLoading(true)
      const selectedTeam = useTeamStore.getState().selectedTeam
      if (!selectedTeam) {
        throw new Error('No team selected')
      }

      // Fetch basic source data
      const { data: sourceData, error: sourceError } = await supabase
        .from('sources')
        .select('id, name, type, content, tags, created_at, last_updated')
        .eq('id', sourceId)
        .eq('team_id', selectedTeam.id)
        .single()

      if (sourceError) throw sourceError

      // Transform tags
      const tags = typeof sourceData.tags === 'string'
        ? (sourceData.tags as string).replace('{', '').replace('}', '').split(',').filter(tag => tag.length > 0)
        : sourceData.tags || []

      setSource({
        ...sourceData,
        tags
      })

      // If it's a live data source, fetch the elements
      if (sourceData.type === 'web-scraping' || sourceData.type === 'zendesk' || sourceData.type === 'directus' || sourceData.type === 'bot-logs') {
        const { data: elements, error: elementsError } = await supabase
          .from('live_data_elements')
          .select('id, content, version, status, fetch_timestamp, metadata')
          .eq('source_config_id', sourceId)
          .order('fetch_timestamp', { ascending: false })

        if (elementsError) throw elementsError
        setLiveDataElements(elements || [])
      }
    } catch (error) {
      console.error('Error fetching source data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddTag = async () => {
    if (!source || !newTag.trim()) return

    try {
      setSaving(true)
      const { data: tagData, error: tagError } = await addTag(newTag.trim())
      if (tagError) throw tagError

      const updatedTags = [...source.tags, newTag.trim()]
      const { error: updateError } = await supabase.from('sources')
      .update({ tags: updatedTags })
      .eq('id', source.id)
      .select()
      .single()
      if (updateError) throw updateError

      setSource(prev => prev ? { ...prev, tags: updatedTags } : null)
      setNewTag("")
      onSourceUpdate()
    } catch (error) {
      console.error('Error adding tag:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleRemoveTag = async (tagToRemove: string) => {
    if (!source) return

    try {
      setSaving(true)
      const updatedTags = source.tags.filter(tag => tag !== tagToRemove)
      const { error } = await supabase.from('sources')
      .update({ tags: updatedTags })
      .eq('id', source.id)
      .select()
      .single()
      if (error) throw error

      setSource(prev => prev ? { ...prev, tags: updatedTags } : null)
      onSourceUpdate()
    } catch (error) {
      console.error('Error removing tag:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleSaveTitle = async () => {
    if (!source || !editingTitle.trim()) return

    try {
      setSaving(true)
      const { error } = await supabase
        .from('sources')
        .update({ name: editingTitle.trim() })
        .eq('id', source.id)

      if (error) throw error

      setSource(prev => prev ? { ...prev, name: editingTitle.trim() } : null)
      setIsEditingTitle(false)
      onSourceUpdate()
    } catch (error) {
      console.error('Error updating title:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleSaveContent = async () => {
    if (!source) return

    try {
      setSaving(true)
      const { error } = await supabase
        .from('sources')
        .update({ content: editingContent })
        .eq('id', source.id)

      if (error) throw error

      setSource(prev => prev ? { ...prev, content: editingContent } : null)
      setIsEditingContent(false)
      onSourceUpdate()
    } catch (error) {
      console.error('Error updating content:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleCancelTitleEdit = () => {
    setEditingTitle(source?.name || "")
    setIsEditingTitle(false)
  }

  const handleCancelContentEdit = () => {
    setEditingContent(source?.content || "")
    setIsEditingContent(false)
  }

  const startEditingTitle = () => {
    setEditingTitle(source?.name || "")
    setIsEditingTitle(true)
  }

  const startEditingContent = () => {
    setEditingContent(source?.content || "")
    setIsEditingContent(true)
  }

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSaveTitle()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      handleCancelTitleEdit()
    }
  }

  const handleContentKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      handleCancelContentEdit()
    }
  }

  if (!sourceId) return null

  return (
    <Dialog open={!!sourceId} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Source Preview</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center h-32">
            Loading...
          </div>
        ) : source ? (
          <div className="space-y-4">
            <div>
              {isEditingTitle ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    className="flex-1"
                    disabled={saving}
                    onKeyDown={handleTitleKeyDown}
                    autoFocus
                  />
                  <Button
                    size="sm"
                    onClick={handleSaveTitle}
                    disabled={saving}
                    className="h-8"
                  >
                    {saving ? "Saving..." : <Save className="h-3 w-3" />}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCancelTitleEdit}
                    disabled={saving}
                    className="h-8"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold flex-1">{source.name}</h3>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={startEditingTitle}
                    className="h-8 w-8 p-0"
                  >
                    <Edit2 className="h-3 w-3" />
                  </Button>
                </div>
              )}
              <p className="text-sm text-muted-foreground">{source.type}</p>
              {isEditingTitle && (
                <p className="text-xs text-muted-foreground">Editing title...</p>
              )}
            </div>

            <div>
              <h4 className="font-medium mb-2">Tags</h4>
              <div className="flex flex-wrap gap-2 mb-2">
                {source.tags.map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-2 py-1 rounded-full text-sm bg-muted"
                  >
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-2 text-muted-foreground hover:text-foreground"
                      disabled={saving}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Add new tag"
                  disabled={saving}
                />
                <Button onClick={handleAddTag} disabled={saving}>
                  Add
                </Button>
              </div>
            </div>

            {liveDataElements.length > 0 ? (
              <div>
                <h4 className="font-medium mb-2">Live Data Elements</h4>
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {liveDataElements.map(element => (
                    <div
                      key={element.id}
                      className="p-3 border rounded-lg cursor-pointer hover:bg-muted/50"
                      onClick={() => setSelectedElement(element)}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Version {element.version}</span>
                        <span className="text-sm text-muted-foreground">
                          {new Date(element.fetch_timestamp).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        Status: {element.status}
                      </div>
                      {element.metadata?.title && (
                        <div className="text-sm text-muted-foreground mt-1">
                          Title: {element.metadata.title}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">Content</h4>
                  {!isEditingContent && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={startEditingContent}
                      className="h-8 w-8 p-0"
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                  )}
                  {isEditingContent && (
                    <span className="text-sm text-muted-foreground">Editing...</span>
                  )}
                </div>
                {isEditingContent ? (
                  <div className="space-y-2">
                    <Textarea
                      value={editingContent}
                      onChange={(e) => setEditingContent(e.target.value)}
                      className="min-h-[200px]"
                      disabled={saving}
                      onKeyDown={handleContentKeyDown}
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={handleSaveContent}
                        disabled={saving}
                      >
                        {saving ? "Saving..." : (
                          <>
                            <Save className="h-3 w-3 mr-1" />
                            Save
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCancelContentEdit}
                        disabled={saving}
                      >
                        <X className="h-3 w-3 mr-1" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-muted rounded-lg whitespace-pre-wrap max-h-[400px] overflow-auto">
                    {source.content}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center text-muted-foreground">
            Source not found
          </div>
        )}
      </DialogContent>

      {selectedElement && (
        <Dialog open={!!selectedElement} onOpenChange={() => setSelectedElement(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Live Data Element Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium">Version {selectedElement.version}</h4>
                <p className="text-sm text-muted-foreground">
                  Last updated: {new Date(selectedElement.fetch_timestamp).toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">
                  Status: {selectedElement.status}
                </p>
                {selectedElement.metadata?.title && (
                  <p className="text-sm text-muted-foreground">
                    Title: {selectedElement.metadata.title}
                  </p>
                )}
                {selectedElement.metadata?.url && (
                  <p className="text-sm text-muted-foreground">
                    URL: {selectedElement.metadata.url}
                  </p>
                )}
              </div>
              <div className="p-4 bg-muted rounded-lg whitespace-pre-wrap max-h-[400px] overflow-auto">
                {selectedElement.content}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Dialog>
  )
} 