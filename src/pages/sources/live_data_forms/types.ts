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
  chunk_size?: number
  chunk_overlap?: number
  max_token_limit?: number
  include_urls?: boolean
  extract_media_content?: boolean
  retrieve_links?: boolean
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