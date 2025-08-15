import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import PaginatedSupabaseTableWrapper from "@/components/ui/PaginatedSupabaseTableWrapper"
import { useToast } from "@/hooks/use-toast"
import { useTeamStore } from "@/lib/hooks/useTeam"
import { usePermissions } from "@/lib/hooks/usePermissions"
import { useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/data/db"
import { Plus, Copy, Trash2, ArrowUpDown, LoaderCircle, Sparkles, Save } from "lucide-react"
import { format } from "date-fns"
import { agents } from "@/lib/agents"
import { app } from "@/lib/app"
import { useForceUpdate } from "@/lib/utils"
import { EnhancedDataTable } from "@/components/ui/enhanced-data-table"
import { AgentTemplateGenerator, GeneratedAgentTemplate } from "@/lib/services/agent-template-generator"
import { HighlightText } from "@/components/ui/shadcn-io/highlight-text"

export function AgentList() {
  const navigate = useNavigate()
  const { selectedTeam } = useTeamStore()
  const { toast } = useToast()
  const [agentToDelete, setAgentToDelete] = useState<any | null>(null)
  const [templatePopoverOpen, setTemplatePopoverOpen] = useState(false)
  const [autoGenerationOpen, setAutoGenerationOpen] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [agentDescription, setAgentDescription] = useState("")
  const [generatedTemplate, setGeneratedTemplate] = useState<GeneratedAgentTemplate | null>(null)
  const queryClient = useQueryClient()
  const { canCreate, canDelete } = usePermissions()
  const update = useForceUpdate()

  const columns: ColumnDef<any>[] = [
    { 
      id: "id", 
      accessorKey: "id", 
      header: ({ column, table }) => (
        <Button
          variant="ghost"
          onClick={() => {
            const current = column.getIsSorted();
            let next: 'asc' | 'desc';
            if (current === 'asc') next = 'desc';
            else next = 'asc';
            const meta = table.options.meta as any;
            if (meta?.onSort) meta.onSort('id', next);
          }}
          className="h-auto p-0 font-semibold"
        >
          ID
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      enableResizing: true, 
      enableHiding: true, 
      enableSorting: true 
    },
    { 
      id: "title", 
      accessorKey: "title", 
      header: ({ column, table }) => (
        <Button
          variant="ghost"
          onClick={() => {
            const current = column.getIsSorted();
            let next: 'asc' | 'desc';
            if (current === 'asc') next = 'desc';
            else next = 'asc';
            const meta = table.options.meta as any;
            if (meta?.onSort) meta.onSort('title', next);
          }}
          className="h-auto p-0 font-semibold"
        >
          Title
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      enableResizing: true, 
      enableHiding: true, 
      enableSorting: true 
    },
    { 
      id: "created_at", 
      accessorKey: "created_at", 
      header: ({ column, table }) => (
        <Button
          variant="ghost"
          onClick={() => {
            const current = column.getIsSorted();
            let next: 'asc' | 'desc';
            if (current === 'asc') next = 'desc';
            else next = 'asc';
            const meta = table.options.meta as any;
            if (meta?.onSort) meta.onSort('created_at', next);
          }}
          className="h-auto p-0 font-semibold"
        >
          Created At
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      enableResizing: true, 
      enableHiding: true, 
      enableSorting: true,
      cell: (info) => format(new Date(info.getValue() as string), "MMM dd, yyyy")
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex items-center">
          {canCreate("agents") && <span
            title="Duplicate agent"
            onClick={(e) => {
              e.stopPropagation();
              handleDuplicate(row.original, e);
            }}
            className="cursor-pointer hover:text-blue-600"
          >
            <Copy className="h-4 w-4" />
          </span>}
          {canCreate("templates") && <span
            title="Save as template"
            onClick={(e) => {
              e.stopPropagation();
              handleSaveAsTemplate(row.original, e);
            }}
            className="cursor-pointer hover:text-green-600 ml-6"
          >
            <Save className="h-4 w-4" />
          </span>}
          {canDelete("agents") && <span
            title="Delete agent"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(row.original, e);
            }}
            className="cursor-pointer hover:text-red-600 ml-6"
          >
            <Trash2 className="h-4 w-4" />
          </span>}
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
      size: 80,
      minSize: 60,
      maxSize: 100,
    }
  ]

  function handleRowClick(agentId: string) {
    navigate(`/agent/${agentId}`)
  }

  async function handleDuplicate(agent: any, e: React.MouseEvent) {
    e.stopPropagation()
    const newAgent = { ...agent, title: `${agent.title} (copy)` }
    delete newAgent.id
    const { data, error } = await supabase.from("agents").insert(newAgent).select()
    if (error) {
      console.error('Error duplicating agent:', error)
      toast({
        title: "Error duplicating agent",
        description: error.message,
        variant: "destructive"
      })
    } else {
      queryClient.invalidateQueries({ queryKey: ['supabase-table', 'agents'] })
      toast({
        title: "Agent duplicated",
        description: `A copy of '${agent.title}' was created.`
      })
    }
  }

  function handleDelete(agent: any, e: React.MouseEvent) {
    e.stopPropagation()
    setAgentToDelete(agent)
  }

  async function confirmDelete() {
    if (!agentToDelete) return
    try {
      const { error } = await supabase
        .from('agents')
        .delete()
        .eq('id', agentToDelete.id)
      if (error) throw error
      toast({
        title: 'Agent deleted',
        description: `'${agentToDelete.title}' has been successfully deleted.`,
      })
      queryClient.invalidateQueries({ queryKey: ['supabase-table', 'agents'] })
    } catch (error) {
      console.error('Error deleting agent:', error)
      toast({
        title: "Error deleting agent",
        description: (error as Error)?.message || "Could not delete the agent.",
        variant: "destructive",
      })
    } finally {
      setAgentToDelete(null)
    }
  }

  async function handleSaveAsTemplate(agent: any, e: React.MouseEvent) {
    e.stopPropagation()
    try {
      // Create a template version of the agent (with team_id set to null)
      const templateAgent = {
        ...agent,
        title: `${agent.title} (Template)`,
        team_id: null, // Templates have no team_id
        id: undefined // Remove the id so a new one is generated
      }
      
      const { data, error } = await supabase
        .from("agents")
        .insert(templateAgent)
        .select()
      
      if (error) throw error
      
      toast({
        title: "Agent saved as template",
        description: `'${agent.title}' has been successfully saved as a template.`,
      })
      
      // Invalidate both agents and templates queries
      queryClient.invalidateQueries({ queryKey: ['supabase-table', 'agents'] })
      queryClient.invalidateQueries({ queryKey: ['agents-template'] })
    } catch (error) {
      console.error('Error saving agent as template:', error)
      toast({
        title: "Error saving as template",
        description: (error as Error)?.message || "Could not save the agent as a template.",
        variant: "destructive",
      })
    }
  }

  async function generateAgentTemplate() {
    if (!agentDescription.trim()) {
      toast({
        title: "Description required",
        description: "Please enter a description of the agent you want to create.",
        variant: "destructive"
      })
      return
    }

    setIsGenerating(true)
    try {
      // Get API keys for LLM access
      const apiKeys = await app.fetchAPIkeys(selectedTeam?.id)
      
      // Create template generator
      const generator = new AgentTemplateGenerator(apiKeys)
      
      // Generate the template
      const template = await generator.generateTemplate(agentDescription)
      
      setGeneratedTemplate(template)
      setAutoGenerationOpen(true)
      
      toast({
        title: "Template generated",
        description: "Successfully generated agent template. Review and customize as needed."
      })
    } catch (error) {
      console.error('Error generating template:', error)
      toast({
        title: "Generation failed",
        description: "Could not generate agent template. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsGenerating(false)
    }
  }

  async function saveGeneratedAgent() {
    if (!generatedTemplate) return

    try {
      const newAgent = agents.createAgent({
        title: generatedTemplate.agentName,
        description: generatedTemplate.agentDescription
      })

      // Add the recommended workers and store their IDs for connections
      const workerIdMap: { [key: string]: string } = {}
      
      for (const workerConfig of generatedTemplate.recommendedWorkers) {
        const worker = newAgent.addWorker({
          type: workerConfig.type,
          title: workerConfig.title,
          description: workerConfig.description,
          x: workerConfig.position?.x || 100,
          y: workerConfig.position?.y || 100,
          ...workerConfig.config
        })
        
        // Configure worker-specific fields and parameters
        if (workerConfig.type === "ai") {
          // Configure AI worker fields
          if (workerConfig.config.prompt) {
            const promptField = worker.fields.prompt
            if (promptField) {
              promptField.default = workerConfig.config.prompt
              promptField.value = workerConfig.config.prompt
            }
          }
          if (workerConfig.config.model) {
            worker.parameters.model = workerConfig.config.model
          }
          if (workerConfig.config.temperature !== undefined) {
            worker.parameters.temperature = workerConfig.config.temperature
          }
        } else if (workerConfig.type === "promptAgent") {
          // Configure PromptAgent worker fields
          if (workerConfig.config.instructions) {
            const instructionsField = worker.fields.instructions
            if (instructionsField) {
              instructionsField.default = workerConfig.config.instructions
              instructionsField.value = workerConfig.config.instructions
            }
          }
          if (workerConfig.config.model) {
            worker.parameters.model = workerConfig.config.model
          }
        } else if (workerConfig.type === "api") {
          // Configure API worker fields
          if (workerConfig.config.endpoint) {
            worker.parameters.endpoint = workerConfig.config.endpoint
          }
          if (workerConfig.config.method) {
            worker.parameters.method = workerConfig.config.method
          }
          if (workerConfig.config.authType) {
            worker.parameters.authType = workerConfig.config.authType
          }
          if (workerConfig.config.timeout) {
            worker.parameters.timeout = workerConfig.config.timeout
          }
        } else if (workerConfig.type === "search") {
          // Configure Search worker fields
          if (workerConfig.config.query) {
            const queryField = worker.fields.query
            if (queryField) {
              queryField.default = workerConfig.config.query
              queryField.value = workerConfig.config.query
            }
          }
          if (workerConfig.config.engine) {
            worker.parameters.engine = workerConfig.config.engine
          }
          if (workerConfig.config.maxResults) {
            worker.parameters.maxResults = workerConfig.config.maxResults
          }
        } else if (workerConfig.type === "text") {
          // Configure Text worker fields
          if (workerConfig.config.text) {
            const textField = worker.fields.text
            if (textField) {
              textField.default = workerConfig.config.text
              textField.value = workerConfig.config.text
            }
          }
        } else if (workerConfig.type === "template") {
          // Configure Template worker fields
          if (workerConfig.config.template) {
            const templateField = worker.fields.template
            if (templateField) {
              templateField.default = workerConfig.config.template
              templateField.value = workerConfig.config.template
            }
          }
        }
        
        // Store the worker ID for connection mapping
        // Use the worker title as the key for mapping from suggested connections
        workerIdMap[workerConfig.title] = worker.config.id
        
        console.log(`Created worker: ${workerConfig.title} (${workerConfig.type}) with config:`, workerConfig.config)
      }

      // Add suggested connections
      for (const connection of generatedTemplate.suggestedConnections) {
        const sourceId = workerIdMap[connection.from]
        const targetId = workerIdMap[connection.to]
        
        if (sourceId && targetId) {
          // Create the edge connection
          const edgeId = `edge_${sourceId}_${targetId}`
          newAgent.edges[edgeId] = {
            source: sourceId,
            target: targetId,
            sourceHandle: connection.fromHandle,
            targetHandle: connection.toHandle
          }
          console.log(`Created connection: ${connection.from} → ${connection.to} (${sourceId} → ${targetId})`)
        } else {
          console.warn(`Could not create connection: ${connection.from} → ${connection.to}`, {
            sourceId,
            targetId,
            workerIdMap,
            connection
          })
        }
      }

      console.log(`Created agent with ${Object.keys(newAgent.workers).length} workers and ${Object.keys(newAgent.edges).length} connections`)

      // Update the agent to ensure all configurations are applied
      newAgent.update()

      // Save the agent
      const savedAgent = await agents.saveAgent(newAgent, selectedTeam?.id)
      
      console.log("Saved agent with workers:", Object.keys(savedAgent.workers).map(id => ({
        id,
        type: savedAgent.workers[id].config.type,
        hasPrompt: !!savedAgent.workers[id].fields.prompt?.value,
        hasModel: !!savedAgent.workers[id].parameters.model
      })))
      
      toast({
        title: "Agent created",
        description: `Successfully created '${savedAgent.title}' from template with ${Object.keys(newAgent.edges).length} connections.`
      })

      // Reset all state
      setAutoGenerationOpen(false)
      setGeneratedTemplate(null)
      setAgentDescription("")
      
      // Navigate to the new agent
      navigate(`/agent/${savedAgent.id}`)
    } catch (error) {
      console.error('Error saving generated agent:', error)
      toast({
        title: "Error creating agent",
        description: "Could not save the generated agent. Please try again.",
        variant: "destructive"
      })
    }
  }

  return (
    <>
      <AlertDialog open={!!agentToDelete} onOpenChange={(open) => { if (!open) setAgentToDelete(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Agent?</AlertDialogTitle>
            <AlertDialogDescription>
              {`Are you sure you want to delete '${agentToDelete?.title}'? This action cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setAgentToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={templatePopoverOpen} onOpenChange={setTemplatePopoverOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>From Template</DialogTitle>
            <DialogDescription>
              Select a template to create a new agent from.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <p className="text-sm text-muted-foreground">
              Templates will be available soon.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={autoGenerationOpen} onOpenChange={setAutoGenerationOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-600" />
              Auto-Generate Agent Template
            </DialogTitle>
            <DialogDescription>
              Describe the agent you want to create in natural language, and we'll generate a complete template with workers, prompts, and connections.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {!generatedTemplate ? (
              // Input form for agent description
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-900">
                    Agent Description
                  </label>
                  <Textarea
                    value={agentDescription}
                    onChange={(e) => setAgentDescription(e.target.value)}
                    placeholder="e.g., Create an agent that summarizes long research papers and extracts key findings, or an agent that analyzes customer feedback and categorizes sentiment as positive, negative, or neutral"
                    rows={4}
                    className="w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-600 mt-1">
                    Be specific about what you want the agent to do, what inputs it should handle, and what outputs you expect.
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={generateAgentTemplate}
                    disabled={isGenerating || !agentDescription.trim()}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                  >
                    {isGenerating ? (
                      <>
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                        Generating Template...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        Generate Template
                      </>
                    )}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setAutoGenerationOpen(false)}
                  >
                    Cancel
                  </Button>
                </div>

                {/* Example descriptions */}
                <div className="mt-4">
                  <p className="text-xs font-medium text-gray-700 mb-2">Example descriptions:</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div className="text-xs text-gray-600 p-2 bg-gray-100 rounded cursor-pointer hover:bg-gray-200" 
                         onClick={() => setAgentDescription("Create an agent that analyzes customer feedback and categorizes sentiment as positive, negative, or neutral")}>
                      Customer feedback sentiment analyzer
                    </div>
                    <div className="text-xs text-gray-600 p-2 bg-gray-100 rounded cursor-pointer hover:bg-gray-200"
                         onClick={() => setAgentDescription("Create an agent that summarizes long research papers and extracts key findings and methodology")}>
                      Research paper summarizer
                    </div>
                    <div className="text-xs text-gray-600 p-2 bg-gray-100 rounded cursor-pointer hover:bg-gray-200"
                         onClick={() => setAgentDescription("Create an agent that translates text between multiple languages and maintains context")}>
                      Multi-language translator
                    </div>
                    <div className="text-xs text-gray-600 p-2 bg-gray-100 rounded cursor-pointer hover:bg-gray-200"
                         onClick={() => setAgentDescription("Create an agent that generates creative content like blog posts, social media updates, and marketing copy")}>
                      Creative content generator
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // Template review and editing
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold mb-2 text-gray-900">Agent Name</h3>
                    <Input 
                      value={generatedTemplate.agentName} 
                      onChange={(e) => setGeneratedTemplate({
                        ...generatedTemplate,
                        agentName: e.target.value
                      })}
                      className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-2 text-gray-900">Agent Type</h3>
                    <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded border">
                      Conversational Agent
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2 text-gray-900">Description</h3>
                  <Textarea 
                    value={generatedTemplate.agentDescription}
                    onChange={(e) => setGeneratedTemplate({
                      ...generatedTemplate,
                      agentDescription: e.target.value
                    })}
                    rows={3}
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <h3 className="font-semibold mb-2 text-gray-900">Suggested Prompts</h3>
                  <p className="text-sm text-gray-600 mb-3">These prompts will help guide the agent's behavior:</p>
                  <div className="space-y-3">
                    {generatedTemplate.suggestedPrompts.map((prompt: string, index: number) => (
                      <div key={index} className="relative">
                        <Textarea
                          value={prompt}
                          onChange={(e) => {
                            const newPrompts = [...generatedTemplate.suggestedPrompts]
                            newPrompts[index] = e.target.value
                            setGeneratedTemplate({
                              ...generatedTemplate,
                              suggestedPrompts: newPrompts
                            })
                          }}
                          rows={2}
                          className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                          placeholder="Enter a prompt for the agent..."
                        />
                        <div className="absolute top-2 right-2 text-xs text-gray-400">
                          Prompt {index + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2 text-gray-900">Recommended Workers</h3>
                  <p className="text-sm text-gray-600 mb-3">These workers will be added to your agent:</p>
                  <div className="space-y-3">
                    {generatedTemplate.recommendedWorkers.map((worker: any, index: number) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <Sparkles className="h-4 w-4 text-blue-600" />
                            </div>
                            <div>
                              <span className="font-medium text-gray-900">{worker.title}</span>
                              <div className="text-xs text-gray-500">Type: {worker.type}</div>
                            </div>
                          </div>
                          <div className="text-xs text-gray-400">
                            Position: ({worker.position?.x || 100}, {worker.position?.y || 100})
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{worker.description}</p>
                        {worker.config && Object.keys(worker.config).length > 0 && (
                          <div className="text-xs">
                            <div className="font-medium text-gray-700 mb-1">Configuration:</div>
                            <div className="bg-white p-2 rounded border text-gray-600">
                              {Object.entries(worker.config).map(([key, value]) => (
                                <div key={key} className="flex justify-between">
                                  <span className="font-medium">{key}:</span>
                                  <span className="text-gray-500">{String(value)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {generatedTemplate.suggestedConnections.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2 text-gray-900">Suggested Connections</h3>
                    <p className="text-sm text-gray-600 mb-3">These connections will link the workers together:</p>
                    <div className="space-y-2">
                      {generatedTemplate.suggestedConnections.map((connection: any, index: number) => (
                        <div key={index} className="text-sm bg-blue-50 p-3 rounded border border-blue-200">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span className="font-medium">{connection.from} → {connection.to}</span>
                          </div>
                          <div className="text-gray-600 ml-4">{connection.description}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          {generatedTemplate && (
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button 
                variant="outline" 
                className="rounded-lg"
                onClick={() => {
                  setGeneratedTemplate(null)
                  setAgentDescription("")
                }}
              >
                Start Over
              </Button>
              <Button onClick={saveGeneratedAgent} className="rounded-lg bg-blue-600 hover:bg-blue-700">
                Create Agent
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <div className="flex flex-col h-full">
        <div className="flex-1 p-8 pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-3"><HighlightText text="Agents" className="text-4xl font-bold" /></h1>
              <p className="text-lg text-gray-600 font-medium leading-relaxed">
                Manage your agents and their configurations.
              </p>
            </div>
                          <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="rounded-lg">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Agent
                  </Button>
                </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => navigate('/agent/new')}>
                  New Agent
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTemplatePopoverOpen(true)}>
                  From Template
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setAutoGenerationOpen(true)}>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Auto-Generate
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Auto-Generation Input Section */}
          {/* This section is now moved into the autoGenerationOpen dialog */}

          <PaginatedSupabaseTableWrapper
            table="agents"
            columns={columns}
            tableComponent={EnhancedDataTable}
            filters={{ team_id: selectedTeam?.id }}
            searchKey="title"
            onRowClick={(row) => handleRowClick(row.id)}
            placeholder="No agents found"
            searchPlaceholder="Search agents..."
          />
        </div>
      </div>
    </>
  )
}