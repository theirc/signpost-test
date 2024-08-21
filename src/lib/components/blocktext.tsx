import { CSSProperties } from "react"
import { app,translate } from "../app"
import { Container } from "./container"
import { languages } from "../locale";
import { useAnimateOnScroll } from "./useAnimateOnScroll"

export function BlockText(props: { block: BlockText }) {
  const isRTL = languages[app.locale]?.rtl;

  useAnimateOnScroll();

  const { block } = props
  return <Container block={block}>
    <div className="block-text">
   <p className={`fade-up-0 text-base font-medium leading-relaxed ${isRTL ? 'text-right' : 'text-left'}`}
    data-animation="animate__fadeInUp"
   >{translate(block.text)}</p>
    </div>
  </Container>
}