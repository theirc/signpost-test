import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { useSystemPrompts, type SystemPrompt } from "@/hooks/use-system-prompts"
import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import SearchFilter from "@/components/ui/search-filter"
import SelectFilter from "@/components/ui/select-filter"
import DateFilter from "@/components/ui/date-filter"
import CustomTable from "@/components/ui/custom-table"

export function SystemPrompts() {
    const { fetchPrompts, addPrompt, updatePrompt, deletePrompt, loading: promptsLoading } = useSystemPrompts()
    const [systemPrompts, setSystemPrompts] = useState<SystemPrompt[]>([])
    const [selectedPrompt, setSelectedPrompt] = useState<SystemPrompt | null>(null)
    const [isPromptDialogOpen, setIsPromptDialogOpen] = useState(false)
    const [promptSearchQuery, setPromptSearchQuery] = useState("")
    const [promptCurrentPage, setPromptCurrentPage] = useState(1)
    const [promptRowsPerPage, setPromptRowsPerPage] = useState(10)
    const [loading, setLoading] = useState(false)

    // Form state
    const [newPrompt, setNewPrompt] = useState({
        name: "",
        content: "",
        language: "en",
        version: "1.0"
    })

    // Load prompts on mount and when dependencies change
    useEffect(() => {
        console.log("Loading prompts...")
        loadPrompts()
    }, [fetchPrompts]) // Add fetchPrompts as dependency

    const loadPrompts = async () => {
        console.log("Fetching prompts from database...")
        const prompts = await fetchPrompts()
        console.log("Fetched prompts:", prompts)
        setSystemPrompts(prompts)
    }

    const handleCreatePrompt = async () => {
        if (!newPrompt.name || !newPrompt.content) return

        setLoading(true)
        try {
            console.log("Creating new prompt:", newPrompt)
            const prompt = await addPrompt({
                name: newPrompt.name,
                content: newPrompt.content,
                language: newPrompt.language,
                version: newPrompt.version,
                status: 'active'
            })
            console.log("Created prompt:", prompt)

            if (prompt) {
                console.log("Updating local state with new prompt")
                setSystemPrompts(prev => {
                    console.log("Previous prompts:", prev)
                    const updated = [prompt, ...prev]
                    console.log("Updated prompts:", updated)
                    return updated
                })
                setIsPromptDialogOpen(false)
                setNewPrompt({
                    name: "",
                    content: "",
                    language: "en",
                    version: "1.0"
                })
                // Reload prompts to ensure we have the latest data
                loadPrompts()
            }
        } catch (error) {
            console.error('Error creating prompt:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleDeletePrompt = async (id: string) => {
        const success = await deletePrompt(id)
        if (success) {
            setSystemPrompts(prev => prev.filter(p => p.id !== id))
        }
    }

    // Filter prompts based on search query
    const filteredPrompts = systemPrompts.filter(prompt =>
        prompt.name.toLowerCase().includes(promptSearchQuery.toLowerCase())
    )

    // Calculate pagination
    const startIndex = (promptCurrentPage - 1) * promptRowsPerPage
    const endIndex = startIndex + promptRowsPerPage
    const currentPrompts = filteredPrompts.slice(startIndex, endIndex)
    const pageCount = Math.ceil(filteredPrompts.length / promptRowsPerPage)

    const columns: ColumnDef<any>[] = [
        { id: "name", accessorKey: "name", header: "Name", enableResizing: true, enableHiding: true, enableSorting: true, cell: (info) => info.getValue() },
        { id: "version", enableResizing: true, enableHiding: true, accessorKey: "version", header: "Version", enableSorting: false, cell: (info) => info.getValue() },
        { id: "language", enableResizing: true, enableHiding: true, accessorKey: "language", header: "Language", enableSorting: true, cell: (info) => info.getValue() },
        { id: "updated_at", enableResizing: true, enableHiding: true, accessorKey: "updated_at", header: "Last Modified", enableSorting: true, cell: (info) => format(new Date(info.getValue() as string), "MMM dd, yyyy") },
        { id: "created_by", enableResizing: true, enableHiding: true, accessorKey: "created_by", header: "Modified By", enableSorting: false, cell: (info) => info.getValue() },
        { id: "status", enableResizing: true, enableHiding: true, accessorKey: "status", header: "Status", enableSorting: true, cell: (info) => info.getValue() },
    ]

    const filters = [
        {
            id: "search",
            label: "Search",
            component: SearchFilter,
            props: { filterKey: "search", placeholder: "Search Prompts" },
        },
        {
            id: "language",
            label: "Language",
            component: SelectFilter,
            props: { filterKey: "language", placeholder: "All Languages" },
        },
        {
            id: "range",
            label: "Date Created",
            component: DateFilter,
            props: { filterKey: "updated_at", placeholder: "Pick a date" },
        },
    ]

    const handleEdit = (id: string) => {
        const prompt = currentPrompts.find(p => p.id === id)
        if (!prompt) return
        setSelectedPrompt(prompt)
    }

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 space-y-4 p-8 pt-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold tracking-tight">System Prompts</h1>
                    <Button variant="secondary" onClick={() => setIsPromptDialogOpen(true)}>
                        Create Prompt
                    </Button>
                </div>

                <div className="space-y-4">
                    <CustomTable tableId="prompts-table" columns={columns as any} data={currentPrompts} filters={filters} onEdit={handleEdit} onDelete={handleDeletePrompt} placeholder="No prompts found" />
                </div>
            </div>

            {/* Create System Prompt Dialog */}
            <Dialog open={isPromptDialogOpen} onOpenChange={setIsPromptDialogOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Create System Prompt</DialogTitle>
                        <DialogDescription>
                            Create a new system prompt template that can be used across multiple bots.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="prompt-name">Name</Label>
                            <Input
                                id="prompt-name"
                                placeholder="Enter prompt name"
                                value={newPrompt.name}
                                onChange={(e) => setNewPrompt(prev => ({ ...prev, name: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="prompt-content">Prompt Content</Label>
                            <textarea
                                id="prompt-content"
                                className="w-full min-h-[200px] p-2 border rounded-md"
                                placeholder="Enter your system prompt template..."
                                value={newPrompt.content}
                                onChange={(e) => setNewPrompt(prev => ({ ...prev, content: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="prompt-language">Language</Label>
                            <select
                                id="prompt-language"
                                className="w-full p-2 border rounded-md"
                                value={newPrompt.language}
                                onChange={(e) => setNewPrompt(prev => ({ ...prev, language: e.target.value }))}
                            >
                                <option value="en">English</option>
                                <option value="es">Spanish</option>
                                <option value="fr">French</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="prompt-version">Version</Label>
                            <Input
                                id="prompt-version"
                                placeholder="1.0"
                                value={newPrompt.version}
                                onChange={(e) => setNewPrompt(prev => ({ ...prev, version: e.target.value }))}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsPromptDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleCreatePrompt}
                            disabled={!newPrompt.name || !newPrompt.content || loading}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                'Create Prompt'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default SystemPrompts; 