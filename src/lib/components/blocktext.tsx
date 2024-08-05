import { CSSProperties } from "react"
import { translate } from "../app"
import { Container } from "./container"
import { useAnimateOnScroll } from "./useAnimateOnScroll"

export function BlockText(props: { block: BlockText }) {

  useAnimateOnScroll(".fade-up", "animate__fadeInUp")

  const { block } = props
  return <Container block={block}>
    <div className=" block-text">
   <p className="fade-up">{translate(block.text)}</p>
    </div>
  </Container>
}