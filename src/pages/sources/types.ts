import { LiveDataElement, Source, SourceDisplay } from '@/lib/data/supabaseFunctions'

export type Tag = { 
  id: string
  name: string
}

export interface PreviewContent {
  id: string
  name: string
  content: string
  tags?: string[] | string
  liveDataElements?: LiveDataElement[]
  isLiveData?: boolean
}

export interface SelectedElementContent {
  title: string
  version: string
  status: string
  content: string
}

export type { Source, SourceDisplay, LiveDataElement } 