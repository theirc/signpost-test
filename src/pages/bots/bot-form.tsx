import { useNavigate } from "react-router-dom"
import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { fetchModels, fetchCollections, fetchSystemPrompts, addBot } from "@/lib/data/supabaseFunctions"
import { EntityForm } from "@/components/ui/entity-form"

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

  const [collections, setCollections] = useState([])
  const [models, setModels] = useState([])
  const [systemPrompts, setSystemPrompts] = useState([])
  const [collectionsLoading, setCollectionsLoading] = useState(true)
  const [modelsLoading, setModelsLoading] = useState(true)
  const [systemPromptsLoading, setSystemPromptsLoading] = useState(true)

  useEffect(() => {
    setCollectionsLoading(true)
    fetchCollections()
      .then(res => {
        if (res.error) {
          console.error('Error fetching collections:', res.error)
        } else {
          setCollections(res.data || [])
        }
        setCollectionsLoading(false)
      })
      .catch(err => {
        console.error('Error fetching collections:', err)
        setCollectionsLoading(false)
      })
  }, [])

  useEffect(() => {
    setModelsLoading(true)
    fetchModels()
      .then(res => {
        if (res.error) {
          console.error('Error fetching models:', res.error)
        } else {
          setModels(res.data || [])
        }
        setModelsLoading(false)
      })
      .catch(err => {
        console.error('Error fetching models:', err)
        setModelsLoading(false)
      })
  }, [])

  useEffect(() => {
    setSystemPromptsLoading(true)
    if (typeof fetchSystemPrompts === 'function') {
      fetchSystemPrompts()
        .then(res => {
          if (res.error) {
            console.error('Error fetching system prompts:', res.error)
          } else {
            setSystemPrompts(res.data || [])
          }
          setSystemPromptsLoading(false)
        })
        .catch(err => {
          console.error('Error fetching system prompts:', err)
          setSystemPromptsLoading(false)
        })
    } else {
      setSystemPrompts([])
      setSystemPromptsLoading(false)
    }
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
      
      const result = await addBot(cleanedData)
      
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
            {collectionsLoading ? (
              <option value="" disabled>Loading collections...</option>
            ) : (
              collections.map(collection => (
                <option key={collection.id} value={collection.id}>
                  {collection.name}
                </option>
              ))
            )}
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
            {modelsLoading ? (
              <option value="" disabled>Loading models...</option>
            ) : (
              models.map(m => (
                <option key={m.id} value={m.id}>
                  {m.name} {m.provider ? `(${m.provider})` : ''}
                </option>
              ))
            )}
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
            {systemPromptsLoading ? (
              <option value="" disabled>Loading system prompts...</option>
            ) : (
              systemPrompts.map(prompt => (
                <option key={prompt.id} value={prompt.id}>
                  {prompt.name}
                </option>
              ))
            )}
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