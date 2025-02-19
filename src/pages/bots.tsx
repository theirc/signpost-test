import { Log, LogsTable } from "@/components/logs-table"
import React, { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface Bot {
    id: string
    name: string
    knowledgeBase: string
    model: string
    systemPrompt: string
    temperature: number
}

interface KnowledgeBase {
    id: string
    name: string
    sources: any[] // You can make this more specific based on your source type
    createdAt: string
}

// Available LLM options
const availableModels = [
    { id: 'gpt-4', name: 'GPT-4' },
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
    { id: 'claude-3-opus', name: 'Claude 3 Opus' },
    { id: 'claude-3-sonnet', name: 'Claude 3 Sonnet' },
    { id: 'mistral-large', name: 'Mistral Large' },
]

// Update sample knowledge bases with humanitarian themes
const sampleKnowledgeBases: KnowledgeBase[] = [
    {
        id: 'kb-1',
        name: 'Disaster Response Protocols',
        sources: [],
        createdAt: '2024-03-01'
    },
    {
        id: 'kb-2',
        name: 'Emergency Medical Guidelines',
        sources: [],
        createdAt: '2024-03-02'
    },
    {
        id: 'kb-3',
        name: 'Refugee Support Resources',
        sources: [],
        createdAt: '2024-03-03'
    }
]

// Update sample bots with new fields
const sampleBots: Bot[] = [
    {
        id: 'bot-1',
        name: 'Crisis Response Coordinator',
        knowledgeBase: 'kb-1',
        model: 'gpt-4',
        systemPrompt: 'You are a humanitarian crisis response coordinator. Help coordinate emergency response efforts, prioritize resources, and provide guidance for disaster relief operations.',
        temperature: 0.7
    },
    {
        id: 'bot-2',
        name: 'Field Medic Assistant',
        knowledgeBase: 'kb-2',
        model: 'claude-3-opus',
        systemPrompt: 'You are a medical assistance AI trained to support field medics in humanitarian missions. Provide evidence-based medical guidance while acknowledging limitations and emphasizing when direct medical professional consultation is needed.',
        temperature: 0.3
    },
    {
        id: 'bot-3',
        name: 'Refugee Support Guide',
        knowledgeBase: 'kb-3',
        model: 'gpt-4',
        systemPrompt: 'You are a refugee support assistant. Help provide information about available resources, legal rights, and humanitarian aid programs while maintaining cultural sensitivity and empathy.',
        temperature: 0.7
    }
]

export function BotManagement() {
    const [bots, setBots] = useState(sampleBots)
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [newBot, setNewBot] = useState<Partial<Bot>>({})
    const [editingBot, setEditingBot] = useState<Bot | null>(null)
    const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>(sampleKnowledgeBases)

    const handleDelete = (id: string) => {
        const newBots = bots.filter(bot => bot.id !== id)
        setBots(newBots)
    }

    const handleAddBot = () => {
        if (newBot.name && newBot.knowledgeBase && newBot.model) {
            const newBotWithId = {
                ...newBot,
                id: `bot-${bots.length + 1}`,
            } as Bot
            setBots([...bots, newBotWithId])
            setNewBot({})
            setIsAddDialogOpen(false)
        }
    }

    const handleEditBot = () => {
        if (editingBot && editingBot.name && editingBot.knowledgeBase && editingBot.model) {
            setBots(bots.map(bot => 
                bot.id === editingBot.id ? editingBot : bot
            ))
            setEditingBot(null)
            setIsEditDialogOpen(false)
        }
    }

    const startEdit = (bot: Bot) => {
        setEditingBot(bot)
        setIsEditDialogOpen(true)
    }

    // Helper function to get knowledge base name
    const getKnowledgeBaseName = (kbId: string) => {
        if (kbId === 'None') return 'None'
        const kb = knowledgeBases.find(kb => kb.id === kbId)
        return kb ? kb.name : 'Unknown'
    }

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 space-y-4 p-8 pt-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold tracking-tight">AI Management</h1>
                    <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                        <DialogTrigger asChild>
                            <Button>Add Bot</Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[600px]">
                            <DialogHeader>
                                <DialogTitle>Add New Bot</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
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
                                        {availableModels.map((model) => (
                                            <option key={model.id} value={model.id}>
                                                {model.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="kb">Knowledge Base</Label>
                                    <select
                                        id="kb"
                                        className="w-full p-2 border rounded-md"
                                        value={newBot.knowledgeBase || ''}
                                        onChange={(e) => setNewBot({ ...newBot, knowledgeBase: e.target.value })}
                                    >
                                        <option value="">Select a Knowledge Base</option>
                                        {knowledgeBases.map((kb) => (
                                            <option key={kb.id} value={kb.id}>
                                                {kb.name}
                                            </option>
                                        ))}
                                        <option value="None">None</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="systemPrompt">System Prompt</Label>
                                    <textarea
                                        id="systemPrompt"
                                        className="w-full p-2 border rounded-md min-h-[100px]"
                                        value={newBot.systemPrompt || ''}
                                        onChange={(e) => setNewBot({ ...newBot, systemPrompt: e.target.value })}
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

                                <Button 
                                    onClick={handleAddBot}
                                    disabled={!newBot.name || !newBot.model || !newBot.knowledgeBase}
                                >
                                    Add Bot
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="space-y-4">
                    <div className="text-sm text-muted-foreground">
                        Manage your AI models and their configurations.
                    </div>

                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>ID</TableHead>
                                <TableHead>Knowledge Base</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {bots.map((bot) => (
                                <TableRow key={bot.id}>
                                    <TableCell>{bot.name}</TableCell>
                                    <TableCell>{bot.id}</TableCell>
                                    <TableCell>{getKnowledgeBaseName(bot.knowledgeBase)}</TableCell>
                                    <TableCell className="text-right space-x-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => startEdit(bot)}
                                        >
                                            Edit
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDelete(bot.id)}
                                        >
                                            Delete
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>

            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Edit Bot</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
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
                                {availableModels.map((model) => (
                                    <option key={model.id} value={model.id}>
                                        {model.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="edit-kb">Knowledge Base</Label>
                            <select
                                id="edit-kb"
                                className="w-full p-2 border rounded-md"
                                value={editingBot?.knowledgeBase || ''}
                                onChange={(e) => setEditingBot(editingBot ? {
                                    ...editingBot,
                                    knowledgeBase: e.target.value
                                } : null)}
                            >
                                <option value="">Select a Knowledge Base</option>
                                {knowledgeBases.map((kb) => (
                                    <option key={kb.id} value={kb.id}>
                                        {kb.name}
                                    </option>
                                ))}
                                <option value="None">None</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="edit-systemPrompt">System Prompt</Label>
                            <textarea
                                id="edit-systemPrompt"
                                className="w-full p-2 border rounded-md min-h-[100px]"
                                value={editingBot?.systemPrompt || ''}
                                onChange={(e) => setEditingBot(editingBot ? {
                                    ...editingBot,
                                    systemPrompt: e.target.value
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

                        <Button 
                            onClick={handleEditBot}
                            disabled={!editingBot?.name || !editingBot?.model || !editingBot?.knowledgeBase}
                        >
                            Save Changes
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
} 