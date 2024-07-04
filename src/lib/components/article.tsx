import { useParams } from "react-router-dom"
import { app, translate } from "../app"
import ShareButton from "./sharebutton"
import TextReader from "./textreader"
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

  const a: ZendeskArticle = app.data.zendesk.articles[id]
  const channels = app.page.content.find(x => x.type === 'channels') as BlockChannels

  const socialIconClass = "flex flex-col items-center p-4 md:p-4 gap-4 md:g-2 flex-1 rounded-lg bg-white shadow-lg no-underline"
  const iconStyle = "text-gray-700 hover:text-gray-900"
  const textStyle = "mt-1 md:mt-2 text-gray-800 text-center font-medium text-xs md:text-sm lg:text-base no-underline"


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

  return <div className="overflow-y-auto">
    <div className='py-16 w-full flex justify-center text-black bg-white h-auto' ref={refScrollUp}>
      <div className="sm:w-full px-8 lg:w-4/5 w-screen">
      <Breadcrumb separator=">" items={[{title: <a href="/">Home</a>}, {title: <a href={`/categories/${category.id}`}>{translate(category.name)}</a>}, {title: <a href={`/categories/${category.id}/${section.id}`}>{translate(section.name)}</a>}, {title: translate(a.name)}]} />
        <div className="flex flex-col">
          <h1>{title}</h1>
          <p>{new Date(a.updated_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
          <div className="flex items-center">
            <TextReader />
            <ShareButton />
          </div>
        </div>
        {a && <div className="article mt-10" dangerouslySetInnerHTML={{ __html: body }} />}
        <div className="flex">
          <a onClick={handleScrollToTop} className="text-black ml-auto underline cursor-pointer">
            <strong>Back to top <ArrowUpOutlined /></strong>
          </a>
        </div>
      </div>
    </div>
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
              className={socialIconClass}
              target="_blank"
              aria-label="Facebook"
            >
              <FaFacebook size={40} className={iconStyle} />
              <div className={textStyle}>{translate(channels.fb)}</div>
            </a>
          )}
          {channels.fbmess_link && (
            <a
              href={translate(channels.fbmess_link)}
              className={socialIconClass}
              target="_blank"
              aria-label="Facebook Messenger"
            >
              <FaFacebookMessenger size={40} className={iconStyle} />
              <div className={textStyle}>{translate(channels.fbmess)}</div>
            </a>
          )}
          {channels.whatsapp_link && (
            <a
              href={translate(channels.whatsapp_link)}
              className={socialIconClass}
              target="_blank"
              aria-label="Whatsapp"
            >
              <FaWhatsapp size={40} className={iconStyle} />
              <div className={textStyle}>{translate(channels.whatsapp)}</div>
            </a>
          )}
          {channels.email_link && (
            <a
              href={`mailto:${translate(channels.email_link)}`}
              className={socialIconClass}
              target="_blank"
              aria-label="Email"
            >
              <FaEnvelope size={40} className={iconStyle} />
              <div className={textStyle}>{translate(channels.email)}</div>
            </a>
          )}
          {channels.instagram_link && (
            <a
              href={translate(channels.instagram_link)}
              className={socialIconClass}
              target="_blank"
              aria-label="Instagram"
            >
              <FaInstagram size={40} className={iconStyle} />
              <div className={textStyle}>{translate(channels.instagram)}</div>
            </a>
          )}
          {channels.tiktok_link && (
            <a
              href={translate(channels.tiktok_link)}
              className={socialIconClass}
              target="_blank"
              aria-label="TikTok"
            >
              <FaTiktok size={40} className={iconStyle} />
              <div className={textStyle}>{translate(channels.tiktok)}</div>
            </a>
          )}
          {channels.telegram_link && (
            <a
              href={translate(channels.telegram_link)}
              className={socialIconClass}
              target="_blank"
              aria-label="Telegram"
            >
              <FaTelegram size={40} className={iconStyle} />
              <div className={textStyle}>{translate(channels.telegram)}</div>
            </a>
          )}
          {channels.whatsappc_link && (
            <a
              href={translate(channels.whatsappc_link)}
              className={socialIconClass}
              target="_blank"
              aria-label="WhatsApp Channel"
            >
              <FaWhatsappSquare size={40} className={iconStyle} />
              <div className={textStyle}>{translate(channels.whatsappc)}</div>
            </a>
          )}
        </div>
      </div>
    </div>
  </div>
}