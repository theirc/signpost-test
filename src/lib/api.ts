// const serverurl = "http://localhost:3000"
const serverurl = "https://directus-qa-support.azurewebsites.net"


export const api = {

  // getCountry: (country: number) => getFromServer<Country>(`${serverurl}/country/${country}`),
  getServices: (country: number, since = 0) => getFromServer<Service[]>(`${serverurl}/services/${country}/${since}`),
  getProviders: (country: number) => getFromServer<Provider[]>(`${serverurl}/providers/${country}`),
  getCategories: () => getFromServer<Categories>(`${serverurl}/categories`),
  getBots: () => getFromServer<{ [index: number]: string }>(`${serverurl}/bots`),
  getArticles: (country: number) => getFromServer<{ [index: string]: ZendeskCategory }>(`${serverurl}/articles/${country}`),
  getAttachments: (country: number, article: number) => getFromServer<ZendeskArticleAttachment[]>(`${serverurl}/attachments/${country}/${article}`),



  getCountry(country: number) {

    let preview = ""

    try {
      let params = new URL(document.location.toString()).searchParams
      let name = params.get("preview")
      preview = name ? "/preview" : ""
    } catch (error) { }

    return getFromServer<Country>(`${serverurl}/country/${country}${preview}`)


  },

  async askbot(req: ChatMessage, bots: { label: string, value: number, history: BotHistory[] }[]) {

    console.log("Request: ", bots)

    let answer: ChatMessage = {
      type: "bot",
      messages: [],
      question: req.message
    }

    if (!bots.length) return answer

    for (const b of bots) {

      let a: ChatMessage = {}

      const breq = { ...req, id: b.value, history: b.history }

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

  async qualifyBot(r: BotQualification) {

    let options = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(r)
    }

    try {
      await fetch(`${serverurl}/qualifybot/`, options).then(r => r.json())
    } catch (error) {
      console.log("Error Scoring Bot", error)
    }

  },


}

async function getFromServer<T>(url: string): Promise<Awaited<T>> {
  let ret: any = null

  console.log("Loading from Server: ", url)

  try {
    ret = await fetch(url).then(r => r.json())
  } catch (error) {
    console.log(`Error Loading ${url}`, error)
  }

  console.log("Loaded from Server: ", ret)


  return ret
}



