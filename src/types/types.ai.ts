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

export interface ChatMessage {
  type?: "human" | "bot"
  id?: number
  message?: string
  botName?: string
  isAnswer?: boolean
  isContacts?: boolean
  messages?: ChatMessage[]
  docs?: DocumentReference[]
  error?: string
  command?: "rebuild" | null
  needsRebuild?: boolean
  rebuild?(): void
  question?: string
  logID?: number
  audio?: any
  tts?: boolean
}

export type AI_SCORES = "pass" | "fail" | "redflag"

export interface BotQualification {
  id: number
  score?: AI_SCORES
  reporter?: string
  result?: string
  question?: string
  answer?: string
  failtype?: string[]
  qualitymetrics?: string[]
  prompttype?: string
  moderatorresponse?: string
  traumametrics?: number
  clientmetrics?: number
  safetymetric?: string
  logid?: string
}