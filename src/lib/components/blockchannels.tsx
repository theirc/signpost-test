import { translate } from "../app";
import { Container } from "./container";
import { useAnimateOnScroll } from "./useAnimateOnScroll";
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
  useAnimateOnScroll();


  return (
    <Container block={block}>
      <div className="flex flex-col">
      {block.title && (
        <h1 className="fade-up-0 text-3xl font-normal leading-snug title" data-animation="animate__fadeInUp">{translate(block.title)}</h1>
      )}
      {block.subtitle && (
        <p className="fade-up-1 subtitle text-2xl font-medium leading-normal" data-animation="animate__fadeInUp">
          {translate(block.subtitle)}</p>
      )}
      <div className="flex flex-col md:flex-row md:flex-wrap gap-4 md:gap-4 w-full max-w-sm md:max-w-full mx-auto md:justify-between md:p-4">
      {block.fb_link && (
        <a
          href={translate(props.block.fb_link)}
          className="fade-up-2 social-icon"
          data-animation="animate__fadeInUp"
          target="_blank"
          aria-label="Facebook"
        >
          <FaFacebook className="social-icon-svg" />
          <div className="social-icon-text">{translate(block.fb)}</div>
        </a>
      )}
      {block.fbmess_link && (
        <a
          href={translate(block.fbmess_link)}
          className="fade-up-2 social-icon"
          data-animation="animate__fadeInUp"
          target="_blank"
          aria-label="Facebook Messenger"
        >
          <FaFacebookMessenger className="social-icon-svg"  />
          <div className="social-icon-text">{translate(block.fbmess)}</div>
        </a>
      )}
      {block.whatsapp_link && (
        <a
          href={translate(block.whatsapp_link)}
          className="fade-up-2 social-icon"
          data-animation="animate__fadeInUp"
          target="_blank"
          aria-label="Whatsapp"
        >
          <FaWhatsapp className="social-icon-svg"/>
          <div className="social-icon-text">{translate(block.whatsapp)}</div>
        </a>
      )}
      {block.email_link && (
        <a
          href={`mailto:${translate(block.email_link)}`}
          className="fade-up-2 social-icon"
          data-animation="animate__fadeInUp"
          target="_blank"
          aria-label="Email"
        >
          <FaEnvelope className="social-icon-svg"/>
          <div className="social-icon-text">{translate(block.email)}</div>
        </a>
      )}
      {block.instagram_link && (
        <a
          href={translate(block.instagram_link)}
          className="fade-up-2 social-icon"
          data-animation="animate__fadeInUp"
          target="_blank"
          aria-label="Instagram"
        >
          <FaInstagram className="social-icon-svg" />
          <div className="social-icon-text">{translate(block.instagram)}</div>
        </a>
      )}
      {block.tiktok_link && (
        <a
          href={translate(block.tiktok_link)}
          className="fade-up-2 social-icon"
          data-animation="animate__fadeInUp"
          target="_blank"
          aria-label="TikTok"
        >
          <FaTiktok className="social-icon-svg" />
          <div className="social-icon-text">{translate(block.tiktok)}</div>
        </a>
      )}
      {block.telegram_link && (
        <a
          href={translate(block.telegram_link)}
          className="fade-up-2 social-icon"
          data-animation="animate__fadeInUp"
          target="_blank"
          aria-label="Telegram"
        >
          <FaTelegram className="social-icon-svg" />
          <div className="social-icon-text">{translate(block.telegram)}</div>
        </a>
      )}
      {block.whatsappc_link && (
        <a
          href={translate(block.whatsappc_link)}
          className="fade-up-2 social-icon"
          data-animation="animate__fadeInUp"
          target="_blank"
          aria-label="WhatsApp Channel"
        >
          <FaWhatsappSquare className="social-icon-svg" />
          <div className="social-icon-text">{translate(block.whatsappc)}</div>
        </a>
      )}
      </div>
      </div>
    </Container>
  );
}