import { Log, LogsTable } from "@/components/logs-table"
import React, { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Pencil, Trash, Play, RefreshCcw } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useBots, Bot } from "@/hooks/use-bots"
import { useModels } from "@/hooks/use-models"
import { useCollections } from "@/hooks/use-collections"
import { useSupabase } from "@/hooks/use-supabase"
import AddBotDialog from "@/components/bot_management/add-bot-dialog"
import EditBotDialog from "@/components/bot_management/edit-bot-dialog"
import TestBotDialog from "@/components/bot_management/test-bot-dialog"
import TestResultDialog from "@/components/bot_management/test-result-dialog"

// Remove the useSimilaritySearch import and add this interface
interface SimilaritySearchResult {
  id: string
  content: string
  name: string
  similarity: number
  source_type: 'source' | 'live_data'
}

export function BotManagement() {
    const { bots, loading: botsLoading, addBot, deleteBot, fetchBots, updateBot } = useBots()
    const { models, loading: modelsLoading } = useModels()
    const { collections, loading: collectionsLoading } = useCollections()
    const supabase = useSupabase()
    
    // Remove the useSimilaritySearch hook
    // const { searchSimilarContent } = useSimilaritySearch()
    
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
    const [currentStep, setCurrentStep] = useState<string | null>(null)

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
            // Step 1: Embedding the search query
            setCurrentStep('Generating embedding for search query...');
            console.log('[BotManagement] Performing similarity search for:', testPrompt);
            const searchResponse = await fetch('/api/similarity-search', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text: testPrompt
                })
            });

            if (!searchResponse.ok) {
                throw new Error(`Similarity search failed: ${searchResponse.statusText}`);
            }

            // Step 2: Processing search results
            setCurrentStep('Processing search results...');
            const searchData = await searchResponse.json();
            const similarContent = searchData.results;
            
            // Log detailed similarity information
            console.log('[BotManagement] Similar content found:');
            similarContent.forEach((result: SimilaritySearchResult, index: number) => {
                console.log(`\nResult ${index + 1}:
                    Source: ${result.source_type}
                    Name: ${result.name}
                    Similarity: ${(result.similarity * 100).toFixed(2)}%
                    Content Preview: ${result.content.substring(0, 100)}...`
                );
            });
            
            const bot = currentTestBot;
            
            // Step 3: Preparing AI request
            setCurrentStep('Preparing AI request...');
            const paramsObj = {
                botId: bot.id,
                botName: bot.name,
                model: bot.model,
                modelName: getModelName(bot.model),
                temperature: bot.temperature?.toString() || '0.7',
                systemPrompt: bot.system_prompt || '',
                userPrompt: testPrompt,
                similarContent: similarContent
            };
            
            console.log('Current bot:', bot);
            console.log('Testing bot function with params:', JSON.stringify(paramsObj, null, 2));
            
            // Step 4: Getting AI response
            setCurrentStep('Getting AI response...');
            const response = await fetch('/api/botResponse', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(paramsObj)
            });
            
            console.log('Response status:', response.status);
            const responseText = await response.text();
            console.log('Raw response:', responseText);
            
            // Step 5: Processing response
            setCurrentStep('Processing response...');
            let data;
            try {
                data = JSON.parse(responseText);
            } catch (e) {
                console.error('Failed to parse response as JSON:', e);
                throw new Error(`Invalid JSON response: ${responseText}`);
            }
            
            data.originalPrompt = testPrompt;
            data.similarContent = similarContent;
            setTestResult(JSON.stringify(data, null, 2));
            setCurrentStep(null);
        } catch (error) {
            console.error('Error in handleRunTest:', error);
            setTestResult(error instanceof Error ? error.message : 'Unknown error occurred');
            setCurrentStep(null);
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
                                                        <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
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
                currentStep={currentStep}
                onEditPrompt={() => {
                    setTestResultOpen(false);
                    setTimeout(() => setTestDialogOpen(true), 100);
                }}
            />
        </div>
    )
} 
