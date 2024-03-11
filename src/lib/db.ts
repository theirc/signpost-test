import Dexie from "dexie"
import { } from "./locale"
import { api } from "./api"
import { app } from "./app"

export class DB extends Dexie {
  services!: Dexie.Table<Service, number>
  providers!: Dexie.Table<Provider, number>

  constructor() {
    super("db")
    this.version(1).stores({
      services: 'id, date_created, date_updated',
      providers: 'id',
    })
    this.services = this.table("services")
    this.providers = this.table("providers")
  }

  async loadLocalServices(): Promise<number> {
    const dbs = (await this.services.toArray()) || []

    if (dbs.length > 0) {
      const r = dbs.reduce((a, b) => { a[b.id] = b; return a }, {})
      app.services = r as any
      console.log("Local Services: ", r)
    }
    return dbs.length

  }

  async updateServices() {
    console.log("Updating Database...")

    // const services = await api.getServices(app.country)
    const services = await api.getServices(2)

    if (services) {
      console.log(`Saving ${services.length} Services`)
      for (const service of services) {
        await this.services.put(service, service.id)
      }
    }

    console.log("Database Updated!")
  }

}

declare global {

  interface Service {
    id?: number
    status?: string
    date_created?: number
    date_updated?: number

    name?: LocalizableText
    description?: LocalizableText

    hasLocation?: boolean
    provider?: number
    region?: string
    city?: string
    files?: string

    contactName?: string
    contactLastName?: string
    contactTitle?: string
    contactEmail?: string
    contactPhone?: string
    secondaryName?: string
    secondaryLastName?: string
    secondaryTitle?: string
    secondaryEmail?: string
    secondaryPhone?: string
    address?: string
    contactInfo?: unknown
    form?: unknown
    headerimage?: string
    addHours?: unknown
    location?: [lat: number, lon: number]
    alwaysopen?: boolean

    subcategories?: number[]
    Accessibility?: number[]
    Populations?: number[]
    categories?: number[]
  }

  interface Provider {
    id?: number
    name?: LocalizableText
    description?: LocalizableText
    category?: number
    address?: string
    expiration?: number
  }

  interface Category {
    id?: number
    name?: LocalizableText
    description?: LocalizableText
    icon?: string
    color?: string
  }

  interface Categories {
    providers: { [index: number]: Category }
    categories: { [index: number]: Category }
    subCategories: { [index: number]: Category }
    populations: { [index: number]: Category }
    accesibility: { [index: number]: Category }
  }

}
