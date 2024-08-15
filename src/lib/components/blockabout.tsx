import { app, translate } from "../app"
import { languages } from "../locale";
import { Container } from "./container"
import { useAnimateOnScroll } from "./useAnimateOnScroll";

const IMAGE_BASE_URL = "https://signpostdirectus.file.core.windows.net/uploads/";
const IMAGE_QUERY_PARAMS = "sv=2022-11-02&ss=f&srt=sco&sp=rl&se=2026-08-01T00:42:50Z&st=2024-07-24T16:42:50Z&spr=https&sig=5biYblkoUN9mmjiEwdKihbOOtH%2FmcpVXYrHRGH%2BFJ8s%3D";

export function BlockAbout(props: { block: BlockAbout }) {
  const { block } = props
  useAnimateOnScroll();
  const isRTL = languages[app.locale]?.rtl;

  const getImageUrl = (filename: string) => {
    if (!filename) return '';
    const filenameWithExtension = filename.includes('.') ? filename : `${filename}.png`;
    const url = `${IMAGE_BASE_URL}${filenameWithExtension}?${IMAGE_QUERY_PARAMS}`;
    return url;
  };


  return <Container block={block}>
    <div id="about-section" className={`flex flex-col lg:flex-row gap-6 lg:gap-8 ${isRTL ? 'lg:flex-row-reverse' : ''}`}>
      <div className="flex-1 flex justify-center rounded-[10px] fade-up-0" data-animation="animate__fadeInUp" >
        <img 
        src={getImageUrl(block.image)}
        alt={translate(block.title)}
        className="w-full lg:w-2/3 h-auto rounded-[10px]"
        />
      </div>
      <div className={`flex-1 about-content ${isRTL ? 'text-right' : ''}`}>
        <h1 className="fade-up-1" data-animation="animate__fadeInUp">{translate(block.title)}</h1>
        <div className={`fade-up-2 grid grid-cols-1 sm:grid-cols-2 gap-4 about-paragraph ${isRTL ? 'sm:grid-flow-col-dense' : ''}`} dangerouslySetInnerHTML={{ __html: translate(block.subtitle) }} data-animation="animate__fadeInUp"></div>
      </div>
    </div>
  </Container>

}
