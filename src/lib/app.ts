import { api } from "./api"
import { DB } from "./db"
import "./types.data"
import "./types.ai"
import isEqual from "lodash/isEqual"

type Statuses = "initializing" | "ready"

const appPrivateData = {
  status: "initializing" as Statuses,
  servicesLoaded: false,
  boot: false,
}

const defaultBlocks: Block[] = [
  {
    type: "text",
    text: { "en-US": "Welcome" }
  } satisfies BlockText,
] as Block[]


export const app = {

  country: 0,
  logo: null as any,
  locale: "en-US", //current locale
  name: "Country Name",
  defaultLocale: "en-US", //default lang of the country
  db: new DB(),

  state: {
    get status() {
      return appPrivateData.status
    },
    set status(v: Statuses) {
      if (appPrivateData.status === v) return
      appPrivateData.status = v
      app.update()
    },

    info: "Initalizing",

    get servicesLoaded() {
      return appPrivateData.servicesLoaded
    },
    set servicesLoaded(v) {
      if (appPrivateData.servicesLoaded === v) return
      appPrivateData.servicesLoaded = v
      app.update()
    },

  },

  page: {
    color: "#000000",
    bgcolor: "#ffffff",

    header: {
      color: null as string,
      bgcolor: null as string,
    },

    footer: {
      text: { "en-US": "Footer" },
      footerlinks: []
    } as BlockFooter,

    content: [...defaultBlocks],

  },

  data: {

    categories: {
      providers: {},
      categories: {},
      subCategories: {},
      populations: {},
      accesibility: {},
    } as Categories,

    services: {} as Services,

    zendesk: {
      categories: {} as { [index: number]: ZendeskCategory },
      sections: {} as { [index: number]: ZendeskSection },
      articles: {} as { [index: number]: ZendeskArticle },
    }

  },


  reactUpdate: null as Function,

  update() {
    console.log("Update App: ", app)
    if (app.reactUpdate) app.reactUpdate()
  },


  async initialize() {
    if (appPrivateData.boot) return
    appPrivateData.boot = true

    const storageCountry = localStorage.getItem("country")
    const storageCategories = localStorage.getItem("categories")

    let c: Country = null
    let cats: Categories = null

    try { c = JSON.parse(storageCountry) } catch (error) { }
    try { cats = JSON.parse(storageCategories) } catch (error) { }

    if (cats) app.data.categories = cats

    if (c) {
      loadCountry(c)
      app.state.status = "ready"
    }

    setTimeout(async () => {

      let serverCountry: Country = await api.getCountry(app.country)

      if (serverCountry) {

        if (!c) {
          localStorage.setItem("country", JSON.stringify(serverCountry))
          loadCountry(serverCountry)

        } else {
          if (!isEqual(c, serverCountry)) {
            localStorage.setItem("country", JSON.stringify(serverCountry))
            loadCountry(serverCountry)
            console.log("Country Updated.")
          } else {
            console.log("Country Unchanged")
          }
        }

        app.state.status = "ready"

        const sc = await app.db.loadLocalServices()
        await app.db.loadLocalProviders()
        await app.db.loadLocalProviders()

        app.state.servicesLoaded = sc > 0
        app.update()

        await app.db.updateProviders()
        await app.db.updateServices()
        await app.db.updateArticles()

        app.state.servicesLoaded = true
        app.update()

        console.log("Updating Categories...")
        cats = await api.getCategories()

        if (cats) {
          app.data.categories = cats
          localStorage.setItem("categories", JSON.stringify(cats))
          if (!isEqual(cats, app.data.categories)) {
            app.update()
            console.log("Categories Updated.")
          } else {
            console.log("Categories Unchanged")
          }
        }

        console.log("Initialized")

      }

    }, 1)

  },


  async getService(id: number) {

  },


}

function loadCountry(c: Country) {
  if (!c) return
  app.country = c.id
  app.name = c.name
  app.locale ||= c.locale
  app.page.content = c.content || []
  app.defaultLocale = c.locale

  app.page.color = c.pagecolor || "#000000"
  app.page.bgcolor = c.pagebgcolor || "#ffffff"

  app.page.header.color = c.headercolor || c.pagecolor
  app.page.header.bgcolor = c.headerbgcolor || c.pagebgcolor

  const footer = c.content.find(b => b.type === "footer")
  if (footer) app.page.footer = footer as BlockFooter
}

export function translate(t: LocalizableContent): string {
  if (!t) return ""
  if (typeof t === "string") return t
  if (typeof t === "object") return t[app.locale] || t["en-US"] || ""
  return ""
}

export async function sleep(ms = 1000) {
  return new Promise(a => setTimeout(a, ms))
}