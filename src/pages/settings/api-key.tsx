import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { fetchApiKeyById, addApiKey, updateApiKey, deleteApiKey } from '@/lib/data/supabaseFunctions'
import { ApiKey } from '@/lib/data/supabaseFunctions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'

export default function ApiKeyView() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [apiKey, setApiKey] = useState<Partial<ApiKey>>({
    type: '',
    description: '',
    team_id: ''
  })

  useEffect(() => {
    if (id && id !== 'new') {
      loadApiKey()
    }
  }, [id])

  const loadApiKey = async () => {
    try {
      setLoading(true)
      const { data, error } = await fetchApiKeyById(id!)
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
        const { error } = await updateApiKey(id, apiKey)
        if (error) throw error
        toast({
          title: 'Success',
          description: 'API key updated successfully'
        })
      } else {
        const { error } = await addApiKey(apiKey)
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
      const { error } = await deleteApiKey(id!)
      if (error) throw error
      toast({
        title: 'Success',
        description: 'API key deleted successfully'
      })
      navigate('/settings/api-keys')
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
              <Input
                id="type"
                value={apiKey.type}
                onChange={(e) => setApiKey({ ...apiKey, type: e.target.value })}
                placeholder="Enter API key type"
                required
              />
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
