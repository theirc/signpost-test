import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { FormComponentProps } from "./types"
import { CommonFields } from "./CommonFields"
import { ProcessingOptions } from "./ProcessingOptions"

export function PromptForm({ form, updateForm }: FormComponentProps) {
  return (
    <>
      <CommonFields form={form} updateForm={updateForm} />
      
      <div className="grid grid-cols-4 items-center gap-4">
        <Label className="text-right">Prompt</Label>
        <Textarea
          className="col-span-3"
          value={form.prompt || ''}
          onChange={(e) => updateForm({ prompt: e.target.value })}
          placeholder={`Enter ${form.type} prompt...`}
        />
      </div>
      
      <ProcessingOptions form={form} updateForm={updateForm} />
    </>
  )
} 