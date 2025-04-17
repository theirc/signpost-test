import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { fetchBots, Bot, fetchCategories, ServiceCategory } from "@/lib/data/supabaseFunctions"

interface UseEntityFormProps {
    id?: string
    fetchEntityById: (id: string) => Promise<{ data: any; error: any }>
    updateEntity: (id: string, data: any) => Promise<{ error: any }>
    createEntity: (data: any) => Promise<{ error: any }>
    redirectPath: string
    initialFormData: any
}

export function useEntityForm({
    id,
    fetchEntityById,
    updateEntity,
    createEntity,
    redirectPath,
    initialFormData
}: UseEntityFormProps) {
    const navigate = useNavigate()
    const [isLoading, setIsLoading] = useState(false)
    const [isFetching, setIsFetching] = useState(false)
    const [bots, setBots] = useState<Bot[]>([])
    const [categories, setCategories] = useState<ServiceCategory[]>([])
    const [selectedBot, setSelectedBot] = useState<string>("")
    const [formData, setFormData] = useState(initialFormData)

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
                const { data: entity, error } = await fetchEntityById(id)
                if (error) {
                    console.error("Error loading entity:", error)
                } else if (entity) {
                    setSelectedBot(entity.bot || "")
                    setFormData(entity)
                }
            }
            setIsFetching(false)
        }
        loadData()
    }, [id, fetchEntityById])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            if (id && id !== "new") {
                const { error } = await updateEntity(id, {
                    ...formData,
                    bot: selectedBot
                })
                if (error) throw error
            } else {
                const { error } = await createEntity({
                    ...formData,
                    bot: selectedBot
                })
                if (error) throw error
            }
            navigate(redirectPath)
        } catch (error) {
            console.error("Error saving entity:", error)
        } finally {
            setIsLoading(false)
        }
    }

    return {
        isLoading,
        isFetching,
        bots,
        categories,
        selectedBot,
        setSelectedBot,
        formData,
        setFormData,
        handleSubmit
    }
} 