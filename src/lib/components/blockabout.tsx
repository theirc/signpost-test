import { app, translate } from "../app"
import { languages } from "../locale";
import { Container } from "./container"
import { useAnimateOnScroll } from "./useAnimateOnScroll";

export function BlockAbout(props: { block: BlockAbout }) {
const { block } = props
useAnimateOnScroll();
const isRTL = languages[app.locale]?.rtl; 

  
  return <Container block={block}>
    <div id="about-section" className={`flex flex-col lg:flex-row gap-6 lg:gap-8 ${isRTL ? 'lg:flex-row-reverse' : ''}`}>
      <div className="flex-1 bg-blue-500 rounded-[10px] min-h-40 fade-up-0" data-animation="animate__fadeInUp" >IMAGE PLACEHOLDER</div>
      <div className={`flex-1 about-content ${isRTL ? 'text-right' : ''}`}>
        <h1 className="fade-up-1" data-animation="animate__fadeInUp">{translate(block.title)}</h1>
        <div className={`fade-up-2 grid grid-cols-1 sm:grid-cols-2 gap-4 about-paragraph ${isRTL ? 'sm:grid-flow-col-dense' : ''}`} dangerouslySetInnerHTML={{ __html: translate(block.subtitle) }} data-animation="animate__fadeInUp"></div>
      </div>
    </div>
  </Container>

}