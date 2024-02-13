import { BlockText } from "."

const isBlockText = (b: Block): b is BlockText => b.type == "text"
const isBlockRichText = (b: Block): b is BlockText => b.type == "richtext"
const isBlockServices = (b: Block): b is BlockText => b.type == "services"
const isBlockChannels = (b: Block): b is BlockText => b.type == "channels"

declare global {

  type BlockTypes = "text" | "channels" | "info" | "services" | "image" | "richtext" | "footer"

  type Blocks = Block | BlockText | BlockChannels | BlockRichText | BlockInfo | BlockServices | BlockImage | BlockFooter

  interface Block {
    type: BlockTypes
    textcolor?: string
    bgcolor?: string
    textsize?: number
    fontweight?: number
    text?: LocalizableText
    sort?: number
  }

  interface BlockText extends Block {
    type: "text"
  }

  interface BlockRichText extends Block {
    type: "richtext"
  }

  interface BlockInfo extends Block {
    type: "info"
    title?: LocalizableText
    subtitle?: LocalizableText
  }

  interface BlockImage extends Block {
    type: "info"
    image?: string
  }

  interface BlockFooter extends Block {
    type: "footer"
    footerlinks?: Footerlinks[]
  }

  interface BlockServices extends Block {
    type: "services"
    title?: LocalizableText
    subtitle?: LocalizableText
    text_providers?: LocalizableText
    text_typeofservice?: LocalizableText
    text_populations?: LocalizableText
    text_accesibility?: LocalizableText
    components?: {
      hidepopulation?: boolean
      hideaccesibility?: boolean
      hidelist?: boolean
      hidemap?: boolean
      hidesearch?: boolean
      hideservicetype?: boolean
      hideproviders?: boolean
    }
  }

  interface BlockChannels extends Block {
    type: "channels"
    title?: LocalizableText
    subtitle?: LocalizableText
    fb?: LocalizableText
    fb_link?: string
    fbmess?: LocalizableText
    fbmess_link?: string
    telegram?: LocalizableText
    telegram_link?: string
    whatsapp?: LocalizableText
    whatsapp_link?: string
    email?: LocalizableText
    email_link?: string
    instagram?: LocalizableText
    instagram_link?: string
    whatsappc?: LocalizableText
    whatsappc_link?: string
    toktok?: LocalizableText
    tiktok_link?: string
  }

}

interface Footerlinks {
  url?: string
  title?: LocalizableText
}

//default blocks
export const blocks: Block[] = [
  {
    type: "text",
    text: { "en-US": "Welcome Text" }
  } satisfies BlockText,
  {
    type: "text",
    text: { "en-US": "Secondary Text" }
  } satisfies BlockText,
  {
    type: "channels",
  } satisfies BlockChannels,
  {
    type: "services",
  } satisfies BlockServices,
  {
    type: "richtext",
  } satisfies BlockRichText,
] as Block[]

export { }



