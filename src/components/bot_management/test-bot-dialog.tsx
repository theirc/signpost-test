import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"
import { Bot, SystemPrompt, getSystemPromptById } from "@/lib/data/supabaseFunctions"

interface TestBotDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSubmit: () => Promise<void>
    bot: Bot | null
    prompt: string
    onPromptChange: (prompt: string) => void
    loading: boolean
    getModelName: (modelId: string) => string
    getCollectionName: (collectionId: string | undefined) => string
}

export default function TestBotDialog({
    open,
    onOpenChange,
    onSubmit,
    bot,
    prompt,
    onPromptChange,
    loading,
    getModelName,
    getCollectionName
}: TestBotDialogProps) {
    const [systemPrompt, setSystemPrompt] = useState<SystemPrompt | null>(null)
    const [loadingPrompt, setLoadingPrompt] = useState(false)

    useEffect(() => {
        if (bot?.system_prompt_id && open) {
            fetchSystemPrompt(bot.system_prompt_id)
        } else {
            setSystemPrompt(null)
        }
    }, [bot?.system_prompt_id, open])

    const fetchSystemPrompt = async (id: string) => {
        setLoadingPrompt(true)
        try {
            const { data, error } = await getSystemPromptById(id)
            if (error) throw error
            setSystemPrompt(data)
        } catch (err) {
            console.error('Error fetching system prompt:', err)
        } finally {
            setLoadingPrompt(false)
        }
    }
    
    if (!bot) return null;

    const displayPrompt = systemPrompt?.content || bot.system_prompt

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Test Bot: {bot.name}</DialogTitle>
                    <DialogDescription>
                        Enter a prompt to test this bot with its configured settings.
                    </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4 mb-2">
                        <div className="space-y-1">
                            <Label className="text-xs">Model</Label>
                            <div className="text-sm font-medium">{getModelName(bot.model)}</div>
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs">Knowledge Base</Label>
                            <div className="text-sm font-medium">
                                {bot.collection ? getCollectionName(bot.collection) : 'None'}
                            </div>
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs">Temperature</Label>
                            <div className="text-sm font-medium">{bot.temperature || 0.7}</div>
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs">Bot ID</Label>
                            <div className="text-sm font-medium truncate" title={bot.id}>
                                {bot.id}
                            </div>
                        </div>
                    </div>
                    
                    {displayPrompt && (
                        <div className="space-y-2">
                            <Label className="text-sm font-medium">
                                System Prompt {systemPrompt && `(${systemPrompt.name})`}
                            </Label>
                            <div className="bg-gray-50 p-3 rounded-md border text-sm text-gray-700 whitespace-pre-wrap max-h-[150px] overflow-y-auto">
                                {loadingPrompt ? (
                                    <div className="flex justify-center py-2">
                                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                                    </div>
                                ) : (
                                    displayPrompt
                                )}
                            </div>
                        </div>
                    )}
                    
                    <div className="space-y-2">
                        <Label htmlFor="test-prompt">Your Message</Label>
                        <Textarea
                            id="test-prompt"
                            value={prompt}
                            onChange={(e) => onPromptChange(e.target.value)}
                            placeholder="Enter your message to the AI..."
                            className="min-h-[150px]"
                        />
                    </div>
                </div>
                
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button 
                        onClick={onSubmit}
                        disabled={!prompt.trim() || loading}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Testing...
                            </>
                        ) : 'Run Test'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
} 