
declare global {
  type Langauages = {
    [P in keyof typeof langauages]?: LocaleDeclaration
  }
  type LocalizableText = {
    [P in keyof typeof langauages]?: string
  }
  type LocalizableContent = string | LocalizableText
}

interface LocaleDeclaration {
  rtl?: boolean
  name: string
}
export const langauages = {
  "ar-SA": {
    rtl: true,
    name: "Arabic"
  },
  bn: {
    name: "Bengali"
  },
  my: {
    name: "Burmese"
  },
  cs: {
    name: "Czech"
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
    name: "Farsi"
  },
  "fr-FR": {
    name: "French"
  },
  "de-DE": {
    name: "German"
  },
  el: {
    name: "Greek"
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
    name: "Italian"
  },
  KAU: {
    name: "Kanuri"
  },
  "ki-KI": {
    name: "Kirundi"
  },
  "ln-LN": {
    name: "Lingala"
  },
  "ps-PS": {
    name: "Pashto"
  },
  "ru-RU": {
    name: "Russian"
  },
  "so-SO": {
    name: "Somali"
  },
  "es-ES": {
    name: "Spanish"
  },
  "sw-SW": {
    name: "Swahili"
  },
  th: {
    name: "Thai"
  },
  "uk-UK": {
    name: "Ukrainian"
  },
  "ur-UR": {
    name: "Urdu"
  }
}


