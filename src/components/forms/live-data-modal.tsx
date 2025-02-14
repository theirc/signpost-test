import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface LiveDataModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function LiveDataModal({ open, onOpenChange }: LiveDataModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Live Data Source Configuration</DialogTitle>
          <DialogDescription>
            Configure and manage your live data sources for real-time data processing.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="source-name" className="text-right">Source Name</Label>
            <Select>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select source type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="zendesk">Zendesk</SelectItem>
                <SelectItem value="perplexity">Perplexity</SelectItem>
                <SelectItem value="directus">Directus</SelectItem>
                <SelectItem value="exa">Exa</SelectItem>
                <SelectItem value="web-scraping">Web Scraping</SelectItem>
                <SelectItem value="bot-logs">Bot Logs</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="submit">Add</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 