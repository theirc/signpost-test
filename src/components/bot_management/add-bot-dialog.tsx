import React, { useCallback } from "react";
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { Bot, Model, Collection } from "@/lib/data/supabaseFunctions"
import SystemPromptSelector from "./system-prompt-selector"

interface AddBotDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSubmit: () => Promise<void>
    bot: Partial<Bot>
    onBotChange: (bot: Partial<Bot>) => void
    models: Model[]
    collections: Collection[]
    loading: boolean
}

export default function AddBotDialog({
    open,
    onOpenChange,
    onSubmit,
    bot,
    onBotChange,
    models,
    collections,
    loading: isLoading
}: AddBotDialogProps) {

    const handleCombinedPromptChange = useCallback((content: string | undefined) => {
        onBotChange({
            ...bot,
            system_prompt: content,
            system_prompt_id: undefined
        });
    }, [bot, onBotChange]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>
                <Button>Add Bot</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[800px] max-h-[90vh] flex flex-col">
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
                                value={bot.name || ''}
                                onChange={(e) => onBotChange({ ...bot, name: e.target.value })}
                                placeholder="Enter bot name"
                            />
                        </div>
                        
                        <div className="space-y-2">
                            <Label htmlFor="model">Language Model</Label>
                            <select
                                id="model"
                                className="w-full p-2 border rounded-md"
                                value={bot.model || ''}
                                onChange={(e) => onBotChange({ ...bot, model: e.target.value })}
                            >
                                <option value="">Select a Model</option>
                                {isLoading ? (
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
                            <Label htmlFor="kb">Collections</Label>
                            <select
                                id="kb"
                                className="w-full p-2 border rounded-md"
                                value={bot.collection || ''}
                                onChange={(e) => onBotChange({ ...bot, collection: e.target.value || undefined })}
                            >
                                <option value="">None</option>
                                {isLoading ? (
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

                        <SystemPromptSelector
                            initialCombinedPrompt={bot.system_prompt}
                            onCombinedPromptChange={handleCombinedPromptChange}
                        />

                        <div className="space-y-2">
                            <Label htmlFor="temperature">
                                Temperature ({bot.temperature || 0.7})
                            </Label>
                            <input
                                id="temperature"
                                type="range"
                                min="0"
                                max="1"
                                step="0.1"
                                value={bot.temperature || 0.7}
                                onChange={(e) => onBotChange({ 
                                    ...bot, 
                                    temperature: parseFloat(e.target.value) 
                                })}
                                className="w-full"
                            />
                        </div>
                    </div>
                </div>
                <DialogFooter className="flex-shrink-0">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button 
                        onClick={onSubmit}
                        disabled={!bot.name || !bot.model || isLoading}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                            </>
                        ) : 'Add Bot'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
} 