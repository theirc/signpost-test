import { useMemo, useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ChatFlow } from './chat'
import { X, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ParameterInput } from './parameter-input'
import { DeleteConversationDialog } from './delete-conversation-dialog'

interface WorkerConfigPanelProps {
    selectedWorker: AIWorker | null
    onClose: () => void
    showChat: boolean
    chatHistory: ChatHistory
    onChatHistoryChange: (history: ChatHistory) => void
}

const EXCLUDED_PARAMS = new Set(['history', 'maxHistory', 'sumarizationModel', 'sumarizePrompt']);

export function WorkerConfigPanel({
    selectedWorker,
    onClose,
    showChat,
    chatHistory,
    onChatHistoryChange
}: WorkerConfigPanelProps) {
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    
    if (!selectedWorker && !showChat) return null

    const handleHistoryCleared = () => {
        const emptyHistory: ChatHistory = []
        onChatHistoryChange(emptyHistory)
        setShowDeleteDialog(false)
    }

    const inputsToRender = useMemo(() => {
        if (!selectedWorker) return [];

        const parameters = Object.entries(selectedWorker.parameters)
            .filter(([key]) => selectedWorker.registry.type === 'chatHistory' || !EXCLUDED_PARAMS.has(key))
            .map(([key, value]) => ({
                key,
                value,
                label: key.replace(/_/g, ' '),
                source: 'parameters' as const,
            }));

        const fields = Object.entries(selectedWorker.fields)
            .filter(([, value]) => value.default !== undefined || value.mock !== undefined)
            .filter(([key]) => !selectedWorker.parameters.hasOwnProperty(key))
            .map(([key, value]) => ({
                key,
                value: value.mock ?? value.default,
                label: value.title || key.replace(/_/g, ' '),
                source: 'fields' as const,
            }));

        return [...parameters, ...fields];
    }, [selectedWorker, selectedWorker?.parameters, selectedWorker?.fields]);

    return (
        <div className="w-full bg-white border-l border-gray-200 flex flex-col" style={{ height: 'calc(100vh - 80px)' }}>
            <div className="flex items-center w-full justify-between p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                    {selectedWorker ? `${selectedWorker.registry.title} Configuration` : 'Chat'}
                </h3>
                <div className="flex items-center gap-2">
                    {chatHistory.length > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowDeleteDialog(true)}
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    )}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClose}
                        className="h-8 w-8 p-0"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <div className="flex-1 overflow-hidden">
                <Tabs defaultValue={selectedWorker ? "config" : "chat"} className="h-full flex flex-col">
                    {selectedWorker && (
                        <TabsList className="grid grid-cols-2 mx-4 mt-4">
                            <TabsTrigger value="config">Configuration</TabsTrigger>
                            <TabsTrigger value="chat">Chat</TabsTrigger>
                        </TabsList>
                    )}

                    {selectedWorker && (
                        <TabsContent value="config" className="flex-1 overflow-y-auto overflow-x-hidden p-4">
                            <div className="space-y-4">
                                <div>
                                    <h4 className="font-medium text-gray-900 mb-2">Worker Type</h4>
                                    <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                                        {selectedWorker.type}
                                    </p>
                                </div>
                                <div className="space-y-4">
                                    {inputsToRender.map(({ key, value, label, source }) => (
                                        <div key={`${source}-${key}`}>
                                            <ParameterInput
                                                workerId={selectedWorker.id}
                                                paramKey={key}
                                                paramValue={value}
                                                source={source}
                                                workerType={selectedWorker.type}
                                                label={label}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </TabsContent>
                    )}

                    <TabsContent value="chat" className="flex-1 overflow-y-auto overflow-x-hidden">
                        <div className="h-full">
                            <ChatFlow
                                history={chatHistory}
                                onHistoryChange={onChatHistoryChange}
                            />
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
            
            <DeleteConversationDialog
                isOpen={showDeleteDialog}
                onClose={() => setShowDeleteDialog(false)}
                onHistoryCleared={handleHistoryCleared}
            />
        </div>
    )
} 
