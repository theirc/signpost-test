import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useTeamStore } from "@/lib/hooks/useTeam"
import { supabase } from "@/lib/agents/db"
import { Json } from "@/lib/agents/supabase"

interface Bot {
    id: string
    name: string
}

interface ServiceCategory {
    created_at: string
    description: string | null
    id: string
    name: string | null
    translations: Json[] | null
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
    const [categories, setCategories] = useState<ServiceCategory[]>([])
    const [bots, setBots] = useState<Bot[]>([])
    const [selectedBot, setSelectedBot] = useState<string>("")
    const [formData, setFormData] = useState(initialFormData)

    useEffect(() => {
        const loadData = async () => {
            setIsFetching(true)
            
            // Load categories
            const categoriesResponse = await supabase.from('service_categories')
                .select('*')
                .order('created_at', { ascending: false })

            if (categoriesResponse.error) {
                console.error("Error loading categories:", categoriesResponse.error)
            } else {
                setCategories(categoriesResponse.data)
            }
            
            // Load bots (empty array since bots are deprecated)
            setBots([])

            if (id && id !== "new") {
                const { data: entity, error } = await fetchEntityById(id, selectedTeam.id)
                if (error) {
                    console.error("Error loading entity:", error)
                } else if (entity) {
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
        formData.service_categories = undefined
        formData.category_name = undefined
        console.log(formData)

        try {
            if (id && id !== "new") {
                const { error } = await updateEntity(id, formData, selectedTeam.id)
                if (error) throw error
            } else {
                const { error } = await createEntity(formData, selectedTeam.id)
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
        categories,
        bots,
        selectedBot,
        setSelectedBot,
        formData,
        setFormData,
        handleSubmit
    }
}
