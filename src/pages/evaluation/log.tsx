import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { addBotLog, fetchBots, Bot, fetchCategories, ServiceCategory, fetchBotLogById, updateBotLog } from "@/lib/data/supabaseFunctions"
import { Loader2 } from "lucide-react"

export function LogForm() {
    const navigate = useNavigate()
    const { id } = useParams()
    const [isLoading, setIsLoading] = useState(false)
    const [isFetching, setIsFetching] = useState(false)
    const [bots, setBots] = useState<Bot[]>([])
    const [categories, setCategories] = useState<ServiceCategory[]>([])
    const [selectedBot, setSelectedBot] = useState<string>("")
    const [formData, setFormData] = useState({
        user_message: "",
        answer: "",
        category: "",
        detected_language: "",
        detected_location: "",
        search_term: ""
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
                const { data: log, error } = await fetchBotLogById(id)
                if (error) {
                    console.error("Error loading log:", error)
                } else if (log) {
                    setSelectedBot(log.bot || "")
                    setFormData({
                        user_message: log.user_message || "",
                        answer: log.answer || "",
                        category: log.category || "",
                        detected_language: log.detected_language || "",
                        detected_location: log.detected_location || "",
                        search_term: log.search_term || ""
                    })
                } else {
                    console.log("No log found with ID:", id)
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
                const { error } = await updateBotLog(id, {
                    bot: selectedBot,
                    ...formData
                })
                if (error) throw error
            } else {
                const { error } = await addBotLog({
                    bot: selectedBot,
                    ...formData
                })
                if (error) throw error
            }
            navigate("/logs")
        } catch (error) {
            console.error("Error saving log:", error)
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
                <h1 className="text-2xl font-bold mb-6">{id && id !== "new" ? "Edit Log" : "Add New Log"}</h1>
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

                    <div className="flex justify-end space-x-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => navigate("/logs")}
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