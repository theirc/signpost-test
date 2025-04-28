import { useState, useEffect } from "react"
import { api } from "@/api/getBots"
import { agentsModel } from "@/lib/data"

export interface BotEntry {
  id: string
  name: string
  history: any[]
  type: "api" | "agent"
}

export type BotsMap = Record<number, BotEntry>

export function useAllBots() {
  const [bots, setBots] = useState<BotsMap>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error|null>(null)

  useEffect(() => {
    let mounted = true

    async function load() {
      try {
        const sb = await api.getBots()
        const apiBots = Object.entries(sb).reduce<BotsMap>((acc, [id, name]) => {
          acc[+id] = { id, name, history: [], type: "api" }
          return acc
        }, {})

        const { data: adata, error: aerr } = await agentsModel.data.select("id, title")
        if (aerr) throw aerr
        const agentBots = (adata || []).reduce<BotsMap>((acc, a) => {
          acc[a.id] = { id: String(a.id), name: a.title, history: [], type: "agent" }
          return acc
        }, {})


        if (mounted) setBots({ ...apiBots, ...agentBots })
      } catch (err: any) {
        if (mounted) setError(err)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    load()
    return () => { mounted = false }
  }, [])

  return { bots, loading, error }
}
