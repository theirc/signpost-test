import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/data/supabaseFunctions"
import { useTeamStore } from "@/lib/hooks/useTeam"

interface LiveDataModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export function LiveDataModal({ open, onClose, onSuccess }: LiveDataModalProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [config, setConfig] = useState("")
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const { selectedTeam } = useTeamStore()

  const handleSubmit = async () => {
    if (!name || !config) return

    setLoading(true)
    try {
      // Create the source
      const { data: source, error: sourceError } = await supabase
        .from("sources")
        .insert({
          name,
          description,
          type: "Live Data",
          team_id: selectedTeam?.id,
          tags: ["Live Data"],
          content: config
        })
        .select()
        .single()

      if (sourceError) throw sourceError

      toast({
        title: "Success",
        description: "Live data source created successfully"
      })

      onSuccess()
      onClose()
    } catch (error) {
      console.error("Error creating live data source:", error)
      toast({
        title: "Error",
        description: "Failed to create live data source",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Live Data Source</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter source name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter source description"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="config">Configuration (JSON)</Label>
            <Textarea
              id="config"
              value={config}
              onChange={(e) => setConfig(e.target.value)}
              placeholder="Enter configuration in JSON format"
              rows={5}
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!name || !config || loading}>
              {loading ? "Creating..." : "Create"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 