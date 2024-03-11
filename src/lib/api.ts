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
    docs?: Doc[]
    error?: string
    command?: "rebuild" | null
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

  async getProviders(id:number): Promise<Provider[]> {
    let c: Provider[] = null

    try {
      c = await fetch(`${serverurl}/providers/${id}`).then(r => r.json())
    } catch (error) {
      console.log("Error Loading Providers", error)
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

  async askbot(req: ChatMessage) {

    let a: ChatMessage = {} as any


    let options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(req)
    }

    try {
      a = await fetch(`${serverurl}/ai/`, options).then(r => r.json())
    } catch (error) {
      a.error = error?.toString() ?? "Error"
      console.log("Error Contacting Bot", error)
    }

    if (a.error) a.message = a.error

    a.type = "bot"

    return a
  },


}