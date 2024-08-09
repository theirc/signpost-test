import { app, translate } from "../app"
import { languages } from "../locale";
import { Container } from "./container"
import { useAnimateOnScroll } from "./useAnimateOnScroll";

export function BlockAbout(props: { block: BlockAbout }) {
const { block } = props
const isRTL = languages[app.locale]?.rtl; 

  useAnimateOnScroll(".fade-up-0", "animate__fadeInUp", "2s");
  useAnimateOnScroll(".fade-up-1", "animate__fadeInUp", "2s");
  useAnimateOnScroll(".fade-up-2", "animate__fadeInUp", "2s");
  
  return <Container block={block}>
    <div id="about-section" className={`flex flex-col lg:flex-row gap-6 lg:gap-8 ${isRTL ? 'lg:flex-row-reverse' : ''}`}>
      <div className="flex-1 bg-blue-500 rounded-[10px] min-h-40">IMAGE PLACEHOLDER</div>
      <div className={`flex-1 about-content ${isRTL ? 'text-right' : ''}`}>
        <h1 className="fade-up-0">{translate(block.title)}</h1>
        <div className={`fade-up-1 grid grid-cols-1 sm:grid-cols-2 gap-4 about-paragraph ${isRTL ? 'sm:grid-flow-col-dense' : ''}`} dangerouslySetInnerHTML={{ __html: translate(block.subtitle) }}></div>
      </div>
    </div>
  </Container>

}