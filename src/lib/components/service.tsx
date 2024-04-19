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
import React, { useEffect, useState } from "react";

function formatDate(timestamp) {
  return moment(timestamp).format("MM/DD/YYYY, h:mm a");
}

function GetIconForChannel({ channel }: { channel: string }) {
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

function getContactDetailLink(info: {
  channel: string;
  contactDetails: string;
}) {
  const { channel, contactDetails } = info;

  switch (channel.toLowerCase()) {
    case "email":
      return (
        <span
          onClick={() => (window.location.href = `mailto:${contactDetails}`)}
          className="hover-blue cursor-pointer"
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

export function Service() {
  let { id } = useParams();
  const [service, setService] = useState(null);
  const [providerName, setProviderName] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const fetchedService = app.data.services[id];
      console.log("Fetched service:", service);
      if(!fetchedService) {
        setLoading(false);
        return
      }
     setService(fetchedService);
     
     //Fetching provider data from provider id 
     if(fetchedService.provider) {
      const providerData = app.data.categories.providers[fetchedService.provider];
      if(providerData && providerData.name ){
        setProviderName(translate(providerData.name));
      } else {
        setProviderName(null)
      }
    
     }
     setLoading(false);
    }
    fetchData();
  }, [id]);
  if (loading) {
    return <div>Loading ....</div>
  } 
  if (!service) {
    return <div>Service {id} not found</div>
  }
  function ContactDetails({ contactInfo }) {
    return (
      <div className="space-y-4">
        {contactInfo.map((info, index) => {
          if (!info.contact_details) return null;

          const Icon = <GetIconForChannel channel={info.channel} />;
          const ContactDetail = getContactDetailLink({
            channel: info.channel,
            contactDetails: info.contact_details,
          });

          return (
            <div key={index} className="flex flex-row items-start p-2">
              {/* Icon and Channel Name */}
              <div className="flex items-center space-x-2 mr-4">
                {Icon}
                {/* <h1 className="text-sm font-bold">{info.channel}</h1> */}
              </div>
              {/* Contact Details */}
              <div className="text-md text-gray-600">{ContactDetail}</div>
            </div>
          );
        })}
      </div>
    );
  }

  const hourDisplay = service.addHours
    ?.map((hour, index) => {
      if (!hour.open.trim() || !hour.close.trim()) {
        return null;
      }

      return (
        <div key={index} className="hours-container">
          <span className="day-label">{translate(hour.Day.trim())}: </span>
          <span className="time">
            {hour.open} - {hour.close}
          </span>
        </div>
      );
    })
    .filter((hour) => hour !== null);

  const title = translate(service.name);
  const location = translate(service.address);
  const description = translate(service.description);
  const providerInfo = translate(providerName)

  return (
    <div className="py-30 mb-20 w-full flex flex-col items-center text-black bg-white overflow-auto">
      <div className="container max-w-4xl px-4">
        <h1 className="text-3xl font-bold">{title}</h1>
        <p>Last Updated: {formatDate(service.date_updated)}</p>
        <h2 className="text-xl">{location}</h2>
        {providerName && <p>{providerInfo}</p>}

        <div
          className="service mt-10"
          dangerouslySetInnerHTML={{ __html: description }}
        />
        {hourDisplay && hourDisplay.length > 0 && (
          <div className="bg-white shadow-lg rounded-lg p-6 mt-4 mb-4">
            <h2 className="text-xl font-bold mb-3">
              {translate("Service Hours")}
            </h2>
            <div className="space-y-2">{hourDisplay}</div>
          </div>
        )}

        {service.contactInfo && service.contactInfo.length > 0 && (
          <div className="bg-white shadow-lg rounded-lg p-6 mt-4 mb-4">
            <h2 className="text-xl font-bold mb-3">Contact Information</h2>
            <ContactDetails contactInfo={service.contactInfo} />
          </div>
        )}
      </div>
    </div>
  );
}
