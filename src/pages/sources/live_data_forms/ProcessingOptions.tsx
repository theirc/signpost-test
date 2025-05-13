import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { FormComponentProps } from "./types"

export function ProcessingOptions({ form, updateForm }: FormComponentProps) {
  return (
    <div className="mt-6 border-t pt-4">
      <h3 className="text-sm font-medium mb-4">Processing Options</h3>
      <div className="space-y-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label className="text-right">Chunk Size</Label>
          <Input
            type="number"
            className="col-span-3"
            value={form.chunk_size || 1500}
            onChange={(e) => updateForm({ chunk_size: parseInt(e.target.value) || 1500 })}
            placeholder="Size of text chunks"
          />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label className="text-right">Chunk Overlap</Label>
          <Input
            type="number"
            className="col-span-3"
            value={form.chunk_overlap || 200}
            onChange={(e) => updateForm({ chunk_overlap: parseInt(e.target.value) || 200 })}
            placeholder="Overlap between chunks"
          />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label className="text-right">Max Token Limit</Label>
          <Input
            type="number"
            className="col-span-3"
            value={form.max_token_limit || 2000}
            onChange={(e) => updateForm({ max_token_limit: parseInt(e.target.value) || 2000 })}
            placeholder="Maximum tokens per chunk"
          />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label className="text-right">Include URLs</Label>
          <div className="col-span-3">
            <Switch
              checked={form.include_urls}
              onCheckedChange={(include_urls) => updateForm({ include_urls })}
            />
          </div>
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label className="text-right">Extract Media</Label>
          <div className="col-span-3">
            <Switch
              checked={form.extract_media_content}
              onCheckedChange={(extract_media_content) => updateForm({ extract_media_content })}
            />
          </div>
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label className="text-right">Retrieve Links</Label>
          <div className="col-span-3">
            <Switch
              checked={form.retrieve_links}
              onCheckedChange={(retrieve_links) => updateForm({ retrieve_links })}
            />
          </div>
        </div>
      </div>
    </div>
  )
} 