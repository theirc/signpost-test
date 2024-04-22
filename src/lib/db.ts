import Dexie from "dexie"
import { } from "./locale"
import { api } from "./api"
import { app } from "./app"

export class DB extends Dexie {

  zendeskSections!: Dexie.Table<ZendeskSection, number>
  zendeskCategories!: Dexie.Table<ZendeskCategory, number>
  articles!: Dexie.Table<ZendeskArticle, number>
  services!: Dexie.Table<Service, number>
  providers!: Dexie.Table<Provider, number>

  constructor() {
    super("db")
    this.version(1).stores({
      zendeskCategories: 'id',
      zendeskSections: 'id',
      articles: 'id',

      services: 'id, date_created, date_updated',
      providers: 'id',
    })

    this.articles = this.table("articles")
    this.zendeskCategories = this.table("zendeskCategories")
    this.zendeskSections = this.table("zendeskSections")

    this.services = this.table("services")
    this.providers = this.table("providers")
  }

  async loadLocalServices(): Promise<number> {
    const dbs = (await this.services.toArray()) || []
    if (dbs.length > 0) {
      const r = dbs.reduce((a, b) => { a[b.id] = b; return a }, {})
      app.data.services = r as any
    }
    console.log("Local Services Found: ", dbs.length)
    return dbs.length
  }

  async loadLocalProviders(): Promise<number> {
    console.log("Loading providers...");
    const dbs = (await this.providers.toArray()) || []
    if (dbs.length > 0) {
      const r = dbs.reduce((a, b) => { a[b.id] = b; return a }, {})
      app.data.categories.providers = r as any
    }
    console.log("Local Providers Found: ", dbs.length)
    return dbs.length
  }

  async loadZendeskContent(): Promise<number> {

    const cats = (await this.zendeskCategories.toArray()) || []
    if (cats.length > 0) {
      const r = cats.reduce((a, b) => { a[b.id] = b; return a }, {})
      app.data.zendesk.categories = r as any
    }

    const sects = (await this.zendeskSections.toArray()) || []
    if (sects.length > 0) {
      const r = sects.reduce((a, b) => { a[b.id] = b; return a }, {})
      app.data.zendesk.sections = r as any
    }

    const arts = (await this.articles.toArray()) || []
    if (arts.length > 0) {
      const r = arts.reduce((a, b) => { a[b.id] = b; return a }, {})
      app.data.zendesk.articles = r as any
    }

    return arts.length
  }

  async updateServices() {
    console.log("Updating Database...")

    const dbs = (await this.services.toArray()) || []

    let lastUpdate = 0
    for (const s of dbs) {
      if (s.date_updated > lastUpdate) lastUpdate = s.date_updated
      if (s.date_created > lastUpdate) lastUpdate = s.date_created
    }
    console.log("Last Update: ", lastUpdate)
    const services = await api.getServices(app.country, lastUpdate)

    if (services) {
      console.log(`Saving ${services.length} Services`)
      for (const service of services) {
        await this.services.put(service, service.id)
      }
    }
    console.log("Database Updated!")
  }

  async updateProviders() {
    console.log("Updating Providers Database...")
    const providers = await api.getProviders(app.country)
    if (providers) {
      console.log(`Saving ${providers.length} Providers`)
      for (const provider of providers) {
        await this.providers.put(provider, provider.id)
      }
    }
    console.log("Providers Database Updated!")
  }

  async updateArticles() {
    console.log("Updating Articles Database...")
    const content = await api.getArticles(app.country)

    if (content) {
      console.log(`Saving Articles`)
      for (const key in content) {
        const cat = content[key]
        await this.zendeskCategories.put(cat, cat.id)
        for (const key in cat.sections) {
          const sec = cat.sections[key]
          sec.category = cat.id
          await this.zendeskSections.put(sec, sec.id)
          for (const key in sec.articles) {
            const art = sec.articles[key]
            art.section = sec.id
            art.category = cat.id
            await this.articles.put(art, art.id)
          }
        }
      }
    }

    console.log("Articles Database Updated!")
  }

}

