import { useParams, useNavigate } from "react-router-dom"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { fetchBotById, updateBot, addBot } from "@/lib/data/supabaseFunctions"
import { EntityForm } from "@/components/ui/entity-form"
import { useEntityForm } from "@/hooks/use-entity-form"
import { Textarea } from "@/components/ui/textarea"

const initialFormData = {
    name: "",
    model: "",
    collection: "",
    system_prompt: "",
    system_prompt_id: "",
    temperature: 0.7
}

export function BotForm() {
    const { id } = useParams()
    const navigate = useNavigate()
    
    const {
        isLoading,
        isFetching,
        bots,
        categories,
        selectedBot,
        setSelectedBot,
        formData,
        setFormData,
        handleSubmit
    } = useEntityForm({
        id,
        fetchEntityById: fetchBotById,
        updateEntity: updateBot,
        createEntity: addBot,
        redirectPath: "/bots",
        initialFormData
    })

    return (
        <EntityForm
            title={id && id !== "new" ? "Edit Bot" : "Add New Bot"}
            isLoading={isLoading}
            isFetching={isFetching}
            onSubmit={handleSubmit}
            onCancel={() => navigate("/bots")}
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
                <Label htmlFor="model">Model</Label>
                <Select
                    value={formData.model}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, model: value }))}
                    required
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Select a model" />
                    </SelectTrigger>
                    <SelectContent>
                        {categories.map((model) => (
                            <SelectItem key={model.id} value={model.id}>
                                {model.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label htmlFor="collection">Collection</Label>
                <Select
                    value={formData.collection}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, collection: value }))}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Select a collection" />
                    </SelectTrigger>
                    <SelectContent>
                        {categories.map((collection) => (
                            <SelectItem key={collection.id} value={collection.id}>
                                {collection.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label htmlFor="system_prompt">System Prompt</Label>
                <Textarea
                    id="system_prompt"
                    value={formData.system_prompt}
                    onChange={(e) => setFormData(prev => ({ ...prev, system_prompt: e.target.value }))}
                    className="min-h-[150px]"
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="temperature">Temperature</Label>
                <Input
                    id="temperature"
                    type="number"
                    min="0"
                    max="1"
                    step="0.1"
                    value={formData.temperature}
                    onChange={(e) => setFormData(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
                />
            </div>
        </EntityForm>
    )
} 