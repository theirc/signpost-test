import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { FormComponentProps } from "./types"
import { CommonFields } from "./CommonFields"
import { ProcessingOptions } from "./ProcessingOptions"

export function BotLogsForm({ form, updateForm }: FormComponentProps) {
  return (
    <>
      <CommonFields form={form} updateForm={updateForm} />
      
      <div className="grid grid-cols-4 items-center gap-4">
        <Label className="text-right">Bot Log ID</Label>
        <Input
          className="col-span-3"
          value={form.bot_log || ''}
          onChange={(e) => updateForm({ bot_log: e.target.value })}
          placeholder="Enter bot log ID"
        />
      </div>
      
      <ProcessingOptions form={form} updateForm={updateForm} />
    </>
  )
} 