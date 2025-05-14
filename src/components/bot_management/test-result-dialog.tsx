import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Loader2 } from "lucide-react"
import { Bot } from "@/pages/bots/bots"

interface TestResultDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    result: string | null
    loading: boolean
    bot: Bot | null
    currentStep: string | null
    onEditPrompt: () => void
}

export default function TestResultDialog({
    open,
    onOpenChange,
    result,
    loading,
    bot,
    currentStep,
    onEditPrompt
}: TestResultDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Test Results</DialogTitle>
                    <DialogDescription>
                        Response from {bot?.name || 'the AI'}
                    </DialogDescription>
                </DialogHeader>
                
                <div className="flex-1 overflow-y-auto py-4 min-h-0 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
                    {result && (
                        <>
                            {(() => {
                                try {
                                    // Try to parse as JSON
                                    const parsedData = JSON.parse(result);
                                    
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
                                        const userPrompt = parsedData.originalPrompt || parsedData.prompt || "Hello! Can you introduce yourself?";
                                        const assistantMessage = parsedData.response?.content?.[0]?.text;
                                        
                                        return (
                                            <div className="space-y-4">
                                                {/* Bot Info Banner */}
                                                <div className="bg-gray-50 p-3 rounded-md border flex items-center justify-between">
                                                    <div>
                                                        <span className="font-medium">{parsedData.botName}</span>
                                                        <span className="text-xs text-gray-500 ml-2">({parsedData.modelName})</span>
                                                    </div>
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
                                            <pre className="whitespace-pre-wrap break-all">{result}</pre>
                                        </div>
                                    );
                                }
                            })()}
                        </>
                    )}
                    
                    {!result && loading && (
                        <div className="flex flex-col items-center justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-purple-500 mb-4" />
                            <p className="text-gray-500">{currentStep || 'Getting response from AI...'}</p>
                        </div>
                    )}
                </div>
                
                <DialogFooter>
                    <Button onClick={onEditPrompt} variant="outline">
                        Edit Prompt
                    </Button>
                    <Button onClick={() => onOpenChange(false)}>
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
} 