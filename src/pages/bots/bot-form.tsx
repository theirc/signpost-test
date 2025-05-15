import { useNavigate } from "react-router-dom"
import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { EntityForm } from "@/components/ui/entity-form"
import { useTeamStore } from "@/lib/hooks/useTeam"
import { useSupabase } from "@/hooks/use-supabase"

const initialFormData = {
  name: "",
  collection: undefined,
  model: "",
  system_prompt: "",
  system_prompt_id: undefined,
  temperature: 0.7,
  active: true,
  translate_to_user_language: false,
  memory: false,
}

export function BotForm() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState(initialFormData)
  const [isLoading, setIsLoading] = useState(false)
  const { selectedTeam } = useTeamStore()

  const [collections, setCollections] = useState([])
  const [models, setModels] = useState([])
  const [systemPrompts, setSystemPrompts] = useState([])

  const fetchData = async () => {
    setIsLoading(true)
    const { data: collections, error: collectionsError } = await useSupabase().from('collections').select('*').eq('team_id', selectedTeam.id).order('created_at', { ascending: false })
    if (collectionsError) {
      console.error('Error fetching collections:', collectionsError)
    } else {
      setCollections(collections || [])
    }
    const { data: models, error: modelsError } = await useSupabase().from('models').select('*').order('created_at', { ascending: false })
    if (modelsError) {
      console.error('Error fetching models:', modelsError)
    } else {
      setModels(models || [])
    }
    const { data: systemPrompts, error: systemPromptsError } = await useSupabase().from('system_prompts').select('*').eq('team_id', selectedTeam.id).order('created_at', { ascending: false })
    if (systemPromptsError) {
      console.error('Error fetching system prompts:', systemPromptsError)
    } else {
      setSystemPrompts(systemPrompts || [])
    }
    setIsLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const cleanedData = { ...formData }

      if ('bot' in cleanedData) {
        delete cleanedData.bot
      }

      if (cleanedData.collection === "") {
        cleanedData.collection = undefined
      }

      if (cleanedData.system_prompt_id === "") {
        cleanedData.system_prompt_id = undefined
      }

      console.log('Submitting bot data (cleaned):', cleanedData)

      const result = await useSupabase().from('bots').insert([{ ...cleanedData, team_id: selectedTeam.id }]).select().single()

      console.log('Result:', result)

      if (result.error) {
        console.error('Error adding bot:', result.error)
        alert(`Error adding bot: ${result.error.message || JSON.stringify(result.error)}`)
        setIsLoading(false)
        return
      }

      navigate("/bots")
    } catch (error) {
      console.error('Error submitting form:', error)
      alert(`Error: ${error.message || JSON.stringify(error)}`)
      setIsLoading(false)
    }
  }

  return (
    <EntityForm
      title="Add New Bot"
      isLoading={isLoading}
      isFetching={false}
      onSubmit={handleSubmit}
      onCancel={() => navigate("/bots")}
    >
      <div className="space-y-4">
        {/* Name */}
        <div className="space-y-2">
          <Label htmlFor="name">Bot Name</Label>
          <Input
            id="name"
            value={formData.name || ''}
            onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
            required
          />
        </div>

        {/* Collection - Using standard HTML select */}
        <div className="space-y-2">
          <Label htmlFor="collection">Collection</Label>
          <select
            id="collection"
            className="w-full p-2 border rounded-md"
            value={formData.collection || ''}
            onChange={e => setFormData(prev => ({
              ...prev,
              collection: e.target.value || undefined
            }))}
          >
            <option value="">None</option>
            {collections.map(collection => (
              <option key={collection.id} value={collection.id}>
                {collection.name}
              </option>
            ))}
          </select>
        </div>

        {/* Model - Using standard HTML select */}
        <div className="space-y-2">
          <Label htmlFor="model">Model</Label>
          <select
            id="model"
            className="w-full p-2 border rounded-md"
            value={formData.model || ''}
            onChange={e => setFormData(prev => ({ ...prev, model: e.target.value }))}
            required
          >
            <option value="">Select LLM model</option>
            {models.map(m => (
              <option key={m.id} value={m.id}>
                {m.name} {m.provider ? `(${m.provider})` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* System Prompt */}
        <div className="space-y-2">
          <Label htmlFor="system_prompt">System Prompt</Label>
          <Textarea
            id="system_prompt"
            value={formData.system_prompt || ''}
            onChange={e => setFormData(prev => ({ ...prev, system_prompt: e.target.value }))}
          />
        </div>

        {/* System Prompt ID - Using standard HTML select */}
        <div className="space-y-2">
          <Label htmlFor="system_prompt_id">System Prompt Template</Label>
          <select
            id="system_prompt_id"
            className="w-full p-2 border rounded-md"
            value={formData.system_prompt_id || ''}
            onChange={e => setFormData(prev => ({
              ...prev,
              system_prompt_id: e.target.value || undefined
            }))}
          >
            <option value="">None</option>
            {systemPrompts.map(prompt => (
              <option key={prompt.id} value={prompt.id}>
                {prompt.name}
              </option>
            ))}ƒ
          </select>
        </div>

        {/* Temperature */}
        <div className="space-y-2">
          <Label htmlFor="temperature">Temperature ({formData.temperature})</Label>
          <Input
            id="temperature"
            type="number"
            step="0.01"
            value={formData.temperature}
            onChange={e => setFormData(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
          />
        </div>

        {/* Active */}
        <div className="flex items-center space-x-2">
          <Switch
            id="active"
            checked={formData.active}
            onCheckedChange={checked => setFormData(prev => ({ ...prev, active: checked }))}
          />
          <Label htmlFor="active">Active</Label>
        </div>

        {/* Translate to User Language */}
        <div className="flex items-center space-x-2">
          <Switch
            id="translate_to_user_language"
            checked={formData.translate_to_user_language}
            onCheckedChange={checked => setFormData(prev => ({ ...prev, translate_to_user_language: checked }))}
          />
          <Label htmlFor="translate_to_user_language">Translate to User Language</Label>
        </div>

        {/* Memory */}
        <div className="flex items-center space-x-2">
          <Switch
            id="memory"
            checked={formData.memory}
            onCheckedChange={checked => setFormData(prev => ({ ...prev, memory: checked }))}
          />
          <Label htmlFor="memory">Memory</Label>
        </div>
      </div>
    </EntityForm>
  )
}