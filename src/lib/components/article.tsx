import { useParams } from "react-router-dom"
import { app, translate } from "../app"
import ShareButton from "./sharebutton"
import { useAnimateOnScroll } from './useAnimateOnScroll';
import TextReader from "./textreader"
import { Container } from "./container"
import { translations } from "../../translations";
import { languages } from "../locale";
import {
  FaFacebook,
  FaTelegram,
  FaFacebookMessenger,
  FaWhatsapp,
  FaEnvelope,
  FaInstagram,
  FaTiktok,
  FaWhatsappSquare,
} from "react-icons/fa";
import { useRef } from "react";
import { ArrowUpOutlined } from "@ant-design/icons";
import { Breadcrumb } from "antd";


export function Article() {
  const refScrollUp = useRef<HTMLDivElement>(null);
  let { id } = useParams()
  const isRTL = languages[app.locale]?.rtl;
  useAnimateOnScroll();

  const a: ZendeskArticle = app.data.zendesk.articles[id]
  const channels = app.page.content.find(x => x.type === 'channels') as BlockChannels

  if (!a) {
    return <div>Article {id} not found</div>
  }

  const category = app.data.zendesk.categories[a.category]
  const section = app.data.zendesk.sections[a.section]

  const title = translate(a.name)
  const body = translate(a.description)

  const handleScrollToTop = () => {
    if (refScrollUp.current) {
      refScrollUp?.current?.scrollIntoView({ behavior: "smooth" })
    }
  }

  return <div className={`overflow-y-auto ${isRTL ? 'rtl' : ''}`}>
    <Container className="text-black bg-white">
      <div className={`flex flex-col ${isRTL ? 'text-right' : ''}`} ref={refScrollUp}>
      <Breadcrumb separator=">" items={[{title: <a href="/">{translate(translations.home)}</a>}, {title: <a href={`/categories/${category.id}`}>{translate(category.name)}</a>}, {title: <a href={`/categories/${category.id}/${section.id}`}>{translate(section.name)}</a>}, {title: translate(a.name)}]} />
        <div>
          <h1 className="fade-up-0"
              data-animation="animate__fadeInUp">{title}</h1>
          <p className="fade-up-1"
              data-animation="animate__fadeInUp">{new Date(a.updated_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
          <div className={`flex items-center mt-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <TextReader />
            <ShareButton />
          </div>
        </div>
        {a && <div className={`article mt-10 ${isRTL ? 'text-right' : 'text-left'} fade-up-2`}dangerouslySetInnerHTML={{ __html: body }} data-animation="animate__fadeInUp" />}
        <div className="relative w-full mt-8">
    <a 
      onClick={handleScrollToTop} 
      className={`
        absolute underline cursor-pointer
        ${isRTL ? 'left-0' : 'right-0'}
      `}
    >
      <strong className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
        {translate(translations.backToTop)} 
        <ArrowUpOutlined className={isRTL ? 'mr-2' : 'ml-2'} />
      </strong>
    </a>
  </div>
      </div>
      </Container>
    <div className="py-16 w-full md:flex justify-center text-black bg-[#FFF8F7] h-auto hidden">
      <div className="sm:w-full px-8 lg:w-4/5 w-screen">
        {channels.title && (
          <div className="mx-auto text-center text-xl  md:text-2xl font-bold">{translate(channels.title)} </div>
        )}
        {channels.subtitle && (
          <div className="mx-auto text-center px-4 md:px-6 mt-4 mb-10 text-base md:text-lg">{translate(channels.subtitle)} </div>
        )}
        <div className="flex flex-col md:flex-row flex-wrap gap-2 md:gap-4 justify-center md:justify-between max-w-sm md:max-w-full mx-auto md:p-4">
          {channels.fb_link && (
        <a
        href={translate(channels.fb_link)}
        className="fade-up-3 social-icon"
        data-animation="animate__fadeInUp"
        target="_blank"
        aria-label="Facebook"
      >
        <FaFacebook className="social-icon-svg" />
        <div className="social-icon-text">{translate(channels.fb)}</div>
      </a>
          )}
          {channels.fbmess_link && (
           <a
           href={translate(channels.fbmess_link)}
           className="fade-up-3 social-icon"
           data-animation="animate__fadeInUp"
           target="_blank"
           aria-label="Facebook Messenger"
         >
           <FaFacebookMessenger className="social-icon-svg"  />
           <div className="social-icon-text">{translate(channels.fbmess)}</div>
         </a>
          )}
          {channels.whatsapp_link && (
             <a
             href={translate(channels.whatsapp_link)}
             className="fade-up-3 social-icon"
             data-animation="animate__fadeInUp"
             target="_blank"
             aria-label="Whatsapp"
           >
             <FaWhatsapp className="social-icon-svg"/>
             <div className="social-icon-text">{translate(channels.whatsapp)}</div>
           </a>
          )}
          {channels.email_link && (
          <a
          href={`mailto:${translate(channels.email_link)}`}
          className="fade-up-3 social-icon"
          data-animation="animate__fadeInUp"
          target="_blank"
          aria-label="Email"
        >
          <FaEnvelope className="social-icon-svg"/>
          <div className="social-icon-text">{translate(channels.email)}</div>
        </a>
          )}
          {channels.instagram_link && (
              <a
              href={translate(channels.instagram_link)}
              className="fade-up-3 social-icon"
              data-animation="animate__fadeInUp"
              target="_blank"
              aria-label="Instagram"
            >
              <FaInstagram className="social-icon-svg" />
              <div className="social-icon-text">{translate(channels.instagram)}</div>
            </a>
          )}
          {channels.tiktok_link && (
           <a
           href={translate(channels.tiktok_link)}
           className="fade-up-3 social-icon"
           data-animation="animate__fadeInUp"
           target="_blank"
           aria-label="TikTok"
         >
           <FaTiktok className="social-icon-svg" />
           <div className="social-icon-text">{translate(channels.tiktok)}</div>
         </a>
          )}
          {channels.telegram_link && (
          <a
          href={translate(channels.telegram_link)}
          className="fade-up-3 social-icon"
          data-animation="animate__fadeInUp"
          target="_blank"
          aria-label="Telegram"
        >
          <FaTelegram className="social-icon-svg" />
          <div className="social-icon-text">{translate(channels.telegram)}</div>
        </a>
          )}
          {channels.whatsappc_link && (
             <a
             href={translate(channels.whatsappc_link)}
             className="fade-up-3 social-icon"
             data-animation="animate__fadeInUp"
             target="_blank"
             aria-label="WhatsApp Channel"
           >
             <FaWhatsappSquare className="social-icon-svg" />
             <div className="social-icon-text">{translate(channels.whatsappc)}</div>
           </a>
          )}
        </div>
      </div>
    </div>
  </div>
}