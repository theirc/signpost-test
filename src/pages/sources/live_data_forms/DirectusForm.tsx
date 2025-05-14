import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { FormComponentProps } from "./types"
import { CommonFields } from "./CommonFields"
import { ProcessingOptions } from "./ProcessingOptions"

export function DirectusForm({ form, updateForm }: FormComponentProps) {
  return (
    <>
      <CommonFields form={form} updateForm={updateForm} />
      
      <div className="grid grid-cols-4 items-center gap-4">
        <Label className="text-right">Map</Label>
        <Input
          className="col-span-3"
          value={form.map || ''}
          onChange={(e) => updateForm({ map: e.target.value })}
          placeholder="Enter map ID"
        />
      </div>
      
      <ProcessingOptions form={form} updateForm={updateForm} />
    </>
  )
} 