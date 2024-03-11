// const serverurl = "http://localhost:3000"
const serverurl = "https://directus-qa-support.azurewebsites.net"

interface Doc {
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

declare global {

  interface ChatMessage {
    type?: "human" | "bot"
    id?: number
    message?: string
    botName?: string
    isAnswer?: boolean
    messages?: ChatMessage[]
    docs?: Doc[]
    error?: string
    command?: "rebuild" | null
    needsRebuild?: boolean
    rebuild?(): void
    question?: string
  }

}


export const api = {

  async getCountry(id: number) {

    let c: Country = null

    try {
      c = await fetch(`${serverurl}/country/${id}`).then(r => r.json())
    } catch (error) {
      console.log("Error Loading Country", error)
    }

    return c
  },

  async getServices(id: number, since?: number, page?: number): Promise<Service[]> {

    let c: Service[] = null

    //ToDo: add page and since!

    try {
      c = await fetch(`${serverurl}/services/${id}`).then(r => r.json())
    } catch (error) {
      console.log("Error Loading Services", error)
    }

    return c
  },

  async getCategories() {

    let cats: Categories = null

    try {
      cats = await fetch(`${serverurl}/categories`).then(r => r.json())
    } catch (error) {
      console.log("Error Loading Categories", error)
    }

    return cats
  },

  async getBots(): Promise<{ [index: number]: string }> {

    let bots = {}

    try {
      bots = await fetch(`${serverurl}/bots`).then(r => r.json())
    } catch (error) {
      console.log("Error Loading Bots", error)
    }

    return bots

  },

  async askbot(req: ChatMessage, bots: { label: string, value: number }[]) {

    let answer: ChatMessage = {
      type: "bot",
      messages: [],
      question: req.message
    }

    if (!bots.length) return answer

    for (const b of bots) {

      let a: ChatMessage = {}

      const breq = { ...req, id: b.value }

      let options = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(breq)
      }

      try {
        a = await fetch(`${serverurl}/ai/`, options).then(r => r.json())
      } catch (error) {
        a.error = error?.toString() ?? "Error"
        console.log("Error Contacting Bot", error)
      }

      if (a.error) a.message = a.error
      a.type = "bot"
      a.id = b.value
      a.botName = b.label
      a.question = req.message
      answer.messages.push(a)

    }

    return answer
  },

  async qualifyBot(id: number, positive: boolean, reporter: string, result: string, question: string, answer: string) {

    const r = {
      id,
      positive,
      reporter,
      result,
      question,
      answer,
    }

    let options = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(r)
    }

    try {
      console.log(r)

      await fetch(`${serverurl}/qualifybot/`, options).then(r => r.json())
    } catch (error) {
      console.log("Error Scoring Bot", error)
    }

  },


}