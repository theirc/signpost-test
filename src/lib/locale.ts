
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
    en: "Arabic",
    es: "Árabe",
    ar: "العربية",
    so: "Carabi"
  },
  bn: {
    en: "Bengali",
    es: "Bengalí",
    ar: "البنغالية",
    so: "Bangaali"
  },
  my: {
    en: "Burmese",
    es: "Birmano",
    ar: "البورمية",
    so: "Burmeese"
  },
  cs: {
    en: "Czech",
    es: "Checo",
    ar: "التشيكية",
    so: "Jeeg"
  },
  "fa-AF": {
    en: "Dari",
    es: "Dari",
    ar: "داري",
    so: "Daari"
  },
  "en-US": {
    en: "English",
    es: "Inglés",
    ar: "الإنجليزية",
    so: "Ingiriis"
  },
  "fa-IR": { 
    en: "Farsi",
    es: "Persa",
    ar: "الفارسية",
    so: "Faarsi"
  },
  "fr-FR": {
    en: "French",
    es: "Francés",
    ar: "الفرنسية",
    so: "Faransiis"
  },
  "de-DE": {
    en: "German",
    es: "Alemán",
    ar: "الألمانية",
    so: "Jarmal"
  },
  el: {
    en: "Greek",
    es: "Griego",
    ar: "اليونانية",
    so: "Giriig"
  },
  ht: {
    en: "Haitian Creole",
    es: "Criollo haitiano",
    ar: "الكريولية الهايتية",
    so: "Kiriilada Haytiyaan"
  },
  "ha-HA": {
    en: "Hausa",
    es: "Hausa",
    ar: "الهوسا",
    so: "Hawsa"
  },
  "hu-HU": {
    en: "Hungarian",
    es: "Húngaro",
    ar: "الهنغارية",
    so: "Hangari"
  },
  "it-IT": {
    en: "Italian",
    es: "Italiano",
    ar: "الإيطالية",
    so: "Talyaani"
  },
  KAU: {
    en: "Kanuri",
    es: "Kanuri",
    ar: "الكنورية",
    so: "Kanuuri"
  },
  "ki-KI": {
    en: "Kirundi",
    es: "Kirundi",
    ar: "الكيروندية",
    so: "Kirundi"
  },
  "ln-LN": {
    en: "Lingala",
    es: "Lingala",
    ar: "اللينغالا",
    so: "Lingaala"
  },
  "ps-AF": {
    en: "Pashto",
    es: "Pastún",
    ar: "البشتو",
    so: "Baxto"
  },
  "ru-RU": {
    en: "Russian",
    es: "Ruso",
    ar: "الروسية",
    so: "Ruush"
  },
  "so-SO": {
    en: "Somali",
    es: "Somalí",
    ar: "الصومالية",
    so: "Soomaali"
  },
  "es-ES": {
    en: "Spanish",
    es: "Español",
    ar: "الإسبانية",
    so: "Isbaanish"
  },
  "sw-SW": {
    en: "Swahili",
    es: "Swahili",
    ar: "السواحلية",
    so: "Sawaaxili"
  },
  th: {
    en: "Thai",
    es: "Tailandés",
    ar: "التايلاندية",
    so: "Taay"
  },
  "uk-UA": { 
    en: "Ukrainian",
    es: "Ucraniano",
    ar: "الأوكرانية",
    so: "Yukreeniyaan"
  },
  "ur-PK": {
    en: "Urdu",
    es: "Urdú",
    ar: "الأردية",
    so: "Urdu"
  }
};

// export const langauages = {
//   "ar-SA": {
//     rtl: true,
//     name: "Arabic"
//   },
//   bn: {
//     name: "Bengali"
//   },
//   my: {
//     name: "Burmese"
//   },
//   cs: {
//     name: "Czech"
//   },
//   "fa-AF": {
//     rtl: true,
//     name: "Dari"
//   },
//   "en-US": {
//     name: "English"
//   },
//   "fa-FA": {
//     rtl: true,
//     name: "Farsi"
//   },
//   "fr-FR": {
//     name: "French"
//   },
//   "de-DE": {
//     name: "German"
//   },
//   el: {
//     name: "Greek"
//   },
//   ht: {
//     name: "Haitian Creole"
//   },
//   "ha-HA": {
//     name: "Hausa"
//   },
//   "hu-HU": {
//     name: "Hungarian"
//   },
//   "it-IT": {
//     name: "Italian"
//   },
//   KAU: {
//     name: "Kanuri"
//   },
//   "ki-KI": {
//     name: "Kirundi"
//   },
//   "ln-LN": {
//     name: "Lingala"
//   },
//   "ps-PS": {
//     name: "Pashto"
//   },
//   "ru-RU": {
//     name: "Russian"
//   },
//   "so-SO": {
//     name: "Somali"
//   },
//   "es-ES": {
//     name: "Spanish"
//   },
//   "sw-SW": {
//     name: "Swahili"
//   },
//   th: {
//     name: "Thai"
//   },
//   "uk-UK": {
//     name: "Ukrainian"
//   },
//   "ur-UR": {
//     name: "Urdu"
//   }
// }


