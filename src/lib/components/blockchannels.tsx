import { translate } from "../app";
import { Container } from "./container";
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

export function BlockChannels(props: { block: BlockChannels }) {
  const { block } = props;

  const socialIconClass = "flex flex-col items-center p-4 md:p-4 gap-4 md:g-2 flex-1 rounded-lg bg-white shadow-lg"
  const iconStyle = "text-gray-700 hover:text-gray-900"
  const textStyle = "mt-1 md:mt-2 text-gray-800 text-center font-medium text-xs md:text-sm lg:text-base no-underline"

  return (
    <Container block={block}>
      {block.title && (
        <div className="mx-auto text-center text-xl  md:text-2xl font-bold">{translate(props.block.title)} </div>
      )}
      {block.subtitle && (
        <div className="mx-auto text-center px-4 md:px-6 mt-4 mb-10 text-base md:text-lg">{translate(props.block.subtitle)} </div>
      )}
      <div className="flex flex-col md:flex-row flex-wrap gap-2 md:gap-4 justify-center md:justify-between max-w-sm md:max-w-full mx-auto md:p-4">
      {block.fb_link && (
        <a
          href={translate(props.block.fb_link)}
          className={socialIconClass} 
          target="_blank"
          aria-label="Facebook"
        >
          <FaFacebook size={40} className={iconStyle} />
          <div className={textStyle}>{translate(block.fb)}</div>
        </a>
      )}
      {block.fbmess_link && (
        <a
          href={translate(block.fbmess_link)}
          className={socialIconClass}
          target="_blank"
          aria-label="Facebook Messenger"
        >
          <FaFacebookMessenger size={40} className={iconStyle} />
          <div className={textStyle}>{translate(block.fbmess)}</div>
        </a>
      )}
      {block.whatsapp_link && (
        <a
          href={translate(block.whatsapp_link)}
          className={socialIconClass}
          target="_blank"
          aria-label="Whatsapp"
        >
          <FaWhatsapp size={40} className={iconStyle} />
          <div className={textStyle}>{translate(block.whatsapp)}</div>
        </a>
      )}
      {block.email_link && (
        <a
          href={`mailto:${translate(block.email_link)}`}
          className={socialIconClass}
          target="_blank"
          aria-label="Email"
        >
          <FaEnvelope size={40} className={iconStyle}/>
          <div className={textStyle} no-underline>{translate(block.email)}</div>
        </a>
      )}
      {block.instagram_link && (
        <a
          href={translate(block.instagram_link)}
          className={socialIconClass}
          target="_blank"
          aria-label="Instagram"
        >
          <FaInstagram size={40} className={iconStyle} />
          <div className={textStyle}>{translate(block.instagram)}</div>
        </a>
      )}
      {block.tiktok_link && (
        <a
          href={translate(block.tiktok_link)}
          className={socialIconClass} 
          target="_blank"
          aria-label="TikTok"
        >
          <FaTiktok size={40} className={iconStyle} />
          <div className={textStyle}>{translate(block.tiktok)}</div>
        </a>
      )}
      {block.telegram_link && (
        <a
          href={translate(props.block.telegram_link)}
          className={socialIconClass} 
          target="_blank"
          aria-label="Telegram"
        >
          <FaTelegram size={40} className={iconStyle} />
          <div className={textStyle}>{translate(block.telegram)}</div>
        </a>
      )}
      {block.whatsappc_link && (
        <a
          href={translate(block.whatsappc_link)}
          className={socialIconClass}
          target="_blank"
          aria-label="WhatsApp Channel"
        >
          <FaWhatsappSquare size={40} className={iconStyle} />
          <div className={textStyle}>{translate(block.whatsappc)}</div>
        </a>
      )}
      </div>
    </Container>
  );
}
