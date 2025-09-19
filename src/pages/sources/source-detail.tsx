import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useTeamStore } from "@/lib/hooks/useTeam"
import { supabase } from "@/lib/agents/db"
import { Edit2, Save, X, ArrowLeft } from "lucide-react"

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
    const { data: existingTags } = await supabase
      .from('tags')
      .select('*')
      .eq('name', name)

    if (existingTags && existingTags.length > 0) {
      return { data: existingTags[0], error: null }
    }

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

export function SourceDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [source, setSource] = useState<Source | null>(null)
  const [liveDataElements, setLiveDataElements] = useState<LiveDataElement[]>([])
  
  const [uiState, setUiState] = useState({
    loading: true,
    saving: false,
    newTag: "",
    selectedElement: null as LiveDataElement | null
  })
  
  const [editingStates, setEditingStates] = useState({
    title: { isEditing: false, value: "" },
    content: { isEditing: false, value: "" }
  })

  useEffect(() => {
    if (id) {
      fetchSourceData()
    }
  }, [id])

  const fetchSourceData = async () => {
    if (!id) return

    try {
      setUiState(prev => ({ ...prev, loading: true }))
      const selectedTeam = useTeamStore.getState().selectedTeam
      if (!selectedTeam) {
        throw new Error('No team selected')
      }

      const { data: sourceData, error: sourceError } = await supabase
        .from('sources')
        .select('id, name, type, content, tags, created_at, last_updated')
        .eq('id', id)
        .eq('team_id', selectedTeam.id)
        .single()

      if (sourceError) throw sourceError

      const tags = typeof sourceData.tags === 'string'
        ? (sourceData.tags as string).replace('{', '').replace('}', '').split(',').filter(tag => tag.length > 0)
        : sourceData.tags || []

      setSource({
        ...sourceData,
        tags
      })

      if (sourceData.type === 'web-scraping' || sourceData.type === 'zendesk' || sourceData.type === 'directus' || sourceData.type === 'bot-logs') {
        const { data: elements, error: elementsError } = await supabase
          .from('live_data_elements')
          .select('id, content, version, status, fetch_timestamp, metadata')
          .eq('source_config_id', id)
          .order('fetch_timestamp', { ascending: false })

        if (elementsError) throw elementsError
        setLiveDataElements(elements || [])
      }
    } catch (error) {
      console.error('Error fetching source data:', error)
    } finally {
      setUiState(prev => ({ ...prev, loading: false }))
    }
  }

  const handleAddTag = async () => {
    if (!source || !uiState.newTag.trim()) return

    try {
      setUiState(prev => ({ ...prev, saving: true }))
      const { data: tagData, error: tagError } = await addTag(uiState.newTag.trim())
      if (tagError) throw tagError

      const updatedTags = [...source.tags, uiState.newTag.trim()]
      const { error: updateError } = await supabase.from('sources')
      .update({ tags: updatedTags })
      .eq('id', source.id)
      .select()
      .single()
      if (updateError) throw updateError

      setSource(prev => prev ? { ...prev, tags: updatedTags } : null)
      setUiState(prev => ({ ...prev, newTag: "" }))
    } catch (error) {
      console.error('Error adding tag:', error)
    } finally {
      setUiState(prev => ({ ...prev, saving: false }))
    }
  }

  const handleRemoveTag = async (tagToRemove: string) => {
    if (!source) return

    try {
      setUiState(prev => ({ ...prev, saving: true }))
      const updatedTags = source.tags.filter(tag => tag !== tagToRemove)
      const { error } = await supabase.from('sources')
      .update({ tags: updatedTags })
      .eq('id', source.id)
      .select()
      .single()
      if (error) throw error

      setSource(prev => prev ? { ...prev, tags: updatedTags } : null)
    } catch (error) {
      console.error('Error removing tag:', error)
    } finally {
      setUiState(prev => ({ ...prev, saving: false }))
    }
  }

  const handleSaveTitle = async () => {
    if (!source || !editingStates.title.value.trim()) return

    try {
      setUiState(prev => ({ ...prev, saving: true }))
      const { error } = await supabase
        .from('sources')
        .update({ name: editingStates.title.value.trim() })
        .eq('id', source.id)

      if (error) throw error

      setSource(prev => prev ? { ...prev, name: editingStates.title.value.trim() } : null)
      setEditingStates(prev => ({ ...prev, title: { isEditing: false, value: "" } }))
    } catch (error) {
      console.error('Error updating title:', error)
    } finally {
      setUiState(prev => ({ ...prev, saving: false }))
    }
  }

  const handleSaveContent = async () => {
    if (!source) return

    try {
      setUiState(prev => ({ ...prev, saving: true }))
      const { error } = await supabase
        .from('sources')
        .update({ 
          content: editingStates.content.value,
          vector: null
        })
        .eq('id', source.id)

      if (error) throw error

      setSource(prev => prev ? { ...prev, content: editingStates.content.value } : null)
      setEditingStates(prev => ({ ...prev, content: { isEditing: false, value: "" } }))
    } catch (error) {
      console.error('Error updating content:', error)
    } finally {
      setUiState(prev => ({ ...prev, saving: false }))
    }
  }

  const handleCancelTitleEdit = () => {
    setEditingStates(prev => ({ 
      ...prev, 
      title: { isEditing: false, value: source?.name || "" } 
    }))
  }

  const handleCancelContentEdit = () => {
    setEditingStates(prev => ({ 
      ...prev, 
      content: { isEditing: false, value: source?.content || "" } 
    }))
  }

  const startEditingTitle = () => {
    setEditingStates(prev => ({ 
      ...prev, 
      title: { isEditing: true, value: source?.name || "" } 
    }))
  }

  const startEditingContent = () => {
    setEditingStates(prev => ({ 
      ...prev, 
      content: { isEditing: true, value: source?.content || "" } 
    }))
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

  if (!id) {
    navigate('/sources')
    return null
  }

  return (
    <div className="flex-1 p-8 pt-6 flex flex-col h-full">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/sources')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Sources
        </Button>
      </div>

      {uiState.loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            <span className="text-muted-foreground">Loading source...</span>
          </div>
        </div>
      ) : source ? (
        <div className="space-y-6 flex-1 overflow-y-auto">
          <div className="bg-gradient-to-br from-muted/20 to-muted/40 rounded-xl p-6 border">
            {editingStates.title.isEditing ? (
              <div className="flex items-center gap-2">
                <Input
                  value={editingStates.title.value}
                  onChange={(e) => setEditingStates(prev => ({ 
                    ...prev, 
                    title: { ...prev.title, value: e.target.value } 
                  }))}
                  className="flex-1"
                  disabled={uiState.saving}
                  onKeyDown={handleTitleKeyDown}
                  autoFocus
                />
                <Button
                  size="sm"
                  onClick={handleSaveTitle}
                  disabled={uiState.saving}
                  className="h-8"
                >
                  {uiState.saving ? "Saving..." : <Save className="h-3 w-3" />}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCancelTitleEdit}
                  disabled={uiState.saving}
                  className="h-8"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-2xl flex-1">{source.name}</h1>
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
            <p className="text-sm text-muted-foreground mt-1">{source.type}</p>
            {editingStates.title.isEditing && (
              <p className="text-xs text-muted-foreground mt-2">Editing title...</p>
            )}
          </div>

          <div className="bg-gradient-to-br from-muted/20 to-muted/40 rounded-xl p-6 border">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <h4 className="font-semibold text-foreground">Tags</h4>
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              {source.tags.map(tag => (
                <span
                  key={tag}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-background/80 border border-border hover:bg-background transition-colors"
                >
                  {tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-2 text-muted-foreground hover:text-foreground transition-colors"
                      disabled={uiState.saving}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={uiState.newTag}
                onChange={(e) => setUiState(prev => ({ ...prev, newTag: e.target.value }))}
                placeholder="Add new tag"
                disabled={uiState.saving}
                className="flex-1"
              />
              <Button onClick={handleAddTag} disabled={uiState.saving} size="sm">
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
                      onClick={() => setUiState(prev => ({ ...prev, selectedElement: element }))}
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
            <div className="bg-gradient-to-br from-muted/20 to-muted/40 rounded-xl p-6 border">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <h4 className="font-semibold text-foreground">Content</h4>
                {!editingStates.content.isEditing && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={startEditingContent}
                    className="h-8 w-8 p-0 ml-auto"
                  >
                    <Edit2 className="h-3 w-3" />
                  </Button>
                )}
                {editingStates.content.isEditing && (
                  <span className="text-sm text-muted-foreground ml-auto">Editing...</span>
                )}
              </div>
              
              {(() => {
                const imageUrlMatch = source.content.match(/Image URL: (https?:\/\/[^\s\n]+)/)
                if (imageUrlMatch) {
                  const imageUrl = imageUrlMatch[1]
                  const textContent = source.content.replace(/Image URL: https?:\/\/[^\s\n]+\n\nVision Analysis:\n/, '')
                  return (
                    <div className="space-y-6">
                      <div className="bg-gradient-to-br from-muted/30 to-muted/50 rounded-xl p-6 border">
                        <h5 className="font-semibold mb-4 text-center text-foreground">Image Preview</h5>
                        <div className="flex justify-center mb-4">
                          <div className="relative max-w-md max-h-80 overflow-hidden rounded-lg border-2 border-border shadow-lg">
                            <img 
                              src={imageUrl} 
                              alt={source.name}
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                console.error('Failed to load image:', imageUrl)
                                e.currentTarget.style.display = 'none'
                              }}
                            />
                          </div>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground break-all bg-background/50 rounded px-2 py-1">
                            {imageUrl}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                }
                return null
              })()}
              
              {editingStates.content.isEditing ? (
                <div className="space-y-4">
                  <Textarea
                    value={editingStates.content.value}
                    onChange={(e) => setEditingStates(prev => ({ 
                      ...prev, 
                      content: { ...prev.content, value: e.target.value } 
                    }))}
                    className="min-h-[500px] bg-background/80 border border-border"
                    disabled={uiState.saving}
                    onKeyDown={handleContentKeyDown}
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleSaveContent}
                      disabled={uiState.saving}
                    >
                      {uiState.saving ? "Saving..." : (
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
                      disabled={uiState.saving}
                    >
                      <X className="h-3 w-3 mr-1" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="p-6 bg-background/80 border border-border rounded-lg whitespace-pre-wrap min-h-[500px] max-h-[700px] overflow-auto">
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

      {uiState.selectedElement && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg p-6 max-w-3xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Live Data Element Details</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setUiState(prev => ({ ...prev, selectedElement: null }))}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium">Version {uiState.selectedElement.version}</h4>
                <p className="text-sm text-muted-foreground">
                  Last updated: {new Date(uiState.selectedElement.fetch_timestamp).toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">
                  Status: {uiState.selectedElement.status}
                </p>
                {uiState.selectedElement.metadata?.title && (
                  <p className="text-sm text-muted-foreground">
                    Title: {uiState.selectedElement.metadata.title}
                  </p>
                )}
                {uiState.selectedElement.metadata?.url && (
                  <p className="text-sm text-muted-foreground">
                    URL: {uiState.selectedElement.metadata.url}
                  </p>
                )}
              </div>
              <div className="p-6 bg-background/80 border border-border rounded-lg whitespace-pre-wrap min-h-[500px] max-h-[700px] overflow-auto">
                {uiState.selectedElement.content}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
