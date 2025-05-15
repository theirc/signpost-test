import React, { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Loader2, Edit, Library, X, Check } from "lucide-react"
import { useTeamStore } from "@/lib/hooks/useTeam"
import { supabase } from "@/lib/agents/db"

export interface SystemPrompt {
  id: string
  name: string
  content: string
  created_at: string
  updated_at: string
}

interface SystemPromptSelectorProps {
  initialCombinedPrompt: string | undefined
  onCombinedPromptChange: (combinedText: string | undefined) => void
}

function SystemPromptSelector({ 
  initialCombinedPrompt,
  onCombinedPromptChange
}: SystemPromptSelectorProps) {
  const [isLibraryOpen, setIsLibraryOpen] = useState(false)
  const [systemPrompts, setSystemPrompts] = useState<SystemPrompt[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [newPromptOpen, setNewPromptOpen] = useState(false)
  const [newPromptName, setNewPromptName] = useState("")
  const [newPromptContent, setNewPromptContent] = useState("")
  const [creatingPrompt, setCreatingPrompt] = useState(false)
  const { selectedTeam } = useTeamStore()

  // State for managing selected predefined prompts and custom text
  const [addedPrompts, setAddedPrompts] = useState<SystemPrompt[]>([])
  // Keep track of which prompt IDs have been added to allow for faster lookups
  const [addedPromptIds, setAddedPromptIds] = useState<Set<string>>(new Set())
  const [customText, setCustomText] = useState<string>("")

  // Ref to track if initial setup is done
  const isInitialized = useRef(false)

  // Initialize customText with the initial combined prompt on mount/prop change
  useEffect(() => {
    // If there's an initial combined prompt, we treat it entirely as custom text
    // for the edit case. We don't try to parse it back into library prompts.
    setCustomText(initialCombinedPrompt || "")
    setAddedPrompts([])
    setAddedPromptIds(new Set()) // Clear Set of added IDs
    
    // Reset initialization flag
    isInitialized.current = false
  }, [initialCombinedPrompt])

  // Effect to combine added prompts and custom text, then call the callback
  useEffect(() => {
    // Only proceed if initialization is complete
    if (!isInitialized.current) {
      isInitialized.current = true
      return
    }

    // Combine prompts' content
    const promptsContent = addedPrompts
      .map((p) => p.content)
      .join("\n\n")

    // Combine with custom text
    let finalText = ""
    if (promptsContent && customText.trim()) {
      finalText = promptsContent + "\n\n" + customText
    } else if (promptsContent) {
      finalText = promptsContent
    } else {
      finalText = customText
    }

    // Call the parent's callback with the combined text
    onCombinedPromptChange(finalText || undefined)
  }, [addedPrompts, customText, onCombinedPromptChange])

  // Load system prompts when the library dialog opens
  useEffect(() => {
    if (isLibraryOpen) {
      loadSystemPrompts()
    }
  }, [isLibraryOpen])

  const loadSystemPrompts = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.from('system_prompts').select('*').eq('team_id', selectedTeam.id).order('created_at', { ascending: false })
      if (error) throw error
      setSystemPrompts(data || [])
    } catch (err) {
      console.error("Error loading system prompts:", err)
    } finally {
      setLoading(false)
    }
  }

  const filteredPrompts = searchQuery 
    ? systemPrompts.filter(prompt => 
        prompt.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prompt.content.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : systemPrompts

  // Add a prompt from the library to the addedPrompts state
  const handleAddPrompt = (promptToAdd: SystemPrompt) => {
    // Check if this prompt is already in the addedPromptIds Set (fast lookup)
    if (!addedPromptIds.has(promptToAdd.id)) {
      // Add to both the array and the Set
      setAddedPrompts(prev => [...prev, promptToAdd]);
      setAddedPromptIds(prev => {
        const newSet = new Set(prev);
        newSet.add(promptToAdd.id);
        return newSet;
      });
    } else {
      console.warn(`Prompt "${promptToAdd.name}" with ID ${promptToAdd.id} is already added.`);
    }
  }

  // Remove a prompt from the addedPrompts state
  const handleRemovePrompt = (promptIdToRemove: string) => {
    // Remove from array
    setAddedPrompts(prev => prev.filter(p => p.id !== promptIdToRemove));
    // Remove from Set
    setAddedPromptIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(promptIdToRemove);
      return newSet;
    });
  }

  // Handle creating a new *predefined* prompt
  const handleCreatePrompt = async () => {
    if (!newPromptName.trim() || !newPromptContent.trim()) return
    
    setCreatingPrompt(true)
    try {
      const { data, error } = await supabase.from('system_prompts').insert([{ name: newPromptName, content: newPromptContent, team_id: selectedTeam.id }]).select().single()
      if (error) throw error
      
      if (data) {
        // Refresh the list and close the creation dialog
        await loadSystemPrompts()
        setNewPromptOpen(false)
        setNewPromptName("")
        setNewPromptContent("")
        // Optionally, immediately add the new prompt's content? For now, let user add it manually.
        // handleAddPromptContent(data.content)
      }
    } catch (err) {
      console.error("Error creating system prompt:", err)
      alert("Failed to create system prompt")
    } finally {
      setCreatingPrompt(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Label>System Prompt Components</Label>
        <Button 
          type="button" 
          variant="outline" 
          size="sm" 
          onClick={() => setIsLibraryOpen(true)}
        >
          <Library className="h-4 w-4 mr-2" />
          Add from Library
        </Button>
      </div>
      
      {/* Textarea for additional custom prompt text */}
      <div>
        <Label htmlFor="system-prompt-custom-text" className="text-sm font-medium">
          Custom Prompt Text
        </Label>
        <Textarea
          id="system-prompt-custom-text"
          placeholder="Enter custom prompt text or add from library below..."
          value={customText}
          onChange={(e) => setCustomText(e.target.value)}
          className="min-h-[150px] mt-1" // Increased height from 100px to 150px
        />
      </div>

      {/* Display Added Predefined Prompts */}
      {addedPrompts.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Added Library Prompts:</Label>
          <div className="flex flex-wrap gap-2 p-2 border rounded-md bg-muted/30">
            {addedPrompts.map((prompt) => (
              <Badge key={prompt.id} variant="secondary" className="flex items-center gap-1 pr-1">
                {prompt.name}
                <button 
                  onClick={() => handleRemovePrompt(prompt.id)} 
                  className="rounded-full hover:bg-background focus:outline-none focus:ring-1 focus:ring-ring p-0.5"
                  aria-label={`Remove ${prompt.name}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* System Prompts Library Dialog */}
      <Dialog open={isLibraryOpen} onOpenChange={setIsLibraryOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>System Prompt Library</DialogTitle>
            <DialogDescription>
              Add predefined system prompts. They will be combined with any custom text.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex items-center gap-2 my-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search library..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button onClick={() => setNewPromptOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Library Prompt
            </Button>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-2"> {/* Added pr-2 for scrollbar spacing */}
            {loading ? (
              <div className="flex-1 flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredPrompts.length > 0 ? (
              <div className="grid gap-3">
                {filteredPrompts.map(prompt => {
                  // Use the Set for faster lookups in large collections
                  const isAlreadyAdded = addedPromptIds.has(prompt.id);
                  
                  return (
                    <div 
                      key={prompt.id}
                      className="border rounded-md p-3 flex justify-between items-start gap-2"
                    >
                      <div className="flex-1">
                        <div className="font-medium mb-1">{prompt.name}</div>
                        <div className="text-sm text-muted-foreground line-clamp-3">
                          {prompt.content}
                        </div>
                      </div>
                      <Button
                        variant={isAlreadyAdded ? "outline" : "secondary"}
                        size="sm"
                        onClick={() => {
                          // Extra safety check before adding
                          if (!isAlreadyAdded) {
                            handleAddPrompt(prompt);
                          }
                        }}
                        disabled={isAlreadyAdded}
                        className="shrink-0"
                      >
                        {isAlreadyAdded ? (
                          <span className="flex items-center">
                            <Check className="h-4 w-4 mr-1" />
                            Added
                          </span>
                        ) : (
                          <span className="flex items-center">
                            <Plus className="h-4 w-4 mr-1" />
                            Add
                          </span>
                        )}
                      </Button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                {searchQuery ? "No prompts match your search" : "No system prompts found in library"}
              </div>
            )}
          </div>
          
          <DialogFooter className="mt-4 flex-shrink-0">
            {/* Removed Cancel button, Close button is usually part of DialogContent */}
             <Button variant="outline" onClick={() => setIsLibraryOpen(false)}>
              Close Library
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create New Predefined Prompt Dialog */}
      <Dialog open={newPromptOpen} onOpenChange={setNewPromptOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Create New Library Prompt</DialogTitle>
            <DialogDescription>
              Create a new predefined system prompt for the library.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="prompt-name">Name</Label>
              <Input 
                id="prompt-name"
                placeholder="Enter a name for this library prompt"
                value={newPromptName}
                onChange={(e) => setNewPromptName(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="prompt-content">Content</Label>
              <Textarea // Use Textarea here too
                id="prompt-content"
                className="w-full min-h-[200px] p-3 border rounded-md"
                placeholder="Enter the system prompt content..."
                value={newPromptContent}
                onChange={(e) => setNewPromptContent(e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewPromptOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreatePrompt}
              disabled={!newPromptName.trim() || !newPromptContent.trim() || creatingPrompt}
            >
              {creatingPrompt ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Library Prompt"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Wrap with React.memo to prevent unnecessary re-renders
export default React.memo(SystemPromptSelector); 