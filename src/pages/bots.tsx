import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Play, RefreshCcw } from "lucide-react"
import { useBots, Bot } from "@/hooks/use-bots"
import { useModels } from "@/hooks/use-models"
import { useCollections } from "@/hooks/use-collections"
import { useSupabase } from "@/hooks/use-supabase"
import AddBotDialog from "@/components/bot_management/add-bot-dialog"
import EditBotDialog from "@/components/bot_management/edit-bot-dialog"
import TestBotDialog from "@/components/bot_management/test-bot-dialog"
import TestResultDialog from "@/components/bot_management/test-result-dialog"
import CustomTable from "@/components/ui/custom-table"
import { ColumnDef } from "@tanstack/react-table"

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
    const [testPrompt, setTestPrompt] = useState<string>("Hello! Can you introduce yourself?")
    const [testDialogOpen, setTestDialogOpen] = useState(false)
    const [currentTestBot, setCurrentTestBot] = useState<Bot | null>(null)

    // Real-time subscription to bots
    useEffect(() => {
        const channel = supabase
            .channel('bots-changes')
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'bots' },
                payload => {
                    console.log('Real-time update received:', payload);
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

    const startEdit = (id: string) => {
        const bot = bots.find(bot => bot.id === id);
        if (!bot) return;
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
        setTestPrompt("Hello! Can you introduce yourself?");
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

            // Create params object first
            const paramsObj = {
                botId: bot.id,
                botName: bot.name,
                model: bot.model,
                modelName: getModelName(bot.model),
                temperature: bot.temperature?.toString() || '0.7',
                systemPrompt: bot.system_prompt || '',
                userPrompt: testPrompt
            };

            // Build URL with properly encoded parameters
            const url = new URL('/api/botResponse', window.location.origin);

            // Manually encode each parameter to ensure proper space handling
            Object.entries(paramsObj).forEach(([key, value]) => {
                // Use encodeURIComponent to properly handle spaces and special characters
                url.searchParams.append(key, value);
            });

            console.log('Testing bot function with params:', paramsObj);

            const response = await fetch(url.toString());
            console.log('Response status:', response.status);

            const data = await response.json();
            console.log('Response data:', data);

            if (data.error) {
                throw new Error(`API error: ${JSON.stringify(data)}`);
            }

            // Store the original prompt in the result
            data.originalPrompt = testPrompt;
            setTestResult(JSON.stringify(data, null, 2));
        } catch (error) {
            console.error('Error testing function:', error);

            let errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

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

    const botsData = bots.map(bot => ({
        id: bot.id,
        name: bot.name,
        collection: getCollectionName(bot.collection),
        model: getModelName(bot.model),
    }))

    const columns: ColumnDef<any>[] = [
        { id: "name", accessorKey: "name", header: "Name", enableResizing: true, enableHiding: true, enableSorting: false, cell: (info) => info.getValue() },
        { id: "id", accessorKey: "id", header: "ID", enableResizing: true, enableHiding: true, enableSorting: false, cell: (info) => info.getValue() },
        { id: "collection", accessorKey: "collection", header: "Knowledge Base", enableResizing: true, enableHiding: true, enableSorting: false, cell: (info) => info.getValue() },
        { id: "model", accessorKey: "model", header: "Model", enableResizing: true, enableHiding: true, enableSorting: false, cell: (info) => info.getValue() },
        {
            id: "action",
            accessorKey: "action",
            header: () => null,
            enableResizing: false,
            enableHiding: false,
            enableSorting: false,
            cell: ({ row }) => (
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenTestDialog(row.original)} // Access the row data
                    disabled={testLoading && currentTestBot?.id === row.original.id}
                >
                    {testLoading && currentTestBot?.id === row.original.id ? (
                        <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                    ) : (
                        <Play className="h-4 w-4" />
                    )}
                    <span className="ml-1">Test</span>
                </Button>
            ),
        }
    ]

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
                        <AddBotDialog
                            open={isAddDialogOpen}
                            onOpenChange={setIsAddDialogOpen}
                            onSubmit={handleAddBot}
                            bot={newBot}
                            onBotChange={setNewBot}
                            models={models}
                            collections={collections}
                            loading={loading}
                        />
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="text-sm text-muted-foreground">
                        Manage your AI models and their configurations.
                    </div>

                    {botsLoading ? (
                        <div className="w-full h-64 flex items-center justify-center">
                            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
                        </div>
                    ) : (
                        <div>
                            <CustomTable tableId="bots-table" columns={columns as any} data={botsData} onDelete={(id) => handleDelete(id)} onEdit={(id) => startEdit(id)} />
                        </div>
                    )}
                </div>
            </div>

            <EditBotDialog
                open={isEditDialogOpen}
                onOpenChange={setIsEditDialogOpen}
                onSubmit={handleEditBot}
                bot={editingBot}
                onBotChange={setEditingBot}
                models={models}
                collections={collections}
                loading={loading}
            />

            <TestBotDialog
                open={testDialogOpen}
                onOpenChange={setTestDialogOpen}
                onSubmit={handleRunTest}
                bot={currentTestBot}
                prompt={testPrompt}
                onPromptChange={setTestPrompt}
                loading={testLoading}
                getModelName={getModelName}
                getCollectionName={getCollectionName}
            />

            <TestResultDialog
                open={testResultOpen}
                onOpenChange={setTestResultOpen}
                result={testResult}
                loading={testLoading}
                bot={currentTestBot}
                onEditPrompt={() => {
                    setTestResultOpen(false);
                    setTimeout(() => setTestDialogOpen(true), 100);
                }}
            />
        </div>
    )
} 
