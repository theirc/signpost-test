import { useParams, useNavigate } from "react-router-dom"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { EntityForm } from "@/components/ui/entity-form"
import { useEntityForm } from "@/hooks/use-entity-form"
import { useSystemPrompts } from "@/hooks/use-system-prompts"

const initialFormData = {
    name: "",
    content: "",
    language: "en",
    version: "1.0",
    status: "active"
}

export function PromptForm() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { fetchPrompts, addPrompt, updatePrompt } = useSystemPrompts()
    
    const {
        isLoading,
        isFetching,
        formData,
        setFormData,
        handleSubmit
    } = useEntityForm({
        id,
        fetchEntityById: async (id) => {
            const prompts = await fetchPrompts()
            const prompt = prompts.find(p => p.id === id)
            return { data: prompt, error: null }
        },
        updateEntity: updatePrompt,
        createEntity: addPrompt,
        redirectPath: "/bots/prompts",
        initialFormData
    })

    return (
        <EntityForm
            title={id && id !== "new" ? "Edit Prompt" : "Add New Prompt"}
            isLoading={isLoading}
            isFetching={isFetching}
            onSubmit={handleSubmit}
            onCancel={() => navigate("/bots/prompts")}
        >
            <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="content">Content</Label>
                <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                    className="min-h-[200px]"
                    required
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="language">Language</Label>
                <Select
                    value={formData.language}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, language: value }))}
                    required
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Select a language" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Spanish</SelectItem>
                        <SelectItem value="fr">French</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label htmlFor="version">Version</Label>
                <Input
                    id="version"
                    value={formData.version}
                    onChange={(e) => setFormData(prev => ({ ...prev, version: e.target.value }))}
                    required
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                    required
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Select a status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </EntityForm>
    )
} 