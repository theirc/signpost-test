import { Log, LogsTable } from "@/components/logs-table"
import React, { useState, useEffect, useCallback } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, RefreshCcw, MoreHorizontal, Pencil, Trash } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useBots, Bot } from "@/hooks/use-bots"
import { useModels, Model } from "@/hooks/use-models"
import { useCollections, Collection } from "@/hooks/use-collections"
import { useSupabase } from "@/hooks/use-supabase"

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
        </div>
    )
} 