import { useState, useMemo } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ChatFlow } from './chat'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { app } from '@/lib/app'
import { workerRegistry } from '@/lib/agents/registry'
import { ParameterInput } from './parameter-input'

interface WorkerConfigPanelProps {
    selectedWorker: AIWorker | null
    onClose: () => void
    showChat: boolean
    chatHistory: ChatHistory
    onChatHistoryChange: (history: ChatHistory) => void
}

export function WorkerConfigPanel({
    selectedWorker,
    onClose,
    showChat,
    chatHistory,
    onChatHistoryChange
}: WorkerConfigPanelProps) {
    if (!selectedWorker && !showChat) return null
    console.log('selectedWorker', selectedWorker)

    return (
        <div className="w-96 bg-white border-l border-gray-200 flex flex-col" style={{ height: 'calc(100vh - 80px)' }}>
            <div className="flex items-center w-full justify-between p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                    {selectedWorker ? `${selectedWorker.registry.title} Configuration` : 'Chat'}
                </h3>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClose}
                    className="h-8 w-8 p-0"
                >
                    <X className="h-4 w-4" />
                </Button>
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

                                <div>
                                    <h4 className="font-medium text-gray-900 mb-2">Parameters</h4>
                                    <div className="space-y-4">
                                        {Object.entries(selectedWorker.parameters).map(([key, value]) => (
                                            <div key={key}>
                                                <label className="text-sm font-medium text-gray-700 capitalize">{key.replace(/_/g, ' ')}</label>
                                                <ParameterInput
                                                    workerId={selectedWorker.id}
                                                    paramKey={key}
                                                    paramValue={value}
                                                />
                                            </div>
                                        ))}
                                    </div>
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
        </div>
    )
} 