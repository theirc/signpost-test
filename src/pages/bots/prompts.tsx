import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { useSystemPrompts, type SystemPrompt } from '@/hooks/use-system-prompts';
import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import SearchFilter from '@/components/ui/search-filter';
import SelectFilter from '@/components/ui/select-filter';
import DateFilter from '@/components/ui/date-filter';
import CustomTable from '@/components/ui/custom-table';

// Default prompt structure for form
const defaultPrompt = {
    name: "",
    content: "",
    language: "en",
    version: "1.0",
    status: "active"
};

export function SystemPrompts() {
    const { fetchPrompts, addPrompt, updatePrompt, deletePrompt } = useSystemPrompts();
    const [prompts, setPrompts] = useState<SystemPrompt[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [currentPrompt, setCurrentPrompt] = useState(defaultPrompt);
    const [currentPromptId, setCurrentPromptId] = useState<string | null>(null);

    // Load prompts on mount
    useEffect(() => {
        loadPrompts();
    }, []);

    const loadPrompts = async () => {
        setLoading(true);
        try {
            const fetchedPrompts = await fetchPrompts();
            console.log("Loaded prompts:", fetchedPrompts);
            setPrompts(fetchedPrompts);
        } catch (error) {
            console.error("Error loading prompts:", error);
        } finally {
            setLoading(false);
        }
    };

    // Handle opening the create dialog
    const handleOpenCreateDialog = () => {
        setCurrentPrompt(defaultPrompt);
        setCurrentPromptId(null);
        setIsEditMode(false);
        setIsDialogOpen(true);
    };

    // Handle opening the edit dialog
    const handleEdit = (id: string) => {
        const promptToEdit = prompts.find(p => p.id === id);
        if (!promptToEdit) return;
        
        setCurrentPrompt({
            name: promptToEdit.name,
            content: promptToEdit.content,
            language: promptToEdit.language,
            version: promptToEdit.version,
            status: promptToEdit.status || "active"
        });
        setCurrentPromptId(id);
        setIsEditMode(true);
        setIsDialogOpen(true);
    };

    const handleDialogClose = () => {
        setIsDialogOpen(false);
        // Reset after dialog closes
        setTimeout(() => {
            setCurrentPrompt(defaultPrompt);
            setCurrentPromptId(null);
            setIsEditMode(false);
        }, 300);
    };

    // Create a new prompt
    const handleCreatePrompt = async () => {
        if (!currentPrompt.name || !currentPrompt.content) return;

        try {
            const prompt = await addPrompt({
                name: currentPrompt.name,
                content: currentPrompt.content,
                language: currentPrompt.language,
                version: currentPrompt.version,
                status: currentPrompt.status
            });

            if (prompt) {
                // Add to state and close dialog
                setPrompts(prev => [prompt, ...prev]);
                handleDialogClose();
            }
        } catch (error) {
            console.error('Error creating prompt:', error);
        }
    };

    // Update an existing prompt
    const handleUpdatePrompt = async () => {
        if (!currentPromptId || !currentPrompt.name || !currentPrompt.content) return;

        try {
            const updatedPrompt = await updatePrompt(currentPromptId, {
                name: currentPrompt.name,
                content: currentPrompt.content,
                language: currentPrompt.language,
                version: currentPrompt.version,
                status: currentPrompt.status
            });

            if (updatedPrompt) {
                // Update in state and close dialog
                setPrompts(prev => 
                    prev.map(p => p.id === currentPromptId ? updatedPrompt : p)
                );
                handleDialogClose();
            }
        } catch (error) {
            console.error('Error updating prompt:', error);
        }
    };

    const handleDeletePrompt = async (id: string) => {
        try {
            const success = await deletePrompt(id);
            if (success) {
                setPrompts(prev => prev.filter(p => p.id !== id));
            }
        } catch (error) {
            console.error("Error deleting prompt:", error);
        }
    };

    // Table columns definition
    const columns: ColumnDef<SystemPrompt>[] = [
        { id: "name", accessorKey: "name", header: "Name" },
        { id: "version", accessorKey: "version", header: "Version" },
        { id: "language", accessorKey: "language", header: "Language" },
        { id: "updated_at", accessorKey: "updated_at", header: "Last Modified", cell: info => info.getValue() ? format(new Date(info.getValue<string>()), "MMM dd, yyyy") : "" },
        { id: "status", accessorKey: "status", header: "Status", cell: info => info.getValue() || "active" },
    ];

    // Table filters
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
    ];

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 space-y-4 p-8 pt-6">
                {/* Header and Create Button */}
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold tracking-tight">System Prompts</h1>
                    <Button variant="secondary" onClick={handleOpenCreateDialog}>
                        Create Prompt
                    </Button>
                </div>

                {/* Table */}
                <div className="space-y-4">
                    {loading ? (
                        <div className="w-full h-64 flex items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                    ) : (
                        <CustomTable
                            tableId="prompts-table"
                            columns={columns as any}
                            data={prompts}
                            filters={filters}
                            onRowClick={(row) => handleEdit(row.id)}
                            placeholder="No prompts found"
                        />
                    )}
                </div>
            </div>

            {/* Create/Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>
                            {isEditMode ? 'Edit System Prompt' : 'Create System Prompt'}
                        </DialogTitle>
                        <DialogDescription>
                            {isEditMode 
                                ? 'Edit existing system prompt settings and content.' 
                                : 'Create a new system prompt template.'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="prompt-name">Name</Label>
                            <Input
                                id="prompt-name"
                                placeholder="Enter prompt name"
                                value={currentPrompt.name}
                                onChange={(e) => setCurrentPrompt(prev => ({ ...prev, name: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="prompt-content">Prompt Content</Label>
                            <textarea
                                id="prompt-content"
                                className="w-full min-h-[200px] p-2 border rounded-md"
                                placeholder="Enter your system prompt template..."
                                value={currentPrompt.content}
                                onChange={(e) => setCurrentPrompt(prev => ({ ...prev, content: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="prompt-language">Language</Label>
                            <select
                                id="prompt-language"
                                className="w-full p-2 border rounded-md"
                                value={currentPrompt.language}
                                onChange={(e) => setCurrentPrompt(prev => ({ ...prev, language: e.target.value }))}
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
                                value={currentPrompt.version}
                                onChange={(e) => setCurrentPrompt(prev => ({ ...prev, version: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="prompt-status">Status</Label>
                            <select
                                id="prompt-status"
                                className="w-full p-2 border rounded-md"
                                value={currentPrompt.status}
                                onChange={(e) => setCurrentPrompt(prev => ({ ...prev, status: e.target.value }))}
                            >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={handleDialogClose}>
                            Cancel
                        </Button>
                        <Button 
                            onClick={isEditMode ? handleUpdatePrompt : handleCreatePrompt}
                            disabled={!currentPrompt.name || !currentPrompt.content}
                        >
                            {isEditMode ? 'Save Changes' : 'Create Prompt'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default SystemPrompts; 