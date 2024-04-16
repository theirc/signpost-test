
import { translate } from "../app"
import { Container } from "./container"

export function BlockCategories(props: { block: BlockCategories }) {
  const { block } = props

  return <Container block={block}>
    <div className="text-4xl">{translate(props.block.title)} </div>
    <div className="text-2xl mt-4 text-gray-500">{translate(props.block.subtitle)} </div>
  </Container>
}