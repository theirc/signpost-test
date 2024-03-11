import { DownOutlined } from '@ant-design/icons';
import { Button, Dropdown, Menu } from 'antd';
import React from 'react';

export interface ContactInfo {
  channel: string;
  contact_details: string;
}

export interface ContactDropdownProps {
  serviceId: number;
  contactInfo: ContactInfo[];
  strings: string;
}

export function ContactDropdown({
  serviceId,
  contactInfo,
  strings,
}: ContactDropdownProps) {
  const content: React.ReactNode[] = [];

  contactInfo?.forEach((info, index) => {
    content.push(
      <Menu.Item key={`${serviceId}-${index}`}>
        {isPhoneNumber(info.contact_details) ? (
          <a onClick={() => handlePhoneNumberClick(info.contact_details)}>
            {info.channel}
          </a>
        ) : isEmailAddress(info.contact_details) ? (
          <a onClick={() => handleEmailAddressClick(info.contact_details)}>
            {info.channel}
          </a>
        ) : (
          <a onClick={() => handleWebsiteClick(info.contact_details)}>
            {info.channel}
          </a>
        )}
      </Menu.Item>
    );
  });

  if (content.length == 0) return null;

  const overlay = <Menu>{...content}</Menu>;

  return (
    <Dropdown
      overlay={overlay}
      placement="bottomLeft"
      trigger={['click']}
      overlayClassName="custom-dropdown-content"
    >
      <Button className="contact-button" size="small" shape="round">
        {strings}
        <DownOutlined />
      </Button>
    </Dropdown>
  );
}

function isPhoneNumber(contactDetails: string) {
  if (!contactDetails) return false;
  return /^\d+-?\d*$/.test(contactDetails);
}

function handlePhoneNumberClick(phoneNumber: string) {
  if (isPhoneNumber(phoneNumber)) {
    window.location.href = `tel:${phoneNumber}`;
  }
}
function isEmailAddress(contactDetails: string) {
  if (!contactDetails) return false;
  return /\S+@\S+\.\S+/.test(contactDetails);
}

function handleEmailAddressClick(emailAddress: string) {
  if (isEmailAddress(emailAddress)) {
    window.location.href = `mailto:${emailAddress}`;
  }
}

function handleWebsiteClick(website: string) {
  window.location.href = `${website}`;
}
