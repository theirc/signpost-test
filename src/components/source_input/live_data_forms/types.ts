// Form state interface
export interface FormState {
  name: string
  type: string
  enabled: boolean
  url?: string
  subdomain?: string
  email?: string
  apiToken?: string
  locale?: string
  map?: string
  prompt?: string
  bot_log?: string
}

export const DEFAULT_FORM_STATE: FormState = {
  name: "",
  type: "",
  enabled: true,
  locale: "en-us"
}

export interface FormComponentProps {
  form: FormState
  updateForm: (updates: Partial<FormState>) => void
} 