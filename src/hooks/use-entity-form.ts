import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useTeamStore } from "@/lib/hooks/useTeam"
import { useSupabase } from "./use-supabase"
import { Bot } from "@/pages/bots/bots"

interface ServiceCategory {
    id: string
    name?: string
    created_at?: string
    description?: string
    translations?: {
        language: string
        name: string
        description: string
    }[]
}

interface UseEntityFormProps {
    id?: string
    fetchEntityById: (id: string, teamId: string) => Promise<{ data: any; error: any }>
    updateEntity: (id: string, data: any, teamId: string) => Promise<{ error: any }>
    createEntity: (data: any, teamId: string) => Promise<{ error: any }>
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
    const { selectedTeam } = useTeamStore()
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
                useSupabase().from('bots').select('*').eq('team_id', selectedTeam.id).order('created_at', { ascending: false }),
                useSupabase().from('service_categories')
                    .select('*')
                    .order('created_at', { ascending: false })
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
                const { data: entity, error } = await fetchEntityById(id, selectedTeam.id)
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
        formData.bots = undefined
        formData.service_categories = undefined
        formData.bot_name = undefined
        formData.category_name = undefined
        console.log(formData)

        try {
            if (id && id !== "new") {
                const { error } = await updateEntity(id, {
                    ...formData,
                    bot: selectedBot
                }, selectedTeam.id)
                if (error) throw error
            } else {
                const { error } = await createEntity({
                    ...formData,
                    bot: selectedBot
                }, selectedTeam.id)
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