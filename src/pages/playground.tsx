"use client"
const LOCAL_STORAGE_KEY = "chatHistory"

import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, MessageSquarePlus, AudioWaveform, ArrowUp, CirclePlus } from 'lucide-react'
import ReactJson from "react-json-view"
import { Button } from '@/components/ui/button'
import { useMultiState } from '@/hooks/use-multistate'
import { app } from '@/lib/app'
import { agents } from "@/lib/data"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import "../index.css"

const ChatMessage = ({ message, isWaiting }) => {
    if (!message) return null

    const messageType = message.type || "bot"
    const rawContent = message.message

    let messageContent;
    if (typeof rawContent === "object" && rawContent !== null) {
        messageContent = (
            <ReactJson
                src={rawContent}
                name={false}
                collapsed={false}
                displayDataTypes={false}
                enableClipboard={false}
                displayObjectSize={false}
            />
        )
    } else {
        messageContent = rawContent || ""
    }

    return (
        <div className={`flex ${messageType === 'human' ? 'justify-end' : 'justify-start'}`}>
            <div
                className={`max-w-[80%] p-3 rounded-lg ${messageType === 'human'
                    ? 'bg-blue-500 text-white rounded-br-none'
                    : 'bg-gray-100 text-gray-800 rounded-bl-none'
                    }`}
            >
                {messageContent}

                {messageType === 'bot' && isWaiting && (
                    <div className="mt-2 flex gap-1">
                        <div className="w-2.5 h-2.5 rounded-full animate-typing-1 bg-gradient-to-r from-pink-500 to-violet-500"></div>
                        <div className="w-2.5 h-2.5 rounded-full animate-typing-2 bg-gradient-to-r from-violet-500 to-cyan-500"></div>
                        <div className="w-2.5 h-2.5 rounded-full animate-typing-3 bg-gradient-to-r from-cyan-500 to-pink-500"></div>
                    </div>
                )}
            </div>
        </div>
    );
}

const SearchInput = ({ onSearch, disabled, openFileDialog, audioMode, onModeChanged }) => {
    const [inputValue, setInputValue] = useState("")
    const inputRef = useRef(null)

    const handleSubmit = (e) => {
        e.preventDefault()
        if (inputValue.trim() && !disabled) {
            onSearch(inputValue)
            setInputValue("")
        }
    }

    return (
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <Button
                type="button"
                onClick={openFileDialog}
                variant="ghost"
                className="rounded-full p-2 hover:bg-gray-100"
                disabled={disabled}
            >
                <CirclePlus className="h-5 w-5" />
            </Button>

            <div className="flex-grow px-2 max-h-48 overflow-y-auto">
                <input
                    ref={inputRef}
                    type="text"
                    placeholder="Type your message..."
                    className="w-full p-5 pr-10 border rounded-md"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    disabled={disabled}
                />
            </div>

            <Button
                type="submit"
                disabled={!inputValue.trim() || disabled}
                className="rounded-full p-2 bg-blue-500 hover:bg-blue-600 text-white"
            >
                <ArrowUp className="h-5 w-5" />
            </Button>

            <Button
                type="button"
                onClick={onModeChanged}
                variant="ghost"
                className={`rounded-full p-2 ${audioMode ? 'bg-blue-100' : 'hover:bg-gray-100'}`}
            >
                <AudioWaveform className="h-5 w-5" />
            </Button>
        </form>
    )
}

