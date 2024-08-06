import { translate } from "../app"
import { Container } from "./container"

export function BlockAbout(props: { block: BlockAbout }) {

  const { block } = props

  return <Container block={block}>
    <div id="about-section" className="flex flex-col lg:flex-row gap-6 lg:gap-8">
      <div className="flex-1 bg-blue-500 rounded-[10px] min-h-40">IMAGE PLACEHOLDER</div>
      <div className="flex-1 about-content">
        <h1>{translate(block.title)}</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 about-paragraph" dangerouslySetInnerHTML={{ __html: translate(block.subtitle) }}></div>
      </div>
    </div>
  </Container>

}