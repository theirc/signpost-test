import { Container } from "./container";
import moment from "moment";
import {
  FaTiktok,
  FaFacebook,
  FaFacebookMessenger,
  FaInstagram,
  FaLinkedin,
  FaMailBulk,
  FaPhoneAlt,
  FaTwitter,
  FaWhatsapp,
  FaInfo,
  FaLink,
} from "react-icons/fa";
import { useParams } from "react-router-dom";
import { app, translate } from "../app";
import { translations } from "../../translations";
import { languages } from "../locale";
import React from "react";
import { Footer } from ".";
import { Breadcrumb } from "antd";

function formatDate(timestamp) {
  return moment(timestamp).format("MM/DD/YYYY, h:mm a");
}

export function GetIconForChannel({ channel }: { channel: string }) {
  const icons = {
    phone: FaPhoneAlt,
    email: FaMailBulk,
    whatsapp: FaWhatsapp,
    facebook: FaFacebook,
    website: FaLink,
    description: FaInfo,
    instagram: FaInstagram,
    twitter: FaTwitter,
    linkedin: FaLinkedin,
    tiktok: FaTiktok,
    Messenger: FaFacebookMessenger,
  };
  const IconComponent = icons[channel.toLowerCase()] || FaInfo;
  return <IconComponent className="aligned-icon" />;
}

export function getContactDetailLink(info: {
  channel: string;
  contactDetails: string;
}) {
  const { channel, contactDetails } = info;

  switch (channel.toLowerCase()) {
    case "email":
      return (
        <span
          onClick={() => (window.location.href = `mailto:${contactDetails}`)}
          className="hover:text-blue-600 cursor-pointer"
        >
          {contactDetails}
        </span>
      );
    case "Phone":
      return <a href={`tel:${contactDetails}`}>{contactDetails}</a>;
    case "whatsapp":
      return <a href={`https://wa.me/${contactDetails}`}>{contactDetails}</a>;
    case "viber":
      return (
        <a href={`viber://chat/?number=%2${contactDetails}`}>
          {contactDetails}
        </a>
      );
    case "telegram":
      return <a href={`https://t.me/${contactDetails}`}>{contactDetails}</a>;
    case "signal":
      return (
        <a href={`https://signal.me/#p/${contactDetails}`}>{contactDetails}</a>
      );
    default:
      return (
        <a
          href={contactDetails}
          target="_blank"
          rel="noopener noreferrer"
          className="text-black hover:text-blue-600"
        >
          {contactDetails}
        </a>
      );
  }
}


function ContactDetails({ contactInfo }) {
  const isRTL = languages[app.locale]?.rtl;

  return (
    <div className={`flex flex-wrap items-start gap-6 ${isRTL ? 'flex-row-reverse' : ''}`}>
      {contactInfo.map((info, index) => {
        if (!info.contact_details) return null;

        const Icon = <GetIconForChannel channel={info.channel} />;
        const ContactDetail = getContactDetailLink({
          channel: info.channel,
          contactDetails: info.contact_details,
        });

        return (
          <div key={index} className={`flex w-full md:w-auto md:flex-row items-center ${isRTL ? 'space-x-reverse space-x-3 flex-row-reverse' : 'space-x-3'
            }`}>
            {/* Icon and Channel Name */}
            <div className="text-md text-gray-600 m-1">
              {Icon}
              {/* <h1 className="text-sm font-bold">{info.channel}</h1> */}
            </div>
            {/* Contact Details */}
            <div className={`text-sm ${isRTL ? 'text-right' : 'text-left'}`}>{ContactDetail}</div>
          </div>
        );
      })}
    </div>
  );
}

export function Service() {
  let { id } = useParams();
  const isRTL = languages[app.locale]?.rtl;

  const service: Service = app.data.services[id];
  console.log(service, "Service Detail:");

  if (!service) {
    return <div>Service {id} not found</div>;
  }

  function renderHours(hours: unknown): JSX.Element[] | null {
    if (!Array.isArray(hours)) {
      return null;
    }
    const validHours = hours
      .filter(
        (hour: any) =>
          typeof hour === "object" &&
          hour.Day &&
          hour.open.trim() &&
          hour.close.trim()
      )
      .map((hour: any) => (
        <div key={hour.Day} className="hours-container">
          <span className="day-label">{hour.Day}: </span>
          <span className="time">
            {hour.open} - {hour.close}
          </span>
        </div>
      ));
    return validHours.length > 0 ? validHours : null;
  }

  const hourDisplay = renderHours(service.addHours);
  const title = translate(service.name);
  const location = translate(service.address);
  const description = translate(service.description);
  const providerName = translate(
    app.data.providers[service?.provider]?.name
  );

  return (
    <div className={`text-black overflow-y-auto $isRTL ? 'rtl' : ''}`}>
      <Container className={`text-black $isRTL ? 'rtl' : ''}`} id="main-content">
        <Breadcrumb separator=">" className={isRTL ? 'flex flex-row-reverse rs_skip' : 'rs_skip'} items={[{ title: <a href="/">{translate(translations.home)}</a> }, { title: translate(translations.services) }]} />
        <h1 className={`text-4xl font-normal leading-snug ${isRTL ? 'text-right' : ''}`}>{title}</h1>
        <h2 className={`text-3xl font-normal leading-snug ${isRTL ? 'text-right' : ''}`}>{providerName}</h2>
        <h3 className={`text-gray-600 text-sm font-normal leading-snug ${isRTL ? 'text-right' : ''}`}>
          {translate(translations.lastUpdated)} {formatDate(service.date_updated)}
        </h3>

        <div className={`bg-neutral-container-bg rounded p-6 mb-4 ${isRTL ? 'text-right' : ''}`}>
          <div dangerouslySetInnerHTML={{ __html: description }} />
        </div>

        {location && (
          <div className={`bg-neutral-container-bg rounded p-6 mb-4 ${isRTL ? 'text-right' : ''}`}>
            <h4 className="mb-4 mt-6">{location}</h4>
          </div>
        )}

        <div className={`bg-neutral-container-bg rounded p-6 mb-4 ${isRTL ? 'text-right' : ''}`}>
          <ContactDetails contactInfo={service.contactInfo} />
        </div>
        {hourDisplay && hourDisplay.length > 0 && (
          <div className={`bg-neutral-container-bg rounded p-6 mb-4 ${isRTL ? 'text-right' : ''}`}>
            <h2 className="mb-2">{translate(translations.openingHours)}</h2>
            <div className="space-y-2">{hourDisplay}</div>
          </div>
        )}
      </Container>
        <Footer />
    </div>
  );
}