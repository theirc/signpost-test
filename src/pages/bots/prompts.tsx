import React, { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, MoreHorizontal, Pencil, Trash, Search, ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useSystemPrompts, type SystemPrompt } from "@/hooks/use-system-prompts"

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
                    <div className="flex items-center space-x-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                            <Input
                                placeholder="Search Prompts"
                                value={promptSearchQuery}
                                onChange={(e) => setPromptSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline">
                                    Version
                                    <ChevronDown className="ml-2 h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuItem>Latest First</DropdownMenuItem>
                                <DropdownMenuItem>Oldest First</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline">
                                    Language
                                    <ChevronDown className="ml-2 h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuItem>All Languages</DropdownMenuItem>
                                <DropdownMenuItem>English</DropdownMenuItem>
                                <DropdownMenuItem>Spanish</DropdownMenuItem>
                                <DropdownMenuItem>French</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Version</TableHead>
                                <TableHead>Language</TableHead>
                                <TableHead>Last Modified</TableHead>
                                <TableHead>Modified By</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="w-12"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {promptsLoading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8">
                                        <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                                    </TableCell>
                                </TableRow>
                            ) : currentPrompts.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8">
                                        No prompts found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                currentPrompts.map((prompt) => (
                                    <TableRow key={prompt.id}>
                                        <TableCell>{prompt.name}</TableCell>
                                        <TableCell>{prompt.version}</TableCell>
                                        <TableCell>{prompt.language}</TableCell>
                                        <TableCell>{new Date(prompt.updated_at).toLocaleString()}</TableCell>
                                        <TableCell>{prompt.created_by || "System"}</TableCell>
                                        <TableCell>{prompt.status}</TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => setSelectedPrompt(prompt)}>
                                                        <Pencil className="h-4 w-4 mr-2" />
                                                        Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem>
                                                        View History
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem>
                                                        Translate
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem 
                                                        className="text-red-500"
                                                        onClick={() => handleDeletePrompt(prompt.id)}
                                                    >
                                                        <Trash className="h-4 w-4 mr-2" />
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>

                    {/* Pagination */}
                    <div className="flex items-center justify-end space-x-2">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setPromptCurrentPage(1)}
                            disabled={promptCurrentPage === 1}
                        >
                            <ChevronsLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setPromptCurrentPage(p => Math.max(1, p - 1))}
                            disabled={promptCurrentPage === 1}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-sm">
                            Page {promptCurrentPage} of {pageCount}
                        </span>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setPromptCurrentPage(p => Math.min(pageCount, p + 1))}
                            disabled={promptCurrentPage === pageCount}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setPromptCurrentPage(pageCount)}
                            disabled={promptCurrentPage === pageCount}
                        >
                            <ChevronsRight className="h-4 w-4" />
                        </Button>
                    </div>
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