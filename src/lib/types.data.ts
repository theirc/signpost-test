export { }

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
    parent?: number[]
  }

  interface Categories {
    providers: { [index: number]: Category }
    categories: { [index: number]: Category }
    subCategories: { [index: number]: Category }
    populations: { [index: number]: Category }
    accesibility: { [index: number]: Category }
  }


}
