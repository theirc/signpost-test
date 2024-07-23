import { translate } from "../app"
import { Container } from "./container"

export function BlockAbout(props: { block: BlockAbout }) {

  const { block } = props

  return <Container block={block}>
    <div id="about-section" className="#about-section flex flex-col-reverse lg:flex-row gap-6">
      <div className="flex-1 bg-blue-500 rounded-[10px] min-h-40">IMAGE PLACEHOLDER</div>
      <div className="flex-1 about-content">
        <h1>{translate(block.title)}</h1>
        <div className="lg:grid flex flex-col grid-cols-[46%_46%] gap-4 lg:gap-x-[8%]" dangerouslySetInnerHTML={{ __html: translate(block.subtitle) }}></div>
      </div>
    </div>
  </Container>

}