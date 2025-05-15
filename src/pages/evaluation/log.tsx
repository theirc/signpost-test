import { useParams, useNavigate } from "react-router-dom"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { EntityForm } from "@/components/ui/entity-form"
import { useEntityForm } from "@/hooks/use-entity-form"
import { useSupabase } from "@/hooks/use-supabase"

export interface BotLog {
    id: string
    bot?: string
    created_at?: string
    detected_language?: string
    detected_location?: string
    search_term?: string
    user_message?: string
    answer?: string
    category?: string
}

const initialFormData = {
    user_message: "",
    answer: "",
    category: "",
    detected_language: "",
    detected_location: "",
    search_term: ""
}

const updateBotLog = async (id: string, logData: Partial<BotLog>) => {
    const { data, error } = await useSupabase().from('bot_logs').update(logData).eq('id', id).select().single()
    return { data, error }
}

const addBotLog = async (logData: Partial<BotLog>, teamId: string) => {
    const { data, error } = await useSupabase().from('bot_logs').insert([{ ...logData, team_id: teamId }]).select().single()
    return { data, error }
}

const fetchBotLogById = async (id: string, teamId: string) => {
    const { data, error } = await useSupabase().from('bot_logs').select('*').eq('id', id).eq('team_id', teamId).single()
    return { data, error }
}

export function LogForm() {
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
        fetchEntityById: fetchBotLogById,
        updateEntity: updateBotLog,
        createEntity: addBotLog,
        redirectPath: "/logs",
        initialFormData
    })

    return (
        <EntityForm
            title={id && id !== "new" ? "Edit Log" : "Add New Log"}
            isLoading={isLoading}
            isFetching={isFetching}
            onSubmit={handleSubmit}
            onCancel={() => navigate("/logs")}
        >
            <div className="space-y-2">
                <Label htmlFor="bot">Bot</Label>
                <Select
                    value={selectedBot}
                    onValueChange={setSelectedBot}
                    required
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Select a bot" />
                    </SelectTrigger>
                    <SelectContent>
                        {bots.map((bot) => (
                            <SelectItem key={bot.id} value={bot.id}>
                                {bot.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label htmlFor="user_message">User Message</Label>
                <Input
                    id="user_message"
                    value={formData.user_message}
                    onChange={(e) => setFormData(prev => ({ ...prev, user_message: e.target.value }))}
                    required
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="answer">Answer</Label>
                <Input
                    id="answer"
                    value={formData.answer}
                    onChange={(e) => setFormData(prev => ({ ...prev, answer: e.target.value }))}
                    required
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                    required
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                        {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                                {category.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label htmlFor="detected_language">Detected Language</Label>
                <Input
                    id="detected_language"
                    value={formData.detected_language}
                    onChange={(e) => setFormData(prev => ({ ...prev, detected_language: e.target.value }))}
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="detected_location">Detected Location</Label>
                <Input
                    id="detected_location"
                    value={formData.detected_location}
                    onChange={(e) => setFormData(prev => ({ ...prev, detected_location: e.target.value }))}
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="search_term">Search Term</Label>
                <Input
                    id="search_term"
                    value={formData.search_term}
                    onChange={(e) => setFormData(prev => ({ ...prev, search_term: e.target.value }))}
                />
            </div>
        </EntityForm>
    )
} 