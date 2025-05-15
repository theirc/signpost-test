import { useParams, useNavigate } from "react-router-dom"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { EntityForm } from "@/components/ui/entity-form"
import { useEntityForm } from "@/hooks/use-entity-form"
import { useTeamStore } from "@/lib/hooks/useTeam"
import { supabase } from "@/lib/agents/db"

export interface BotScore {
    id: string
    reporter?: string
    score?: string
    question?: string
    answer?: string
    bot?: string
    message?: string
    category?: string
    created_at?: string
    bot_name?: string
    category_name?: string
    log_id?: string
}

const initialFormData = {
    reporter: "",
    score: "",
    question: "",
    answer: "",
    bot: "",
    message: "",
    category: "",
    log_id: "",
}

const updateBotScore = async (id: string, scoreData: Partial<BotScore>, teamId: string) => {
    const { data, error } = await supabase.from('bot_scores')
        .update({ ...scoreData, team_id: teamId })
        .eq('id', id)
        .eq('team_id', teamId)
        .select()
        .single()
    return { data, error }
}

const addBotScore = async (scoreData: Partial<BotScore>, teamId: string) => {
    const { data, error } = await supabase.from('bot_scores')
        .insert([{ ...scoreData, team_id: teamId }])
        .select()
        .single()
    return { data, error }
}

const fetchBotScoreById = async (id: string, teamId: string) => {
    const { data, error } = await supabase.from('bot_scores')
        .select(`
      *,
      bots (
        name
      ),
      service_categories (
        name
      )
    `)
        .eq('id', id)
        .eq('team_id', teamId)
        .single()
    return { data, error }
}

export function ScoreForm() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { selectedTeam } = useTeamStore()

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
        fetchEntityById: fetchBotScoreById,
        updateEntity: updateBotScore,
        createEntity: addBotScore,
        redirectPath: "/scores",
        initialFormData
    })

    return (
        <EntityForm
            title={id && id !== "new" ? "Edit Score" : "Add New Score"}
            isLoading={isLoading}
            isFetching={isFetching}
            onSubmit={handleSubmit}
            onCancel={() => navigate("/scores")}
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
                <Label htmlFor="reporter">Reporter</Label>
                <Input
                    id="reporter"
                    value={formData.reporter}
                    onChange={(e) => setFormData(prev => ({ ...prev, reporter: e.target.value }))}
                    required
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="score">Score</Label>
                <Input
                    id="score"
                    value={formData.score}
                    onChange={(e) => setFormData(prev => ({ ...prev, score: e.target.value }))}
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
                <Label htmlFor="question">Question</Label>
                <Input
                    id="question"
                    value={formData.question}
                    onChange={(e) => setFormData(prev => ({ ...prev, question: e.target.value }))}
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="answer">Answer</Label>
                <Input
                    id="answer"
                    value={formData.answer}
                    onChange={(e) => setFormData(prev => ({ ...prev, answer: e.target.value }))}
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Input
                    id="message"
                    value={formData.message}
                    onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="log_id">Log ID</Label>
                <Input
                    id="log_id"
                    value={formData.log_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, log_id: e.target.value }))}
                />
            </div>
        </EntityForm>
    )
} 