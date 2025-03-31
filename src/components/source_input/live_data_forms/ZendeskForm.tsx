import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { FormComponentProps } from "./types"
import { CommonFields } from "./CommonFields"
import { ProcessingOptions } from "./ProcessingOptions"

export function ZendeskForm({ form, updateForm }: FormComponentProps) {
  return (
    <>
      <CommonFields form={form} updateForm={updateForm} />
      
      <div className="grid grid-cols-4 items-center gap-4">
        <Label className="text-right">Subdomain</Label>
        <Input
          className="col-span-3"
          value={form.subdomain || ''}
          onChange={(e) => updateForm({ subdomain: e.target.value })}
          placeholder="your-company"
        />
      </div>
      
      <div className="grid grid-cols-4 items-center gap-4">
        <Label className="text-right">Email</Label>
        <Input
          className="col-span-3"
          type="email"
          value={form.email || ''}
          onChange={(e) => updateForm({ email: e.target.value })}
          placeholder="your-email@company.com"
        />
      </div>
      
      <div className="grid grid-cols-4 items-center gap-4">
        <Label className="text-right">API Token</Label>
        <Input
          className="col-span-3"
          type="password"
          value={form.apiToken || ''}
          onChange={(e) => updateForm({ apiToken: e.target.value })}
          placeholder="Enter your Zendesk API token"
        />
      </div>
      
      <div className="grid grid-cols-4 items-center gap-4">
        <Label className="text-right">Locale</Label>
        <Input
          className="col-span-3"
          value={form.locale || ''}
          onChange={(e) => updateForm({ locale: e.target.value })}
          placeholder="e.g. en-us, fr, de, ja"
        />
      </div>
      
      <ProcessingOptions form={form} updateForm={updateForm} />
    </>
  )
} 