export default function Playground() {
    const [sidebarVisible, setSidebarVisible] = useState(false)
    const [showFileDialog, setShowFileDialog] = useState(false)
    const [activeAgent, setActiveAgent] = useState(null)
    const [selectedSources, setSelectedSources] = useState([])
    const [sources, setSources] = useState([])
    const [message, setMessage] = useState("")
    const [messages, setMessages] = useState([
        {
            type: "bot",
            message: "Hello, how can I assist you today?",
        }
    ])
    const [isLoading, setIsLoading] = useState(false)

    const [state, setState] = useMultiState({
        isSending: false,
        audioMode: false,
    })

    const toggleSidebar = () => {
        setSidebarVisible(!sidebarVisible)
    }

    const handleResetChat = () => {
        setMessages([
            {
                type: "bot",
                message: "Hello, how can I assist you today?",
            }
        ])
        setSidebarVisible(false)
    }

    useEffect(() => {
        async function loadAgent() {
            try {
                setIsLoading(true)
                const loadedAgent = await agents.loadAgent(23)
                setActiveAgent(loadedAgent)
                app.agent = loadedAgent
                setIsLoading(false)
            } catch (error) {
                console.error("Error loading agent:", error)
                setIsLoading(false)
            }
        }
        loadAgent()
    }, [])

    const onSend = async (userMessage) => {
        if (!userMessage.trim() || !activeAgent) return;

        setIsLoading(true);
        setState({ isSending: true });

        const userMsgObj = { type: "human", message: userMessage };
        setMessages((prev) => [...prev, userMsgObj]);

        try {
            const parameters: AgentParameters = {
                input: { question: userMessage },
                apikeys: app.getAPIkeys(),
                output: undefined,
            };

            await activeAgent.execute(parameters);

            const output = parameters.output;
            let finalResponse;

            if (output != null) {
                if (typeof output === "object") {
                    finalResponse = output;
                } else {
                    finalResponse = output;
                }
            } else {
                finalResponse = "No response received";
            }

            setMessages((prev) => [
                ...prev,
                { type: "bot", message: finalResponse },
            ]);
        } catch (error) {
            console.error("Error executing agent:", error);
            setMessages((prev) => [
                ...prev,
                { type: "bot", message: `An error occurred: ${error.message || error}` },
            ]);
        } finally {
            setIsLoading(false)
            setState({ isSending: false })
        }
    };


    function onModeChanged() {
        setState({ audioMode: !state.audioMode })
    }

    return (
        <div className="relative" style={{ height: "calc(100vh - 40px)" }}>
            <div className="flex h-full">
                <div className={`flex flex-col transition-all duration-300 ${sidebarVisible ? 'w-1/4 border-r' : 'w-0 overflow-hidden border-none'
                    }`}>
                    <div className="p-4 border-b">
                        <div className="flex justify-end mb-4">
                            <Button
                                onClick={handleResetChat}
                                size="sm"
                                className="flex items-center gap-1"
                            >
                                <MessageSquarePlus />
                            </Button>
                        </div>
                        <h2 className="text-1xl font-bold text-left">Chat History</h2>
                    </div>

                    <div
                        className="overflow-y-auto"
                        style={{ height: "calc(100% - 100px)" }}
                    >
                        <div className="p-4">
                        </div>
                    </div>
                </div>
                <div className="flex-1 flex flex-col">
                    <div className="py-4 border-b flex justify-between items-center bg-white px-4 shadow-sm">
                        <Button onClick={toggleSidebar} className="mr-3 p-1 bg-grey-100 text-black rounded hover:bg-gray-100">
                            {sidebarVisible ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                        </Button>
                        <h2 className="text-lg font-bold">
                            Playground
                        </h2>
                        <div className="flex-grow flex px-4">
                        </div>
                    </div>
                    <div
                        className="overflow-y-auto"
                        style={{ height: "calc(100% - 137px)" }}
                    >
                        <div className="p-4 space-y-4">
                            {isLoading && messages.length === 0 ? (
                                <div className="flex items-center justify-center h-full">
                                    <p>Loading agent...</p>
                                </div>
                            ) : (
                                <div className="flex flex-col space-y-6 w-full">
                                    {messages.map((m, i) => (
                                        <ChatMessage
                                            key={i}
                                            message={m}
                                            isWaiting={false}
                                        />
                                    ))}

                                    {state.isSending && (
                                        <ChatMessage
                                            message={{ type: "bot", message: "" }}
                                            isWaiting={true}
                                        />
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {!state.audioMode && (
                        <div className="border-t bg-white p-4">
                            {activeAgent ? (
                                <SearchInput
                                    onSearch={onSend}
                                    disabled={state.isSending}
                                    openFileDialog={() => setShowFileDialog(true)}
                                    audioMode={state.audioMode}
                                    onModeChanged={onModeChanged}
                                />
                            ) : (
                                <div className="flex justify-center items-center py-4 text-gray-500">
                                    <span>Loading Agent</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
            <Dialog open={showFileDialog} onOpenChange={setShowFileDialog}>
                <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Attach Files</DialogTitle>
                    </DialogHeader>
                    <div className="mt-4">
                        <div className="flex justify-end mt-4 gap-2">
                            <Button
                                variant="outline"
                                onClick={() => setShowFileDialog(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={() => setShowFileDialog(false)}
                                disabled={selectedSources.length === 0}
                            >
                                Attach Selected
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}