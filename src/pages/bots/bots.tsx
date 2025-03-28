import React, { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Play, RefreshCcw } from "lucide-react"
import { useSupabase } from "@/hooks/use-supabase"
import { useSimilaritySearch, SimilaritySearchResult } from "@/lib/fileUtilities/use-similarity-search"
import AddBotDialog from "@/components/bot_management/add-bot-dialog"
import EditBotDialog from "@/components/bot_management/edit-bot-dialog"
import TestBotDialog from "@/components/bot_management/test-bot-dialog"
import TestResultDialog from "@/components/bot_management/test-result-dialog"
import { fetchBots, addBot, updateBot, deleteBot, Bot, fetchCollections, Collection, fetchModels, Model } from '@/lib/data/supabaseFunctions'
import CustomTable from "@/components/ui/custom-table"
import { ColumnDef } from "@tanstack/react-table"

export function BotManagement() {
    const [models, setModels] = useState<Model[]>([])
    const [modelsLoading, setModelsLoading] = useState(true)
    const [collections, setCollections] = useState<Collection[]>([])
    const [collectionsLoading, setCollectionsLoading] = useState(true)
    const { searchSimilarContent } = useSimilaritySearch()
    const supabase = useSupabase()
    
    const [bots, setBots] = useState<Bot[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<Error | null>(null)
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [newBot, setNewBot] = useState<Partial<Bot>>({})
    const [editingBot, setEditingBot] = useState<Bot | null>(null)
    const [testLoading, setTestLoading] = useState(false)
    const [testResult, setTestResult] = useState<string | null>(null)
    const [testResultOpen, setTestResultOpen] = useState(false)
    const [testPrompt, setTestPrompt] = useState<string>("Hello! Can you introduce yourself?")
    const [testDialogOpen, setTestDialogOpen] = useState(false)
    const [currentTestBot, setCurrentTestBot] = useState<Bot | null>(null)
    const [currentStep, setCurrentStep] = useState<string | null>(null)

    const fetchBotsData = async () => {
        try {
            setLoading(true)
            const { data, error } = await fetchBots()
            if (error) throw error
            setBots(data)
        } catch (error) {
            setError(error instanceof Error ? error : new Error(String(error)))
            console.error('Failed to fetch bots:', error)
        } finally {
            setLoading(false)
        }
    }

    // Fetch collections data function
    const fetchCollectionsData = useCallback(async () => {
      setCollectionsLoading(true)
      try {
        const { data, error } = await fetchCollections()
        if (error) {
          console.error('Error fetching collections:', error)
          setCollections([])
        } else {
          setCollections(data || [])
        }
      } catch (err) {
        console.error('Error fetching collections:', err)
        setCollections([])
      } finally {
        setCollectionsLoading(false)
      }
    }, [])

    // Fetch models data function
    const fetchModelsData = useCallback(async () => {
      setModelsLoading(true)
      try {
        const { data, error } = await fetchModels()
        if (error) {
          console.error('Error fetching models:', error)
          setModels([])
        } else {
          setModels(data || [])
        }
      } catch (err) {
        console.error('Error fetching models:', err)
        setModels([])
      } finally {
        setModelsLoading(false)
      }
    }, [])

    useEffect(() => {
        fetchBotsData()
        fetchCollectionsData()
        fetchModelsData() // Fetch models on mount
    }, [fetchCollectionsData, fetchModelsData])

    // Real-time subscription to bots
    useEffect(() => {
        const channel = supabase
            .channel('bots-changes')
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'bots' },
                payload => {
                    console.log('Real-time update received:', payload);
                    fetchBotsData();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [supabase]);

    // Add real-time subscription for collections
    useEffect(() => {
        const channel = supabase
            .channel('collections-changes-bots-page') // Use a unique channel name
            .on('postgres_changes', 
                { event: '*', schema: 'public', table: 'collections' }, 
                payload => {
                    console.log('Collections real-time update received (Bots Page):', payload);
                    fetchCollectionsData(); // Refresh collections on change
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [supabase, fetchCollectionsData]);

    // Add real-time subscription for models
    useEffect(() => {
        const channel = supabase
            .channel('models-changes-bots-page') // Unique channel name
            .on('postgres_changes', 
                { event: '*', schema: 'public', table: 'models' }, 
                payload => {
                    console.log('Models real-time update received (Bots Page):', payload);
                    fetchModelsData(); // Refresh models on change
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [supabase, fetchModelsData]);

    const handleRefresh = () => {
        fetchBotsData();
        fetchCollectionsData();
        fetchModelsData(); // Also refresh models
    };

    const handleDelete = async (id: string) => {
        try {
            const { success, error } = await deleteBot(id)
            if (error) throw error
            if (success) {
                setBots(prev => prev.filter(bot => bot.id !== id))
            }
        } catch (error) {
            console.error('Failed to delete bot:', error)
        }
    }

    const handleAddBot = async () => {
        if (newBot.name && newBot.model) {
            try {
                const { data, error } = await addBot({
                    name: newBot.name,
                    model: newBot.model,
                    collection: newBot.collection,
                    system_prompt: newBot.system_prompt,
                    system_prompt_id: newBot.system_prompt_id,
                    temperature: newBot.temperature || 0.7
                })
                if (error) throw error
                if (data) {
                    setBots(prev => [...prev, data])
                    setNewBot({})
                    setIsAddDialogOpen(false)
                }
            } catch (error) {
                console.error('Failed to add bot:', error)
            }
        }
    }

    const handleEditBot = async () => {
        if (editingBot && editingBot.name && editingBot.model) {
            try {
                const { data, error } = await updateBot(editingBot.id, {
                    name: editingBot.name,
                    model: editingBot.model,
                    collection: editingBot.collection,
                    system_prompt: editingBot.system_prompt,
                    system_prompt_id: editingBot.system_prompt_id,
                    temperature: editingBot.temperature
                })
                if (error) throw error
                if (data) {
                    setBots(prev => prev.map(bot => bot.id === editingBot.id ? data : bot))
                    setEditingBot(null)
                    setIsEditDialogOpen(false)
                }
            } catch (error) {
                console.error('Failed to update bot:', error)
            }
        }
    }

    const startEdit = (id: string) => {
        const bot = bots.find(bot => bot.id === id);
        if (!bot) return;
        setEditingBot(bot);
        setIsEditDialogOpen(true);
    }

    // Helper function to get collection name (uses state now)
    const getCollectionName = (collectionId: string | undefined) => {
        if (!collectionId) return 'None';
        // Find collection from the 'collections' state variable
        const collection = collections.find(c => c.id === collectionId);
        return collection ? collection.name : 'Unknown';
    }

    // Helper function to get model name
    const getModelName = (modelId: string) => {
        // Find model from the 'models' state variable
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
            // Step 1: Performing similarity search
            setCurrentStep('Performing similarity search...');
            console.log('[BotManagement] Performing similarity search for:', testPrompt);
            const similarContent = await searchSimilarContent(testPrompt);
            
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
            
            // Step 2: Preparing AI request
            setCurrentStep('Preparing AI request...');

            // Check if system prompt content might be missing
            if (!bot.system_prompt && bot.system_prompt_id) {
                console.warn(`[BotManagement] Warning: Bot "${bot.name}" has a system_prompt_id but the system_prompt content is missing. The test might not use the intended system prompt unless fetchBots resolves it.`);
            }

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
            
            // Step 3: Getting AI response
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
            
            // Step 4: Processing response
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

    // Prepare data for the CustomTable component
    const botsData = bots.map(bot => ({
        id: bot.id,
        name: bot.name,
        collection: getCollectionName(bot.collection),
        model: getModelName(bot.model),
    }))

    // Define columns for the CustomTable
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
            cell: ({ row }) => {
                // Find the original bot object based on the ID
                const originalBot = bots.find(bot => bot.id === row.original.id);
                if (!originalBot) return null;
                
                return (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenTestDialog(originalBot)}
                        disabled={testLoading && currentTestBot?.id === originalBot.id}
                    >
                        {testLoading && currentTestBot?.id === originalBot.id ? (
                            <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                        ) : (
                            <Play className="h-4 w-4" />
                        )}
                        <span className="ml-1">Test</span>
                    </Button>
                );
            }
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
                            loading={loading || collectionsLoading || modelsLoading}
                        />
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="text-sm text-muted-foreground">
                        Manage your AI models and their configurations.
                    </div>

                    {loading ? (
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
                loading={loading || collectionsLoading || modelsLoading}
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