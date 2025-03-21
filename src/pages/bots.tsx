import { Log, LogsTable } from "@/components/logs-table"
import React, { useState, useEffect, useCallback } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, RefreshCcw, MoreHorizontal, Pencil, Trash, Search, ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ChevronUp } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useBots, Bot } from "@/hooks/use-bots"
import { useModels, Model } from "@/hooks/use-models"
import { useCollections, Collection } from "@/hooks/use-collections"
import { useSupabase } from "@/hooks/use-supabase"
import { Checkbox } from "@/components/ui/checkbox"
import { SourcesTable, type Source as SourceDisplay } from "@/components/sources-table"
import { useSources } from "@/hooks/use-sources"
import { useSourceDisplay } from "@/hooks/use-source-display"
import { useSystemPrompts } from "@/hooks/use-system-prompts"

export function BotManagement() {
    const { bots, loading: botsLoading, addBot, deleteBot, fetchBots, updateBot } = useBots()
    const { models, loading: modelsLoading } = useModels()
    const { collections, loading: collectionsLoading } = useCollections()
    const { sources, loading: sourcesLoading } = useSources()
    const { sourcesDisplay } = useSourceDisplay(sources, sourcesLoading)
    const supabase = useSupabase()
    const { fetchPrompts } = useSystemPrompts()
    
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedBots, setSelectedBots] = useState<string[]>([])
    const [currentPage, setCurrentPage] = useState(1)
    const [rowsPerPage, setRowsPerPage] = useState(10)
    const [sortField, setSortField] = useState<string>("date_created")
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
    
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [newBot, setNewBot] = useState<Partial<Bot>>({})
    const [editingBot, setEditingBot] = useState<Bot | null>(null)
    const [loading, setLoading] = useState(false)
    const [selectedSources, setSelectedSources] = useState<string[]>([])
    const [showSystemPrompts, setShowSystemPrompts] = useState(false)
    const [systemPrompts, setSystemPrompts] = useState([])
    const [selectedPrompt, setSelectedPrompt] = useState(null)
    const [isPromptDialogOpen, setIsPromptDialogOpen] = useState(false)
    const [promptSearchQuery, setPromptSearchQuery] = useState("")
    const [promptCurrentPage, setPromptCurrentPage] = useState(1)
    const [promptRowsPerPage, setPromptRowsPerPage] = useState(10)
    const [availablePrompts, setAvailablePrompts] = useState([])

    // Real-time subscription to bots
    useEffect(() => {
        // Subscribe to changes in the bots table
        const channel = supabase
            .channel('bots-changes')
            .on('postgres_changes', 
                { event: '*', schema: 'public', table: 'bots' }, 
                payload => {
                    console.log('Real-time update received:', payload);
                    // Refresh bots when changes occur
                    fetchBots();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [supabase, fetchBots]);

    // Load system prompts on mount
    useEffect(() => {
        const loadSystemPrompts = async () => {
            const prompts = await fetchPrompts()
            setAvailablePrompts(prompts)
        }
        loadSystemPrompts()
    }, [fetchPrompts])

    const handleRefresh = () => {
        fetchBots();
    };

    const handleDelete = async (id: string) => {
        setLoading(true);
        try {
            await deleteBot(id);
        } catch (error) {
            console.error('Error deleting bot:', error);
        } finally {
            setLoading(false);
        }
    }

    const handleAddBot = async () => {
        if (newBot.name && newBot.model) {
            setLoading(true);
            try {
                await addBot({
                    name: newBot.name,
                    model: newBot.model,
                    knowledge_collections: newBot.knowledge_collections,
                    knowledge_sources: selectedSources,
                    system_prompt: newBot.system_prompt,
                    temperature: newBot.temperature || 0.7
                });
                setNewBot({});
                setSelectedSources([]);
                setIsAddDialogOpen(false);
            } catch (error) {
                console.error('Error adding bot:', error);
            } finally {
                setLoading(false);
            }
        }
    }

    const handleEditBot = async () => {
        if (editingBot && editingBot.name && editingBot.model) {
            setLoading(true);
            try {
                await updateBot(editingBot.id, {
                    name: editingBot.name,
                    model: editingBot.model,
                    knowledge_collections: editingBot.knowledge_collections,
                    knowledge_sources: selectedSources,
                    system_prompt: editingBot.system_prompt,
                    temperature: editingBot.temperature
                });
                setEditingBot(null);
                setSelectedSources([]);
                setIsEditDialogOpen(false);
            } catch (error) {
                console.error('Error updating bot:', error);
            } finally {
                setLoading(false);
            }
        }
    }

    const startEdit = (bot: Bot) => {
        setEditingBot(bot);
        setIsEditDialogOpen(true);
    }

    // Helper function to get collection name
    const getCollectionName = (collectionId: string | undefined) => {
        if (!collectionId) return 'None';
        const collection = collections.find(c => c.id === collectionId);
        return collection ? collection.name : 'Unknown';
    }

    // Helper function to get model name
    const getModelName = (modelId: string) => {
        const model = models.find(m => m.id === modelId || m.model_id === modelId);
        return model ? model.name : modelId;
    }

    const filteredBots = bots.filter(bot => 
        bot.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const pageCount = Math.ceil(filteredBots.length / rowsPerPage)
    const startIndex = (currentPage - 1) * rowsPerPage
    const endIndex = startIndex + rowsPerPage
    const currentBots = filteredBots.slice(startIndex, endIndex)

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedBots(currentBots.map(bot => bot.id))
        } else {
            setSelectedBots([])
        }
    }

    const handleSelectBot = (botId: string, checked: boolean) => {
        if (checked) {
            setSelectedBots([...selectedBots, botId])
        } else {
            setSelectedBots(selectedBots.filter(id => id !== botId))
        }
    }

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 space-y-4 p-8 pt-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold tracking-tight">Bots</h1>
                    <div className="flex space-x-2">
                        <Button variant="outline" onClick={handleRefresh}>
                            <RefreshCcw className="h-4 w-4 mr-2" />
                            Refresh
                        </Button>
                        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                            <DialogTrigger asChild>
                                <Button variant="gradient" onClick={() => setIsAddDialogOpen(true)}>Create a Bot</Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
                                <DialogHeader>
                                    <DialogTitle>Bots</DialogTitle>
                                    <DialogDescription>
                                        Create tailored AI models to perform specific tasks.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="flex-1 overflow-y-auto py-4">
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="name">Name</Label>
                                            <Input
                                                id="name"
                                                placeholder="Enter bot name"
                                                value={newBot.name || ''}
                                                onChange={(e) => setNewBot({ ...newBot, name: e.target.value })}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="model">Language Model</Label>
                                            <select
                                                id="model"
                                                className="w-full p-2 border rounded-md"
                                                value={newBot.model || ''}
                                                onChange={(e) => setNewBot({ ...newBot, model: e.target.value })}
                                            >
                                                <option value="">Select a model</option>
                                                {modelsLoading ? (
                                                    <option value="" disabled>Loading models...</option>
                                                ) : (
                                                    models.map((model) => (
                                                        <option key={model.id} value={model.id}>
                                                            {model.name} ({model.provider})
                                                        </option>
                                                    ))
                                                )}
                                            </select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="knowledge-collections">Knowledge Collections</Label>
                                            <div className="border rounded-md p-2">
                                                <div className="flex flex-wrap gap-2 mb-2">
                                                    {(newBot.knowledge_collections || []).map(collectionId => {
                                                        const collection = collections.find(c => c.id === collectionId);
                                                        return collection ? (
                                                            <div key={collection.id} className="flex items-center bg-secondary text-secondary-foreground px-2 py-1 rounded-md text-sm">
                                                                {collection.name}
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-4 w-4 p-0 ml-2 hover:bg-secondary/80"
                                                                    onClick={() => setNewBot({
                                                                        ...newBot,
                                                                        knowledge_collections: newBot.knowledge_collections?.filter(id => id !== collection.id)
                                                                    })}
                                                                >
                                                                    ×
                                                                </Button>
                                                            </div>
                                                        ) : null;
                                                    })}
                                                </div>
                                                <select
                                                    id="knowledge-collections"
                                                    className="w-full p-2 border rounded-md"
                                                    value=""
                                                    onChange={(e) => {
                                                        const value = e.target.value;
                                                        if (value) {
                                                            setNewBot({
                                                                ...newBot,
                                                                knowledge_collections: [...(newBot.knowledge_collections || []), value]
                                                            });
                                                        }
                                                    }}
                                                >
                                                    <option value="">Add a collection...</option>
                                                    {collectionsLoading ? (
                                                        <option value="" disabled>Loading collections...</option>
                                                    ) : (
                                                        collections
                                                            .filter(collection => !(newBot.knowledge_collections || []).includes(collection.id))
                                                            .map((collection) => (
                                                                <option key={collection.id} value={collection.id}>
                                                                    {collection.name}
                                                                </option>
                                                            ))
                                                    )}
                                                </select>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="knowledge-sources">Knowledge Sources</Label>
                                            <div className="border rounded-md">
                                                {sourcesLoading ? (
                                                    <div className="flex justify-center items-center p-8">
                                                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                                    </div>
                                                ) : (
                                                    <SourcesTable 
                                                        sources={sourcesDisplay}
                                                        selectedSources={selectedSources}
                                                        onToggleSelect={(id) => {
                                                            setSelectedSources(prev => 
                                                                prev.includes(id) 
                                                                    ? prev.filter(sourceId => sourceId !== id)
                                                                    : [...prev, id]
                                                            );
                                                        }}
                                                        onSelectAll={(e) => {
                                                            if (e.target.checked) {
                                                                setSelectedSources(sourcesDisplay.map(source => source.id));
                                                            } else {
                                                                setSelectedSources([]);
                                                            }
                                                        }}
                                                        showCheckboxes={true}
                                                        showActions={false}
                                                        showAddButton={false}
                                                    />
                                                )}
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="system-prompt">System Prompt</Label>
                                            <div className="border rounded-md">
                                                {availablePrompts.length === 0 ? (
                                                    <div className="flex justify-center items-center p-8">
                                                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                                    </div>
                                                ) : (
                                                    <Table>
                                                        <TableHeader>
                                                            <TableRow>
                                                                <TableHead className="w-12">
                                                                    <Checkbox 
                                                                        checked={newBot.system_prompt !== undefined}
                                                                        onCheckedChange={() => setNewBot({ ...newBot, system_prompt: undefined })}
                                                                    />
                                                                </TableHead>
                                                                <TableHead>Name</TableHead>
                                                                <TableHead>Version</TableHead>
                                                                <TableHead>Language</TableHead>
                                                                <TableHead>Last Modified</TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {availablePrompts.map((prompt) => (
                                                                <TableRow key={prompt.id}>
                                                                    <TableCell>
                                                                        <Checkbox 
                                                                            checked={newBot.system_prompt === prompt.content}
                                                                            onCheckedChange={(checked) => {
                                                                                if (checked) {
                                                                                    setNewBot({ 
                                                                                        ...newBot, 
                                                                                        system_prompt: prompt.content 
                                                                                    })
                                                                                } else {
                                                                                    setNewBot({ 
                                                                                        ...newBot, 
                                                                                        system_prompt: undefined 
                                                                                    })
                                                                                }
                                                                            }}
                                                                        />
                                                                    </TableCell>
                                                                    <TableCell>{prompt.name}</TableCell>
                                                                    <TableCell>v{prompt.version}</TableCell>
                                                                    <TableCell>{prompt.language}</TableCell>
                                                                    <TableCell>{new Date(prompt.updated_at).toLocaleString()}</TableCell>
                                                                </TableRow>
                                                            ))}
                                                        </TableBody>
                                                    </Table>
                                                )}
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="temperature">
                                                Temperature ({newBot.temperature || 0.7})
                                            </Label>
                                            <input
                                                id="temperature"
                                                type="range"
                                                min="0"
                                                max="1"
                                                step="0.1"
                                                value={newBot.temperature || 0.7}
                                                onChange={(e) => setNewBot({ ...newBot, temperature: parseFloat(e.target.value) })}
                                                className="w-full"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <DialogFooter className="flex-shrink-0">
                                    <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                                        Cancel
                                    </Button>
                                    <Button 
                                        onClick={handleAddBot}
                                        disabled={!newBot.name || !newBot.model || loading}
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Creating...
                                            </>
                                        ) : 'Create Bot'}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center space-x-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                            <Input
                                placeholder="Search Bot"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline">
                                    Bot Name
                                    <ChevronDown className="ml-2 h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuItem>Sort A-Z</DropdownMenuItem>
                                <DropdownMenuItem>Sort Z-A</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline">
                                    Average Speed
                                    <ChevronDown className="ml-2 h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuItem>Fastest First</DropdownMenuItem>
                                <DropdownMenuItem>Slowest First</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    {botsLoading ? (
                        <div className="w-full h-64 flex items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                    ) : (
                        <div>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-12">
                                            <Checkbox 
                                                checked={selectedBots.length === currentBots.length}
                                                onCheckedChange={handleSelectAll}
                                            />
                                        </TableHead>
                                        <TableHead>ID</TableHead>
                                        <TableHead>Bot Name</TableHead>
                                        <TableHead>Creator</TableHead>
                                        <TableHead>Date Created</TableHead>
                                        <TableHead>Date Updated</TableHead>
                                        <TableHead>Average Speed</TableHead>
                                        <TableHead>Last Run</TableHead>
                                        <TableHead>Archived</TableHead>
                                        <TableHead className="w-12"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {currentBots.map((bot) => (
                                        <TableRow key={bot.id}>
                                            <TableCell>
                                                <Checkbox 
                                                    checked={selectedBots.includes(bot.id)}
                                                    onCheckedChange={(checked) => handleSelectBot(bot.id, checked as boolean)}
                                                />
                                            </TableCell>
                                            <TableCell>{bot.id}</TableCell>
                                            <TableCell>{bot.name}</TableCell>
                                            <TableCell>{bot.creator || "System"}</TableCell>
                                            <TableCell>{new Date(bot.created_at).toLocaleString()}</TableCell>
                                            <TableCell>{new Date(bot.updated_at).toLocaleString()}</TableCell>
                                            <TableCell>{bot.average_speed || "N/A"}</TableCell>
                                            <TableCell>{bot.last_run || "Never"}</TableCell>
                                            <TableCell>{bot.archived ? "Yes" : "No"}</TableCell>
                                            <TableCell>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => startEdit(bot)}>
                                                            <Pencil className="h-4 w-4 mr-2" />
                                                            Edit
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem 
                                                            onClick={() => handleDelete(bot.id)}
                                                            className="text-red-500 focus:text-red-500"
                                                        >
                                                            <Trash className="h-4 w-4 mr-2" />
                                                            Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            
                            <div className="flex items-center justify-between mt-4">
                                <div className="text-sm text-gray-500">
                                    {selectedBots.length} of {filteredBots.length} row(s) selected
                                </div>
                                <div className="flex items-center space-x-6">
                                    <div className="flex items-center space-x-2">
                                        <span className="text-sm">Rows per page</span>
                                        <select 
                                            value={rowsPerPage}
                                            onChange={(e) => setRowsPerPage(Number(e.target.value))}
                                            className="border rounded p-1"
                                        >
                                            <option value="10">10</option>
                                            <option value="20">20</option>
                                            <option value="50">50</option>
                                        </select>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={() => setCurrentPage(1)}
                                            disabled={currentPage === 1}
                                        >
                                            <ChevronsLeft className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                            disabled={currentPage === 1}
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                        </Button>
                                        <span className="text-sm">
                                            Page {currentPage} of {pageCount}
                                        </span>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={() => setCurrentPage(p => Math.min(pageCount, p + 1))}
                                            disabled={currentPage === pageCount}
                                        >
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={() => setCurrentPage(pageCount)}
                                            disabled={currentPage === pageCount}
                                        >
                                            <ChevronsRight className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>AI Management</DialogTitle>
                        <DialogDescription>
                            Manage your AI models and their configurations.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex-1 overflow-y-auto py-4">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit-name">Name</Label>
                                <Input
                                    id="edit-name"
                                    value={editingBot?.name || ''}
                                    onChange={(e) => setEditingBot(editingBot ? {
                                        ...editingBot,
                                        name: e.target.value
                                    } : null)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="edit-model">Language Model</Label>
                                <select
                                    id="edit-model"
                                    className="w-full p-2 border rounded-md"
                                    value={editingBot?.model || ''}
                                    onChange={(e) => setEditingBot(editingBot ? {
                                        ...editingBot,
                                        model: e.target.value
                                    } : null)}
                                >
                                    {modelsLoading ? (
                                        <option value="" disabled>Loading models...</option>
                                    ) : (
                                        models.map((model) => (
                                            <option key={model.id} value={model.id}>
                                                {model.name} ({model.provider})
                                            </option>
                                        ))
                                    )}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="edit-knowledge-collections">Knowledge Collections</Label>
                                <div className="border rounded-md p-2">
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        {(editingBot?.knowledge_collections || []).map(collectionId => {
                                            const collection = collections.find(c => c.id === collectionId);
                                            return collection ? (
                                                <div key={collection.id} className="flex items-center bg-secondary text-secondary-foreground px-2 py-1 rounded-md text-sm">
                                                    {collection.name}
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-4 w-4 p-0 ml-2 hover:bg-secondary/80"
                                                        onClick={() => setEditingBot(editingBot ? {
                                                            ...editingBot,
                                                            knowledge_collections: editingBot.knowledge_collections?.filter(id => id !== collection.id)
                                                        } : null)}
                                                    >
                                                        ×
                                                    </Button>
                                                </div>
                                            ) : null;
                                        })}
                                    </div>
                                    <select
                                        id="edit-knowledge-collections"
                                        className="w-full p-2 border rounded-md"
                                        value=""
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            if (value && editingBot) {
                                                setEditingBot({
                                                    ...editingBot,
                                                    knowledge_collections: [...(editingBot.knowledge_collections || []), value]
                                                });
                                            }
                                        }}
                                    >
                                        <option value="">Add a collection...</option>
                                        {collectionsLoading ? (
                                            <option value="" disabled>Loading collections...</option>
                                        ) : (
                                            collections
                                                .filter(collection => !(editingBot?.knowledge_collections || []).includes(collection.id))
                                                .map((collection) => (
                                                    <option key={collection.id} value={collection.id}>
                                                        {collection.name}
                                                    </option>
                                                ))
                                        )}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="edit-knowledge-sources">Knowledge Sources</Label>
                                <div className="border rounded-md">
                                    {sourcesLoading ? (
                                        <div className="flex justify-center items-center p-8">
                                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                        </div>
                                    ) : (
                                        <SourcesTable 
                                            sources={sourcesDisplay}
                                            selectedSources={selectedSources}
                                            onToggleSelect={(id) => {
                                                setSelectedSources(prev => 
                                                    prev.includes(id) 
                                                        ? prev.filter(sourceId => sourceId !== id)
                                                        : [...prev, id]
                                                );
                                            }}
                                            onSelectAll={(e) => {
                                                if (e.target.checked) {
                                                    setSelectedSources(sourcesDisplay.map(source => source.id));
                                                } else {
                                                    setSelectedSources([]);
                                                }
                                            }}
                                            showCheckboxes={true}
                                            showActions={false}
                                            showAddButton={false}
                                        />
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="edit-system-prompt">System Prompt</Label>
                                <div className="border rounded-md">
                                    {availablePrompts.length === 0 ? (
                                        <div className="flex justify-center items-center p-8">
                                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                        </div>
                                    ) : (
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="w-12">
                                                        <Checkbox 
                                                            checked={editingBot?.system_prompt !== undefined}
                                                            onCheckedChange={() => setEditingBot(editingBot ? {
                                                                ...editingBot,
                                                                system_prompt: undefined
                                                            } : null)}
                                                        />
                                                    </TableHead>
                                                    <TableHead>Name</TableHead>
                                                    <TableHead>Version</TableHead>
                                                    <TableHead>Language</TableHead>
                                                    <TableHead>Last Modified</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {availablePrompts.map((prompt) => (
                                                    <TableRow key={prompt.id}>
                                                        <TableCell>
                                                            <Checkbox 
                                                                checked={editingBot?.system_prompt === prompt.content}
                                                                onCheckedChange={(checked) => {
                                                                    if (checked && editingBot) {
                                                                        setEditingBot({
                                                                            ...editingBot,
                                                                            system_prompt: prompt.content
                                                                        })
                                                                    } else if (editingBot) {
                                                                        setEditingBot({
                                                                            ...editingBot,
                                                                            system_prompt: undefined
                                                                        })
                                                                    }
                                                                }}
                                                            />
                                                        </TableCell>
                                                        <TableCell>{prompt.name}</TableCell>
                                                        <TableCell>v{prompt.version}</TableCell>
                                                        <TableCell>{prompt.language}</TableCell>
                                                        <TableCell>{new Date(prompt.updated_at).toLocaleString()}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="edit-temperature">
                                    Temperature ({editingBot?.temperature || 0.7})
                                </Label>
                                <input
                                    id="edit-temperature"
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.1"
                                    value={editingBot?.temperature || 0.7}
                                    onChange={(e) => setEditingBot(editingBot ? {
                                        ...editingBot,
                                        temperature: parseFloat(e.target.value)
                                    } : null)}
                                    className="w-full"
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="flex-shrink-0">
                        <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button 
                            onClick={handleEditBot}
                            disabled={!editingBot?.name || !editingBot?.model || loading}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : 'Save Changes'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* System Prompts Dialog */}
            <Dialog open={isPromptDialogOpen} onOpenChange={setIsPromptDialogOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Create System Prompt</DialogTitle>
                        <DialogDescription>
                            Create a new system prompt template that can be used across multiple bots.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="prompt-name">Name</Label>
                            <Input
                                id="prompt-name"
                                placeholder="Enter prompt name"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="prompt-content">Prompt Content</Label>
                            <textarea
                                id="prompt-content"
                                className="w-full min-h-[200px] p-2 border rounded-md"
                                placeholder="Enter your system prompt template..."
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="prompt-language">Language</Label>
                            <select
                                id="prompt-language"
                                className="w-full p-2 border rounded-md"
                            >
                                <option value="en">English</option>
                                <option value="es">Spanish</option>
                                <option value="fr">French</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="prompt-version">Version</Label>
                            <Input
                                id="prompt-version"
                                placeholder="1.0"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsPromptDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button>Create Prompt</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
} 