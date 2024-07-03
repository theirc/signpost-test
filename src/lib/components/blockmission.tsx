import { CSSProperties } from "react"
import { translate } from "../app"
import { Container } from "./container"

export function BlockMission(props: { block: BlockMission}) {

  const { block } = props
  return <Container block={block}>
    {translate(block.title)}
  </Container>
}