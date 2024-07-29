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

  const socialIconClass = "flex flex-col items-center p-4 gap-4 flex-1 rounded-lg bg-white shadow-lg"
  const iconStyle = "text-gray-700 hover:text-gray-900 w-8 h-8 md:w-10 md:h-10"
  const textStyle = "mt-1 md:mt-2 text-gray-800 text-center font-medium text-xs md:text-sm lg:text-base no-underline"


  return (
    <Container block={block}>
      <div className="flex flex-col items-center">
      {block.title && (
        <h2 className="text-xl md:text-2xl font-bold mb-4">{translate(block.title)}</h2>
      )}
      {block.subtitle && (
        <p className="text-base md:text-lg mb-10 max-w-2xl text-center">{translate(block.subtitle)}</p>
      )}
      <div className="flex flex-col md:flex-row md:flex-wrap gap-2 md:gap-4 w-full max-w-sm md:max-w-full mx-auto md:justify-between md:p-4">
      {block.fb_link && (
        <a
          href={translate(props.block.fb_link)}
          className={socialIconClass} 
          target="_blank"
          aria-label="Facebook"
        >
          <FaFacebook className={`${iconStyle} w-8 h-8`} />
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
          <FaFacebookMessenger className={`${iconStyle} w-8 h-8`}  />
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
          <FaWhatsapp className={`${iconStyle} w-8 h-8`} />
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
          <FaEnvelope className={`${iconStyle} w-8 h-8`} />
          <div className={textStyle}>{translate(block.email)}</div>
        </a>
      )}
      {block.instagram_link && (
        <a
          href={translate(block.instagram_link)}
          className={socialIconClass}
          target="_blank"
          aria-label="Instagram"
        >
          <FaInstagram className={`${iconStyle} w-8 h-8`} />
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
          <FaTiktok className={`${iconStyle} w-8 h-8`} />
          <div className={textStyle}>{translate(block.tiktok)}</div>
        </a>
      )}
      {block.telegram_link && (
        <a
          href={translate(block.telegram_link)}
          className={socialIconClass} 
          target="_blank"
          aria-label="Telegram"
        >
          <FaTelegram className={`${iconStyle} w-8 h-8`} />
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
          <FaWhatsappSquare className={`${iconStyle} w-8 h-8`} />
          <div className={textStyle}>{translate(block.whatsappc)}</div>
        </a>
      )}
      </div>
      </div>
    </Container>
  );
}