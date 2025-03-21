import { Log, LogsTable } from "@/components/logs-table"
import React, { useState, useEffect, useCallback, useRef } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, RefreshCcw, MoreHorizontal, Pencil, Trash, Play } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useBots, Bot } from "@/hooks/use-bots"
import { useModels, Model } from "@/hooks/use-models"
import { useCollections, Collection } from "@/hooks/use-collections"
import { useSupabase } from "@/hooks/use-supabase"
import { Textarea } from "@/components/ui/textarea"

export function BotManagement() {
    const { bots, loading: botsLoading, addBot, deleteBot, fetchBots, updateBot } = useBots()
    const { models, loading: modelsLoading } = useModels()
    const { collections, loading: collectionsLoading } = useCollections()
    const supabase = useSupabase()
    
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [newBot, setNewBot] = useState<Partial<Bot>>({})
    const [editingBot, setEditingBot] = useState<Bot | null>(null)
    const [loading, setLoading] = useState(false)
    const [testLoading, setTestLoading] = useState(false)
    const [testResult, setTestResult] = useState<string | null>(null)
    const [testResultOpen, setTestResultOpen] = useState(false)
    const [testPrompt, setTestPrompt] = useState<string>("")
    const [testDialogOpen, setTestDialogOpen] = useState(false)
    const [currentTestBot, setCurrentTestBot] = useState<Bot | null>(null)

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
                    collection: newBot.collection,
                    system_prompt: newBot.system_prompt,
                    temperature: newBot.temperature || 0.7
                });
                setNewBot({});
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
                    collection: editingBot.collection,
                    system_prompt: editingBot.system_prompt,
                    temperature: editingBot.temperature
                });
                setEditingBot(null);
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

    const handleOpenTestDialog = (bot: Bot) => {
        setCurrentTestBot(bot);
        setTestPrompt("Hello! Can you introduce yourself?"); // Default prompt
        setTestDialogOpen(true);
    }

    const handleRunTest = async () => {
        if (!currentTestBot || !testPrompt.trim()) return;
        
        setTestLoading(true);
        setTestResult(null);
        setTestDialogOpen(false);
        setTestResultOpen(true);
        
        try {
            const bot = currentTestBot;
            
            // Get the collection information if it exists
            let collectionName = "None";
            let collectionId = "";
            
            if (bot.collection) {
                collectionId = bot.collection;
                collectionName = getCollectionName(bot.collection);
            }
            
            // Include bot parameters in the API call
            const params = new URLSearchParams({
                botId: bot.id,
                botName: bot.name,
                model: bot.model,
                modelName: getModelName(bot.model),
                temperature: bot.temperature?.toString() || '0.7',
                systemPrompt: bot.system_prompt || '',
                userPrompt: testPrompt,
                collectionId: collectionId,
                collectionName: collectionName
            });
            
            console.log('Testing bot function with params:', Object.fromEntries(params.entries()));
            
            const response = await fetch(`/api/hello?${params.toString()}`);
            console.log('Response status:', response.status);
            
            const data = await response.json();
            console.log('Response data:', data);
            
            // Check explicitly for error property
            if (data.error) {
                throw new Error(`API error: ${JSON.stringify(data)}`);
            }
            
            // No error, so this is a successful response
            setTestResult(JSON.stringify(data, null, 2));
        } catch (error) {
            console.error('Error testing function:', error);
            
            // Don't include "Error: API error:" prefix in error message if it's already structured
            let errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            
            // If the error message is already JSON, clean it up
            if (errorMessage.startsWith('API error: {')) {
                try {
                    errorMessage = errorMessage.substring('API error: '.length);
                } catch (e) {
                    // Keep the original message if parsing fails
                }
            }
            
            setTestResult(errorMessage);
        } finally {
            setTestLoading(false);
        }
    }

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 space-y-4 p-8 pt-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold tracking-tight">AI Management</h1>
                    <div className="flex space-x-2">
                        <Button variant="outline" onClick={handleRefresh}>
                            <RefreshCcw className="h-4 w-4 mr-2" />
                            Refresh
                        </Button>
                        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                            <DialogTrigger asChild>
                                <Button>Add Bot</Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
                                <DialogHeader>
                                    <DialogTitle>Add New Bot</DialogTitle>
                                    <DialogDescription>
                                        Configure a new AI bot with a knowledge base and language model.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="flex-1 overflow-y-auto py-4">
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="name">Name</Label>
                                            <Input
                                                id="name"
                                                value={newBot.name || ''}
                                                onChange={(e) => setNewBot({ ...newBot, name: e.target.value })}
                                                placeholder="Enter bot name"
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
                                                <option value="">Select a Model</option>
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
                                            <Label htmlFor="kb">Knowledge Base</Label>
                                            <select
                                                id="kb"
                                                className="w-full p-2 border rounded-md"
                                                value={newBot.collection || ''}
                                                onChange={(e) => setNewBot({ ...newBot, collection: e.target.value || undefined })}
                                            >
                                                <option value="">None</option>
                                                {collectionsLoading ? (
                                                    <option value="" disabled>Loading collections...</option>
                                                ) : (
                                                    collections.map((collection) => (
                                                        <option key={collection.id} value={collection.id}>
                                                            {collection.name}
                                                        </option>
                                                    ))
                                                )}
                                            </select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="systemPrompt">System Prompt</Label>
                                            <textarea
                                                id="systemPrompt"
                                                className="w-full p-2 border rounded-md min-h-[100px]"
                                                value={newBot.system_prompt || ''}
                                                onChange={(e) => setNewBot({ ...newBot, system_prompt: e.target.value })}
                                                placeholder="Enter system prompt instructions..."
                                            />
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
                                                onChange={(e) => setNewBot({ 
                                                    ...newBot, 
                                                    temperature: parseFloat(e.target.value) 
                                                })}
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
                                                Saving...
                                            </>
                                        ) : 'Add Bot'}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="text-sm text-muted-foreground">
                        Manage your AI models and their configurations.
                    </div>

                    {botsLoading ? (
                        <div className="w-full h-64 flex items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>ID</TableHead>
                                    <TableHead>Knowledge Base</TableHead>
                                    <TableHead>Model</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {bots.map((bot) => (
                                    <TableRow key={bot.id}>
                                        <TableCell>{bot.name}</TableCell>
                                        <TableCell>{bot.id}</TableCell>
                                        <TableCell>{getCollectionName(bot.collection)}</TableCell>
                                        <TableCell>{getModelName(bot.model)}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end items-center space-x-1">
                                                <Button 
                                                    variant="outline" 
                                                    size="sm" 
                                                    onClick={() => handleOpenTestDialog(bot)}
                                                    disabled={testLoading && currentTestBot?.id === bot.id}
                                                >
                                                    {testLoading && currentTestBot?.id === bot.id ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <Play className="h-4 w-4" />
                                                    )}
                                                    <span className="ml-1">Test</span>
                                                </Button>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="sm">
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
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </div>
            </div>

            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Edit Bot</DialogTitle>
                        <DialogDescription>
                            Modify the bot configuration and settings.
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
                                <Label htmlFor="edit-kb">Knowledge Base</Label>
                                <select
                                    id="edit-kb"
                                    className="w-full p-2 border rounded-md"
                                    value={editingBot?.collection || ''}
                                    onChange={(e) => setEditingBot(editingBot ? {
                                        ...editingBot,
                                        collection: e.target.value || undefined
                                    } : null)}
                                >
                                    <option value="">None</option>
                                    {collectionsLoading ? (
                                        <option value="" disabled>Loading collections...</option>
                                    ) : (
                                        collections.map((collection) => (
                                            <option key={collection.id} value={collection.id}>
                                                {collection.name}
                                            </option>
                                        ))
                                    )}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="edit-systemPrompt">System Prompt</Label>
                                <textarea
                                    id="edit-systemPrompt"
                                    className="w-full p-2 border rounded-md min-h-[100px]"
                                    value={editingBot?.system_prompt || ''}
                                    onChange={(e) => setEditingBot(editingBot ? {
                                        ...editingBot,
                                        system_prompt: e.target.value
                                    } : null)}
                                />
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

            <Dialog open={testDialogOpen} onOpenChange={setTestDialogOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Test Bot: {currentTestBot?.name}</DialogTitle>
                        <DialogDescription>
                            Enter a prompt to test this bot with its configured settings.
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4 mb-2">
                            <div className="space-y-1">
                                <Label className="text-xs">Model</Label>
                                <div className="text-sm font-medium">{getModelName(currentTestBot?.model || '')}</div>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">Knowledge Base</Label>
                                <div className="text-sm font-medium">
                                    {currentTestBot?.collection ? getCollectionName(currentTestBot?.collection) : 'None'}
                                </div>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">Temperature</Label>
                                <div className="text-sm font-medium">{currentTestBot?.temperature || 0.7}</div>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">Bot ID</Label>
                                <div className="text-sm font-medium truncate" title={currentTestBot?.id}>
                                    {currentTestBot?.id}
                                </div>
                            </div>
                        </div>
                        
                        {currentTestBot?.system_prompt && (
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">System Prompt</Label>
                                <div className="bg-gray-50 p-3 rounded-md border text-sm text-gray-700 whitespace-pre-wrap max-h-[150px] overflow-y-auto">
                                    {currentTestBot.system_prompt}
                                </div>
                            </div>
                        )}
                        
                        <div className="space-y-2">
                            <Label htmlFor="test-prompt">Your Message</Label>
                            <Textarea
                                id="test-prompt"
                                value={testPrompt}
                                onChange={(e) => setTestPrompt(e.target.value)}
                                placeholder="Enter your message to the AI..."
                                className="min-h-[150px]"
                            />
                        </div>
                    </div>
                    
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setTestDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button 
                            onClick={handleRunTest}
                            disabled={!testPrompt.trim() || testLoading}
                        >
                            {testLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Testing...
                                </>
                            ) : 'Run Test'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={testResultOpen} onOpenChange={setTestResultOpen}>
                <DialogContent className="sm:max-w-[600px] max-h-[90vh]">
                    <DialogHeader>
                        <DialogTitle>Test Results</DialogTitle>
                        <DialogDescription>
                            Response from {currentTestBot?.name || 'the AI'}
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="flex-1 overflow-y-auto py-4">
                        {testResult && (
                            <>
                                {(() => {
                                    try {
                                        // Try to parse as JSON
                                        const parsedData = JSON.parse(testResult);
                                        
                                        // Check if it's an error or success
                                        if (parsedData.error) {
                                            // Show error
                                            return (
                                                <div className="bg-red-50 p-4 rounded-md overflow-auto max-h-[400px] text-red-600">
                                                    <h3 className="font-medium mb-2">Error:</h3>
                                                    <pre className="whitespace-pre-wrap break-all text-sm">{JSON.stringify(parsedData, null, 2)}</pre>
                                                </div>
                                            );
                                        } else {
                                            // Show chat-like interface for success
                                            const userPrompt = parsedData.prompt || "Hello! Can you introduce yourself?";
                                            const assistantMessage = parsedData.response?.content?.[0]?.text;
                                            
                                            return (
                                                <div className="space-y-4">
                                                    {/* Bot Info Banner */}
                                                    <div className="bg-gray-50 p-3 rounded-md border flex items-center justify-between">
                                                        <div>
                                                            <span className="font-medium">{parsedData.botName}</span>
                                                            <span className="text-xs text-gray-500 ml-2">({parsedData.modelName})</span>
                                                        </div>
                                                        {parsedData.collectionName && (
                                                            <div className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                                                                KB: {parsedData.collectionName}
                                                            </div>
                                                        )}
                                                    </div>
                                                
                                                    <div className="flex flex-col gap-4">
                                                        {/* User Message */}
                                                        <div className="flex gap-3 items-start">
                                                            <div className="bg-gray-200 w-8 h-8 rounded-full flex items-center justify-center">
                                                                <span className="text-sm font-medium">You</span>
                                                            </div>
                                                            <div className="bg-gray-100 rounded-lg p-3 flex-1">
                                                                <p className="whitespace-pre-wrap">{userPrompt}</p>
                                                            </div>
                                                        </div>
                                                        
                                                        {/* AI Response */}
                                                        <div className="flex gap-3 items-start">
                                                            <div className="bg-purple-100 w-8 h-8 rounded-full flex items-center justify-center">
                                                                <span className="text-sm font-medium">AI</span>
                                                            </div>
                                                            <div className="bg-purple-50 rounded-lg p-3 flex-1">
                                                                <p className="whitespace-pre-wrap">{assistantMessage || "No response text found"}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    
                                                    <details className="text-sm mt-4">
                                                        <summary className="cursor-pointer font-medium text-gray-700">Show Technical Details</summary>
                                                        <div className="mt-2 space-y-3">
                                                            <div className="grid grid-cols-2 gap-2">
                                                                <div>
                                                                    <span className="font-medium">Model:</span> {parsedData.modelName || parsedData.modelUsed}
                                                                </div>
                                                                <div>
                                                                    <span className="font-medium">Temperature:</span> {parseFloat(parsedData.temperature || 0.7).toFixed(1)}
                                                                </div>
                                                                <div>
                                                                    <span className="font-medium">Knowledge Base:</span> {parsedData.collectionName || 'None'}
                                                                </div>
                                                                <div>
                                                                    <span className="font-medium">Tokens:</span> {parsedData.response?.usage?.input_tokens || 0} in, {parsedData.response?.usage?.output_tokens || 0} out
                                                                </div>
                                                            </div>
                                                            
                                                            <div>
                                                                <span className="font-medium">System Prompt:</span>
                                                                <div className="mt-1 bg-gray-50 p-2 rounded-md border text-xs whitespace-pre-wrap max-h-[100px] overflow-y-auto">
                                                                    {parsedData.systemPrompt}
                                                                </div>
                                                            </div>
                                                            
                                                            <div>
                                                                <span className="font-medium">Full Response:</span>
                                                                <pre className="mt-1 bg-gray-100 p-3 rounded-md overflow-auto max-h-[200px] text-xs whitespace-pre-wrap break-all">
                                                                    {JSON.stringify(parsedData, null, 2)}
                                                                </pre>
                                                            </div>
                                                        </div>
                                                    </details>
                                                </div>
                                            );
                                        }
                                    } catch (e) {
                                        // If parsing fails, treat as error string
                                        return (
                                            <div className="bg-red-50 p-4 rounded-md overflow-auto max-h-[400px] text-red-600">
                                                <pre className="whitespace-pre-wrap break-all">{testResult}</pre>
                                            </div>
                                        );
                                    }
                                })()}
                            </>
                        )}
                        
                        {!testResult && testLoading && (
                            <div className="flex flex-col items-center justify-center py-8">
                                <Loader2 className="h-8 w-8 animate-spin text-purple-500 mb-4" />
                                <p className="text-gray-500">Getting response from AI...</p>
                            </div>
                        )}
                    </div>
                    
                    <DialogFooter>
                        <Button onClick={() => {
                            // Re-open the test dialog with the same bot and prompt
                            if (currentTestBot) {
                                setTestResultOpen(false);
                                setTimeout(() => setTestDialogOpen(true), 100);
                            }
                        }} variant="outline">
                            Edit Prompt
                        </Button>
                        <Button onClick={() => setTestResultOpen(false)}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
} 