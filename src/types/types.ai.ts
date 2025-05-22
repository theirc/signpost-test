export { }

export interface DocumentReference {
  pageContent?: string
  metadata: {
    source?: string
    title?: string
    id?: number
    loc?: {
      lines?: {
        from?: number
        to?: number
      }
    }
  }
}

export interface BotHistory {
  isHuman: boolean
  message: string
}

export interface SourceReference {
  sourceId: string;
  textChunk: string;
  startIndex: number;
  endIndex: number;
}

export interface ChatMessage {
  type?: "human" | "bot"
  id?: number
  message?: string
  botName?: string
  isAnswer?: boolean
  isContacts?: boolean
  messages?: ChatMessage[]
  docs?: DocumentReference[]
  references?: SourceReference[]
  error?: string
  command?: "rebuild" | null
  needsRebuild?: boolean
  rebuild?(): void
  question?: string
  logID?: number
  audio?: any
  tts?: boolean
}

