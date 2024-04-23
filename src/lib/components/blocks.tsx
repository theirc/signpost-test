import { CSSProperties, Children } from "react"
import { app } from "../app"
import { BlockChannels, BlockImage, BlockInfo, BlockRichText, BlockServices, BlockText, Footer } from "."
import { Link } from "react-router-dom"
import { BlockCategories } from "./blockcategories"
import { BlockSections } from "./blocksections"

export function Blocks() {

  const blocks = app.page.content || []

  const blockview = blocks.map((b, i) => {
    if (b.type === "text") return <BlockText key={b.sort} block={b as BlockText} />
    if (b.type === "richtext") return <BlockRichText key={b.sort} block={b as BlockRichText} />
    if (b.type === "services") return <BlockServices key={b.sort} block={b as BlockServices} />
    if (b.type === "channels") return <BlockChannels key={b.sort} block={b as BlockChannels} />
    if (b.type === "image") return <BlockImage key={b.sort} block={b as BlockImage} />
    if (b.type === "info") return <BlockInfo key={b.sort} block={b as BlockInfo} />
    if (b.type === "categories") return <BlockCategories key={b.sort} block={b as BlockCategories} />
    if (b.type === "sections") return <BlockSections key={b.sort} block={b as BlockSections} />
    return null
  })

  return <div className=" overflow-y-auto h-full w-full flex justify-center">
    <div className="w-full">
      {blockview}
      <Footer />
    </div>
  </div>

}

Blocks.buildStyle = (block: Block) => {

  const styles: CSSProperties = {}

  if (block) {
    if (block.textsize) styles.fontSize = `${block.textsize}%`
    if (block.textcolor) styles.color = block.textcolor
    if (block.bgcolor) styles.backgroundColor = block.bgcolor
    if (block.fontweight) styles.fontWeight = block.fontweight
  }

  return styles

}