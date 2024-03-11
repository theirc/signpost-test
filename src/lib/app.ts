import { blocks } from "./blocks"
import { api } from "./api"
import { DB } from "./db"
import isEqual from "lodash/isEqual"

type Statuses = "initializing" | "ready"

declare global {

  type Services = { [index: number]: Service }

  interface Country {
    id?: number
    name?: string
    locale?: string
    content: Blocks[]
    pagecolor?: string
    pagebgcolor?: string
    headercolor?: string
    headerbgcolor?: string
  }

}


export const app = {

  country: 0,
  logo: null as any,
  locale: "en-US", //current locale
  name: "Country Name",
  defaultLocale: "en-US", //default lang of the country
  db: new DB(),
  boot: false,

  state: {
    status: "initializing" as Statuses,
    info: "Initalizing",
    servicesLoaded: false,
  },

  get status() {
    return app.state.status
  },
  set status(v: Statuses) {
    if (app.state.status === v) return
    console.log(`Status Changed to ${v}`)
    app.state.status = v
    app.update()
  },

  color: "#000000",
  bgcolor: "#ffffff",

  header: {
    color: null as string,
    bgcolor: null as string,
  },

  content: blocks,

  footer: {
    type: "footer",
    text: { "en-US": "Footer" },
    footerlinks: []
  } as BlockFooter,


  categories: {
    providers: {},
    categories: {},
    subCategories: {},
    populations: {},
    accesibility: {},
  } as Categories,

  services: {} as Services,


  reactUpdate: null as Function,
  update() {
    console.log("Update App: ", app)
    if (app.reactUpdate) app.reactUpdate()
  },


  async initialize() {
    if (app.boot) return
    app.boot = true

    const storageCountry = localStorage.getItem("country")
    const storageCategories = localStorage.getItem("categories")

    let c: Country = null
    let cats: Categories = null

    try { c = JSON.parse(storageCountry) } catch (error) { }
    try { cats = JSON.parse(storageCategories) } catch (error) { }

    if (cats) app.categories = cats

    if (c) {
      loadCountry(c)
      app.status = "ready"
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

        app.status = "ready"

        const sc = await app.db.loadLocalServices()

        if (sc > 0) {
          console.log(`${sc} Services Cached`)
          app.state.servicesLoaded = true
          app.update()
        }


        await app.db.updateServices()
        app.state.servicesLoaded = true

        app.update()

        console.log("Updating Categories...")
        cats = await api.getCategories()

        if (cats) {
          app.categories = cats
          localStorage.setItem("categories", JSON.stringify(cats))
          if (!isEqual(cats, app.categories)) {
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
  app.content = c.content || []
  app.defaultLocale = c.locale

  app.color = c.pagecolor || "#000000"
  app.bgcolor = c.pagebgcolor || "#ffffff"

  app.header.color = c.headercolor || c.pagecolor
  app.header.bgcolor = c.headerbgcolor || c.pagebgcolor

  const footer = c.content.find(b => b.type === "footer")
  if (footer) app.footer = footer as BlockFooter
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


