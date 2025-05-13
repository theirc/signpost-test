import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { FormComponentProps } from "./types"

export function CommonFields({ form, updateForm }: FormComponentProps) {
  return (
    <>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="source-name" className="text-right">Name</Label>
        <Input
          id="source-name"
          className="col-span-3"
          value={form.name}
          onChange={(e) => updateForm({ name: e.target.value })}
          placeholder="Enter source name"
        />
      </div>

      <div className="grid grid-cols-4 items-center gap-4">
        <Label className="text-right">Enabled</Label>
        <div className="col-span-3">
          <Switch
            checked={form.enabled}
            onCheckedChange={(enabled) => updateForm({ enabled })}
          />
        </div>
      </div>
    </>
  )
} 