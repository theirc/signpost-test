import React, { useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Play, RefreshCcw, Loader2, Plus } from "lucide-react"
import EditBotDialog from "@/components/bot_management/edit-bot-dialog"
import TestBotDialog from "@/components/bot_management/test-bot-dialog"
import TestResultDialog from "@/components/bot_management/test-result-dialog"
import CustomTable from "@/components/ui/custom-table"
import { ColumnDef } from "@tanstack/react-table"
import { useTeamStore } from "@/lib/hooks/useTeam"
import { Collection } from "../knowledge"
import { supabase } from "@/lib/agents/db"

export interface Model {
    id: string
    name: string
    model_id: string
    provider: string
    created_at: string
}

export interface Bot {
    id: string
    name: string
    collection?: string
    model: string
    system_prompt?: string
    system_prompt_id?: string
    temperature: number
    created_at: string
    updated_at?: string
}

export function BotManagement() {
    const navigate = useNavigate()
    const { selectedTeam } = useTeamStore()
    const [models, setModels] = useState<Model[]>([])
    const [modelsLoading, setModelsLoading] = useState(true)
    const [collections, setCollections] = useState<Collection[]>([])
    const [collectionsLoading, setCollectionsLoading] = useState(true)

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
            const { data, error } = await supabase.from('bots').select('*').eq('team_id', selectedTeam.id).order('created_at', { ascending: false })
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
            const { data, error } = await supabase.from('collections')
                .select('*')
                .eq('team_id', selectedTeam.id)
                .order('created_at', { ascending: false })
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
            const { data, error } = await supabase.from('models').select('*').order('created_at', { ascending: false })
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
    }, [fetchCollectionsData, fetchModelsData, selectedTeam])

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
            const { data, error } = await supabase.from('bots').delete().eq('id', id)
            if (error) throw error
            if (data) {
                setBots(prev => prev.filter(bot => bot.id !== id))
            }
        } catch (error) {
            console.error('Failed to delete bot:', error)
        }
    }

    const handleAddBot = async () => {
        if (newBot.name && newBot.model) {
            try {

                const cleanedBot = { ...newBot }

                if (cleanedBot.collection === "") {
                    cleanedBot.collection = undefined
                }

                if (cleanedBot.system_prompt_id === "") {
                    cleanedBot.system_prompt_id = undefined
                }

                console.log('Submitting clean bot data:', cleanedBot)

                const { data, error } = await supabase.from('bots').insert([{
                    name: cleanedBot.name,
                    model: cleanedBot.model,
                    collection: cleanedBot.collection,
                    system_prompt: cleanedBot.system_prompt,
                    system_prompt_id: cleanedBot.system_prompt_id,
                    temperature: cleanedBot.temperature || 0.7,
                    team_id: selectedTeam.id
                }])

                if (error) {
                    console.error('Error adding bot:', error)
                    alert(`Error adding bot: ${error.message || JSON.stringify(error)}`)
                    throw error
                }

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
                const { data, error } = await supabase.from('bots').update({
                    name: editingBot.name,
                    model: editingBot.model,
                    collection: editingBot.collection,
                    system_prompt: editingBot.system_prompt,
                    system_prompt_id: editingBot.system_prompt_id,
                    temperature: editingBot.temperature,
                    team_id: selectedTeam.id
                }).eq('id', editingBot.id)
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
            setCurrentStep('Connecting to AI service...');

            const bot = currentTestBot;
            console.log('Testing bot:', bot.name, '(ID:', bot.id, ')');

            // Simplified parameters - just send bot ID and prompt
            const paramsObj = {
                botId: bot.id,
                userPrompt: testPrompt
            };

            console.log('Testing bot function with params:', JSON.stringify(paramsObj, null, 2));

            // Make API request
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

            // Process response
            setCurrentStep('Processing response...');
            let data;
            try {
                data = JSON.parse(responseText);
            } catch (e) {
                console.error('Failed to parse response as JSON:', e);
                throw new Error(`Invalid JSON response: ${responseText}`);
            }

            // Add original prompt for reference
            data.originalPrompt = testPrompt;
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
        { id: "name", accessorKey: "name", header: "Name", enableResizing: true, enableHiding: true, cell: (info) => info.getValue() },
        { id: "id", accessorKey: "id", header: "ID", enableResizing: true, enableHiding: true, cell: (info) => info.getValue() },
        { id: "collection", accessorKey: "collection", header: "Collections", enableResizing: true, enableHiding: true, cell: (info) => info.getValue() },
        { id: "model", accessorKey: "model", header: "Model", enableResizing: true, enableHiding: true, cell: (info) => info.getValue() }
    ]

    // Add state for selected rows
    const [selectedBots, setSelectedBots] = useState<string[]>([]);

    // Handle toggle select for a single row
    const handleToggleSelect = (id: string) => {
        setSelectedBots(prev =>
            prev.includes(id)
                ? prev.filter(botId => botId !== id)
                : [...prev, id]
        );
    };

    // Handle select all rows
    const handleSelectAll = () => {
        if (selectedBots.length === botsData.length) {
            setSelectedBots([]);
        } else {
            setSelectedBots(botsData.map(bot => bot.id));
        }
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 space-y-4 p-8 pt-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold tracking-tight">Bots</h1>
                    <div className="flex gap-2">
                        <Button onClick={handleRefresh} variant="outline">
                            <RefreshCcw className="h-4 w-4 mr-2" />
                            Refresh
                        </Button>
                        <Button onClick={() => navigate("/bots/new")}>
                            <Plus className="h-4 w-4 mr-2" />
                            Create Bot
                        </Button>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="text-sm text-muted-foreground">
                        Manage your AI models and their configurations.
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center h-[400px]">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <CustomTable
                            tableId="bots-table"
                            columns={columns}
                            data={botsData}
                            selectedRows={selectedBots}
                            onToggleSelect={handleToggleSelect}
                            onSelectAll={handleSelectAll}
                            onRowClick={(row) => startEdit(row.id)}
                            placeholder="No bots found"
                        />
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