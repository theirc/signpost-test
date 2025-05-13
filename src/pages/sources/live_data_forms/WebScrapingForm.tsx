import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { FormComponentProps } from "./types"
import { CommonFields } from "./CommonFields"

export function WebScrapingForm({ form, updateForm }: FormComponentProps) {
  return (
    <>
      <CommonFields form={form} updateForm={updateForm} />
      
      <div className="grid grid-cols-4 items-center gap-4">
        <Label className="text-right">URL</Label>
        <Input
          className="col-span-3"
          value={form.url || ''}
          onChange={(e) => updateForm({ url: e.target.value })}
          placeholder="https://example.com"
        />
      </div>
    </>
  )
} 