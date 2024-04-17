import { translate } from "../app"
import { Container } from "./container"

export function BlockImage(props: { block: BlockImage }) {
  const { block } = props

  const imageUrl = `https://signpost.azureedge.net/${translate(block.image)}`;

  return <Container block={block}>
    {/* <img src={imageUrl} alt="block-image" /> */}
    <img src="https://signpost.azureedge.net/0016e070-29b4-4a69-a9ea-5e0e992dead1.png" style={{maxWidth: '100%', height: 'auto'}} />
  </Container>

}