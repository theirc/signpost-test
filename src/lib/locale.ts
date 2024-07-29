
declare global {
  type Langauages = {
    [P in keyof typeof languages]?: LocaleDeclaration
  }
  type LocalizableText = {
    [P in keyof typeof languages]?: string
  }
  type LocalizableContent = string | LocalizableText
}

interface LocaleDeclaration {
  rtl?: boolean
  name: string
}


export const languages = {
  "ar-SA": {
    rtl: true,
    name: "Arabic",
    countryCode: "SA"
  },
  bn: {
    name: "Bengali",
    countryCode: "BD"
  },
  my: {
    name: "Burmese",
    countryCode: "MM"
  },
  cs: {
    name: "Czech",
    countryCode: "CZ"
  },
  "fa-AF": {
    rtl: true,
    name: "Dari",
    countryCode: "AF"
  },
  "en-US": {
    name: "English",
    countryCode: "US"
  },
  "fa-FA": {
    rtl: true,
    name: "Farsi",
    countryCode: "IR"
  },
  "fr-FR": {
    name: "French",
    countryCode: "FR"
  },
  "de-DE": {
    name: "German",
    countryCode: "DE"
  },
  el: {
    name: "Greek",
    countryCode: "GR"
  },
  ht: {
    name: "Haitian Creole",
    countryCode: "HT"
  },
  "ha-HA": {
    name: "Hausa",
    countryCode: "NE"
  },
  "hu-HU": {
    name: "Hungarian",
    countryCode: "HU"
  },
  "it-IT": {
    name: "Italian",
    countryCode: "IT"
  },
  KAU: {
    name: "Kanuri",
    countryCode: "NG"
  },
  "ki-KI": {
    name: "Kirundi",
    countryCode: "BI"
  },
  "ln-LN": {
    name: "Lingala",
    countryCode: "CD"
  },
  "ps-PS": {
    name: "Pashto",
    countryCode: "AF"
  },
  "ru-RU": {
    name: "Russian",
    countryCode: "RU"
  },
  "so-SO": {
    name: "Somali",
    countryCode: "SO"
  },
  "es-ES": {
    name: "Spanish",
    countryCode: "ES"
  },
  "sw-SW": {
    name: "Swahili",
    countryCode: "KE"
  },
  th: {
    name: "Thai",
    countryCode: "TH"
  },
  "uk-UK": {
    name: "Ukrainian",
    countryCode: "UA"
  },
  "ur-UR": {
    name: "Urdu",
    countryCode: "PK"
  }
}