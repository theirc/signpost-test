
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
    zendesk: "ar"
  },
  bn: {
    name: "Bengali"
  },
  my: {
    name: "Burmese"
  },
  cs: {
    name: "Czech",
    zendesk: "cs"
  },
  "fa-AF": {
    rtl: true,
    name: "Dari"
  },
  "en-US": {
    name: "English"
  },
  "fa-FA": {
    rtl: true,
    name: "Farsi",
    zendesk: "fa"
  },
  "fr-FR": {
    name: "French",
    zendesk: "fr"
  },
  "de-DE": {
    name: "German",
    zendesk: "de"
  },
  el: {
    name: "Greek",
    zendesk: "el-gr"
  },
  ht: {
    name: "Haitian Creole"
  },
  "ha-HA": {
    name: "Hausa"
  },
  "hu-HU": {
    name: "Hungarian"
  },
  "it-IT": {
    name: "Italian",
    zendesk: "it"
  },
  KAU: {
    name: "Kanuri",
    zendesk: "ko-kr"
  },
  "ki-KI": {
    name: "Kirundi",
    zendesk: "rn-BI"
  },
  "ln-LN": {
    name: "Lingala",
    zendesk: "ln"
  },
  "ps-PS": {
    name: "Pashto",
    zendesk: "ps"
  },
  "ru-RU": {
    name: "Russian",
    zendesk: "ru"
  },
  "so-SO": {
    name: "Somali",
    zendesk: "so"
  },
  "es-ES": {
    name: "Spanish",
    zendesk: "es"
  },
  "sw-SW": {
    name: "Swahili",
    zendesk: "sw"
  },
  th: {
    name: "Thai",
    zendesk: "th"
  },
  "uk-UK": {
    name: "Ukrainian",
    zendesk: "uk"
  },
  "ur-UR": {
    name: "Urdu",
    zendesk: "ur"
  }
}