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
import React from "react";
import { Footer } from ".";

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
  return (
    <div className="flex flex-wrap items-start gap-6">
      {contactInfo.map((info, index) => {
        if (!info.contact_details) return null;

        const Icon = <GetIconForChannel channel={info.channel} />;
        const ContactDetail = getContactDetailLink({
          channel: info.channel,
          contactDetails: info.contact_details,
        });

        return (
          <div key={index} className="flex w-full md:w-auto md:flex-row items-center space-x-3">
            {/* Icon and Channel Name */}
            <div className="text-md text-gray-600">
              {Icon}
              {/* <h1 className="text-sm font-bold">{info.channel}</h1> */}
            </div>
            {/* Contact Details */}
            <div className="text-sm">{ContactDetail}</div>
          </div>
        );
      })}
    </div>
  );
}

export function Service() {
  let { id } = useParams();

  //ToDo: update the content in useEffect
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
    app.data.categories.providers[service?.provider]?.name
  );

  return (
    <div className="py-16 text-black text-base bg-white overflow-y-auto flex justify-center w-screen mb-10">
    <div className="text-black mx-auto max-w-[90rem] px-4 sm:px-8 pb-20">
    <h1 className="font-inter text-3xl whitespace-normal">{title}</h1>
     <h2 className="font-inter text-2xl font-normal">{providerName}</h2>
    <h3 className="font-inter text-gray-600 text-sm font-normal leading-[1.375rem]">
      Last Updated: {formatDate(service.date_updated)}
    </h3>

  <div className="bg-neutral-container-bg rounded p-6 mb-4">
    <div dangerouslySetInnerHTML={{ __html: description }} />
    </div>

    {location && (
      <div className="bg-neutral-container-bg rounded p-6 mb-4">
    <h4 className="mb-4 mt-6">{location}</h4>
    </div>
    )}
    
    <div className="bg-neutral-container-bg rounded p-6 mb-4">
    <ContactDetails contactInfo={service.contactInfo} />
    </div>
    {hourDisplay && hourDisplay.length > 0 && (
      <div className="bg-neutral-container-bg rounded p-6 mb-4">
              <h2 className="mb-2">{translate('Opening hours')}</h2>
              <div className="space-y-2">{hourDisplay}</div>
              </div>
    )}
  </div>
  </div>
);
}