import React, { useCallback } from "react";
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import SystemPromptSelector from "./system-prompt-selector"
import { Model, Bot } from '@/pages/bots/bots'
import { Collection } from "@/pages/knowledge";

interface EditBotDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSubmit: () => Promise<void>
    bot: Bot | null
    onBotChange: (bot: Bot | null) => void
    models: Model[]
    collections: Collection[]
    loading: boolean
}

export default function EditBotDialog({
    open,
    onOpenChange,
    onSubmit,
    bot,
    onBotChange,
    models,
    collections,
    loading: isLoading
}: EditBotDialogProps) {
    if (!bot) return null;

    const handleCombinedPromptChange = useCallback((content: string | undefined) => {
        if (!bot || content === bot.system_prompt) return;

        onBotChange({
            ...bot,
            system_prompt: content,
            system_prompt_id: undefined
        });
    }, [bot, onBotChange]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[800px] max-h-[90vh] flex flex-col">
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
                                value={bot.name}
                                onChange={(e) => onBotChange({
                                    ...bot,
                                    name: e.target.value
                                })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="edit-model">Language Model</Label>
                            <select
                                id="edit-model"
                                className="w-full p-2 border rounded-md"
                                value={bot.model}
                                onChange={(e) => onBotChange({
                                    ...bot,
                                    model: e.target.value
                                })}
                            >
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
                            <Label htmlFor="edit-kb">Collections</Label>
                            <select
                                id="edit-kb"
                                className="w-full p-2 border rounded-md"
                                value={bot.collection || ''}
                                onChange={(e) => onBotChange({
                                    ...bot,
                                    collection: e.target.value || undefined
                                })}
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
                            <Label htmlFor="edit-temperature">
                                Temperature ({bot.temperature || 0.7})
                            </Label>
                            <input
                                id="edit-temperature"
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
                        ) : 'Save Changes'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
} 