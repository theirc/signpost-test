import { CSSProperties } from "react"
import { translate } from "../app"
import { Container } from "./container"

export function BlockText(props: { block: BlockText }) {

  const { block } = props
  return <Container block={block}>
    <div className="block-text">
    {translate(block.text)}
    </div>
  </Container>
}