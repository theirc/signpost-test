import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { useTeamStore } from '@/lib/hooks/useTeam'
import { ApiKey } from './api-keys'
import { supabase } from '@/lib/agents/db'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function ApiKeyView() {
  const { id } = useParams()
  const { selectedTeam } = useTeamStore()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [apiKey, setApiKey] = useState<Partial<ApiKey>>({
    type: 'default',
    description: '',
    team_id: '',
    key: ''
  })

  useEffect(() => {
    if (id && id !== 'new') {
      loadApiKey()
    }
  }, [id])

  const loadApiKey = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase.from("api_keys").select("*").eq("id", id!).single()
      if (error) throw error
      if (data) setApiKey(data)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load API key',
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
        const { error } = await supabase.from("api_keys").update(apiKey).eq("id", id!).select().single()
        if (error) throw error
        toast({
          title: 'Success',
          description: 'API key updated successfully'
        })
      } else {
        const { error } = await supabase.from("api_keys").insert([{
          ...apiKey,
          type: apiKey.type || 'default',
          team_id: selectedTeam.id
        }]).select().single()
        if (error) throw error
        toast({
          title: 'Success',
          description: 'API key created successfully'
        })
      }
      navigate('/settings/apikeys')
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save API key',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    try {
      setLoading(true)
      const { error } = await supabase.from("api_keys").delete().eq("id", id!).select().single()
      if (error) throw error
      toast({
        title: 'Success',
        description: 'API key deleted successfully'
      })
      navigate('/settings/apikeys')
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete API key',
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
          <CardTitle>{id ? 'Edit API Key' : 'Create API Key'}</CardTitle>
          <CardDescription>
            {id ? 'Update your API key details' : 'Create a new API key for your application'}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select
                defaultValue={apiKey.type}
                onValueChange={(value) => setApiKey({ ...apiKey, type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select API key type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="openai">OpenAI</SelectItem>
                  <SelectItem value="anthropic">Anthropic</SelectItem>
                  <SelectItem value="google">Google</SelectItem>
                  <SelectItem value="deepseek">DeepSeek</SelectItem>
                  <SelectItem value="groq">Groq</SelectItem>
                  <SelectItem value="xai">XAI</SelectItem>
                  <SelectItem value="zendesk">Zendesk</SelectItem>
                  <SelectItem value="googleTranslate">Google Translate</SelectItem>
                  <SelectItem value="exa">Exa</SelectItem>
                  <SelectItem value="perplexity">Perplexity</SelectItem>
                  <SelectItem value="databricks">Databricks</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={apiKey.description}
                onChange={(e) => setApiKey({ ...apiKey, description: e.target.value })}
                placeholder="Enter API key description"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="key">Key</Label>
              <Input
                id="key"
                value={apiKey.key}
                onChange={(e) => setApiKey({ ...apiKey, key: e.target.value })}
                placeholder="Enter API key"
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/settings/apikeys')}
                disabled={loading}
              >
                Cancel
              </Button>
              {id && (
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
                        This action cannot be undone. This will permanently delete the API key.
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
