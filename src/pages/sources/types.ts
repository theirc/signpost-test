import { Source } from '../knowledge'
import { LiveDataElement } from '@/types/common'

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

export type SourceDisplay = {
  id: string
  name: string
  type: string
  lastUpdated: string
  content: string
  tags: string[]
  vector: boolean
}

export type { Source, LiveDataElement }
