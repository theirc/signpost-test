import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { useTeamStore } from '@/lib/hooks/useTeam'
import { Model } from './models'
import { supabase } from '@/lib/agents/db'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const PROVIDER_OPTIONS: { value: ModelProviders; label: string }[] = [
  { value: 'openai', label: 'OpenAI' },
  { value: 'anthropic', label: 'Anthropic' },
  { value: 'google', label: 'Google' },
  { value: 'groq', label: 'Groq' },
]

export default function ModelView() {
  const { id } = useParams()
  const { selectedTeam } = useTeamStore()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [model, setModel] = useState<Partial<Model>>({
    provider: '',
    title: '',
    model: '',
  })

  useEffect(() => {
    if (id && id !== 'new') {
      loadModel()
    }
  }, [id])

  const loadModel = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase.from("models").select("*").eq("id", id!).single()
      if (error) throw error
      if (data) setModel(data)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load model',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLoading(true)
      if (id !== 'new') {
        const { error } = await supabase.from("models").update(model).eq("id", id!).select().single()
        if (error) throw error
        toast({
          title: 'Success',
          description: 'Model updated successfully'
        })
      } else {
        const { error } = await supabase.from("models").insert([{
          ...model,
        }]).select().single()
        if (error) throw error
        toast({
          title: 'Success',
          description: 'Model created successfully'
        })
      }
      navigate('/settings/models')
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save model',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    try {
      setLoading(true)
      const { error } = await supabase.from("models").delete().eq("id", id!).select().single()
      if (error) throw error
      toast({
        title: 'Success',
        description: 'Model deleted successfully'
      })
      navigate('/settings/models')
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete model',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>{id !== 'new' ? 'Edit Model' : 'Create Model'}</CardTitle>
          <CardDescription>
            {id !== 'new' ? 'Update your model details' : 'Create a new AI model configuration'}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="provider">Provider</Label>
              <Select
                value={model.provider}
                onValueChange={(value) => setModel({ ...model, provider: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent>
                  {PROVIDER_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={model.title}
                onChange={(e) => setModel({ ...model, title: e.target.value })}
                placeholder="Enter model title"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="model">Model ID</Label>
              <Input
                id="model"
                value={model.model}
                onChange={(e) => setModel({ ...model, model: e.target.value })}
                placeholder="Enter model ID (e.g., gpt-4, claude-3-opus)"
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/settings/models')}
                disabled={loading}
              >
                Cancel
              </Button>
              {id && id !== 'new' && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button type="button" variant="destructive" disabled={loading}>
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the model.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : id !== 'new' ? 'Update' : 'Create'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
