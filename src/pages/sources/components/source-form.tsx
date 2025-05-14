import { useParams, useNavigate } from "react-router-dom"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { EntityForm } from "@/components/ui/entity-form"
import { useEntityForm } from "@/hooks/use-entity-form"
import { fetchSources, addSource, updateSource } from "@/lib/data/supabaseFunctions"

const initialFormData = {
    name: "",
    type: "file",
    content: "",
    status: "active",
    metadata: {
        language: "en",
        tags: []
    }
}

export function SourceForm() {
    const { id } = useParams()
    const navigate = useNavigate()
    
    const {
        isLoading,
        isFetching,
        formData,
        setFormData,
        handleSubmit
    } = useEntityForm({
        id,
        fetchEntityById: async (id) => {
            const response = await fetchSources()
            if (response.error) throw response.error
            const source = response.data.find(source => source.id === id)
            return { data: source || null, error: null }
        },
        updateEntity: updateSource,
        createEntity: addSource,
        redirectPath: "/sources",
        initialFormData
    })

    return (
        <EntityForm
            title={id && id !== "new" ? "Edit Source" : "Add New Source"}
            isLoading={isLoading}
            isFetching={isFetching}
            onSubmit={handleSubmit}
            onCancel={() => navigate("/sources")}
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
                <Label htmlFor="type">Type</Label>
                <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
                    required
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Select a type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="file">File</SelectItem>
                        <SelectItem value="url">URL</SelectItem>
                        <SelectItem value="text">Text</SelectItem>
                    </SelectContent>
                </Select>
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

            <div className="space-y-2">
                <Label htmlFor="language">Language</Label>
                <Select
                    value={formData.metadata.language}
                    onValueChange={(value) => setFormData(prev => ({
                        ...prev,
                        metadata: { ...prev.metadata, language: value }
                    }))}
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
        </EntityForm>
    )
} 