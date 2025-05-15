import { useParams, useNavigate } from "react-router-dom"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { EntityForm } from "@/components/ui/entity-form"
import { useEntityForm } from "@/hooks/use-entity-form"
import { useTeamStore } from "@/lib/hooks/useTeam"
import { useSupabase } from "@/hooks/use-supabase"
import { Source } from "@/pages/knowledge"

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

const updateSource = async (id: string, updates: Partial<Source>) => {
    const { error } = await useSupabase().from('sources').update(updates).eq('id', id).select().single()
    if (error) throw error
    return { data: null, error: null }
}

export const addSource = async (sourceData: Partial<Source>) => {
    if (!sourceData.name || !sourceData.type || !sourceData.content) {
        throw new Error('Name, type, and content are required')
    }
    if (!sourceData.tags) {
        sourceData.tags = `{${sourceData.type}}`;
    }
    const { error } = await useSupabase().from('sources').insert(sourceData).select().single()
    if (error) throw error
    return { data: null, error: null }
}

export function SourceForm() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { selectedTeam } = useTeamStore()

    const {
        isLoading,
        isFetching,
        formData,
        setFormData,
        handleSubmit
    } = useEntityForm({
        id,
        fetchEntityById: async (id) => {
            const response = await useSupabase().from('sources')
            .select('*')
            .eq('team_id', selectedTeam.id)
            .order('created_at', { ascending: false })
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