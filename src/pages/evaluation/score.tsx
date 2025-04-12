import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { fetchBots, Bot, fetchCategories, ServiceCategory,  fetchBotScoreById, updateBotScore, addBotScore } from "@/lib/data/supabaseFunctions"
import { Loader2 } from "lucide-react"

export function ScoreForm() {
    const navigate = useNavigate()
    const { id } = useParams()
    const [isLoading, setIsLoading] = useState(false)
    const [isFetching, setIsFetching] = useState(false)
    const [bots, setBots] = useState<Bot[]>([])
    const [categories, setCategories] = useState<ServiceCategory[]>([])
    const [selectedBot, setSelectedBot] = useState<string>("")
    const [formData, setFormData] = useState({
        reporter: "",
        score: "",
        question: "",
        answer: "",
        bot: "",
        message: "",
        category: "",
        log_id: "",
    })

    useEffect(() => {
        const loadData = async () => {
            setIsFetching(true)
            const [botsResponse, categoriesResponse] = await Promise.all([
                fetchBots(),
                fetchCategories()
            ])

            if (botsResponse.error) {
                console.error("Error loading bots:", botsResponse.error)
            } else {
                setBots(botsResponse.data)
            }

            if (categoriesResponse.error) {
                console.error("Error loading categories:", categoriesResponse.error)
            } else {
                setCategories(categoriesResponse.data)
            }

            if (id && id !== "new") {
                const { data: score, error } = await fetchBotScoreById(id)
                if (error) {
                    console.error("Error loading log:", error)
                } else if (score) {
                    setSelectedBot(score.bot || "")
                    setFormData({
                        reporter: score.reporter,
                        score: score.score,
                        question: score.question,
                        answer: score.answer,
                        bot: score.bot,
                        message: score.message,
                        category: score.category,
                        log_id: score.log_id,
                    })
                } else {
                    console.log("No score found with ID:", id)
                }
            }
            setIsFetching(false)
        }
        loadData()
    }, [id])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            if (id && id !== "new") {
                const { error } = await updateBotScore(id, {
                    ...formData,
                    bot: selectedBot
                })
                if (error) throw error
            } else {
                const { error } = await addBotScore({
                    ...formData,
                    bot: selectedBot
                })
                if (error) throw error
            }
            navigate("/scores")
        } catch (error) {
            console.error("Error saving score:", error)
        } finally {
            setIsLoading(false)
        }
    }

    if (isFetching) {
        return (
            <div className="container mx-auto py-8">
                <div className="max-w-2xl mx-auto flex items-center justify-center h-[50vh]">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </div>
        )
    }

    return (
        <div className="container mx-auto py-8">
            <div className="max-w-2xl mx-auto">
                <h1 className="text-2xl font-bold mb-6">{id && id !== "new" ? "Edit Score" : "Add New Score"}</h1>
                <form onSubmit={handleSubmit} className="space-y-6">
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
                            id="search_term"
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

                    <div className="flex justify-end space-x-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => navigate("/scores")}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? "Saving..." : (id && id !== "new" ? "Update" : "Create")}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
} 