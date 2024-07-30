import { useMemo } from 'react';
import React from 'react';
import { Dropdown, Space } from "antd";
import { DownOutlined } from "@ant-design/icons";
import ReactCountryFlag from 'react-country-flag';
import { languages } from "../locale";
import { app } from "../app";

interface LanguageDropdownProps {
  isMobile?: boolean;
}

export function LanguageDropdown({ isMobile = false }: LanguageDropdownProps) {

  const supportedLocales = React.useMemo(() => {
    const locales = new Set<string>([app.defaultLocale]);
    app.page.content.forEach(contentItem => {
      if (contentItem.text && typeof contentItem.text === 'object') {
        Object.keys(contentItem.text).forEach(locale => {
          locales.add(locale);
        });
      }
    });
    return Array.from(locales).filter(locale => locale !== app.locale);
  }, [app.page.content, app.defaultLocale, app.locale]);

  const handleLanguageChange = (lang: string) => {
    if (app.locale === lang) return;
    app.locale = lang;
    localStorage.setItem('preferredLanguage', lang);
    app.update();  
  };

  const getLanguageName = (localeCode: keyof typeof languages) => {
    return languages[localeCode]?.name || localeCode;
  };

  const items = supportedLocales.map((localeCode) => ({
    key: localeCode,
    label: (
    <div onClick={() => handleLanguageChange(localeCode)} className="flex items-center space-x-2">
    <ReactCountryFlag countryCode={languages[localeCode].countryCode} svg style={{ width: '1.5em', height: '1.5em' }} />
    <span>{getLanguageName(localeCode as keyof typeof languages)}</span>
  </div>
),
}));

  return (
    <Dropdown menu={{ items }} trigger={['click']} >
    <a onClick={(e) => e.preventDefault()} className={`language-dropdown text-white ${isMobile ? "w-full" : ""}`}>
      <Space>
        <ReactCountryFlag countryCode={languages[app.locale as keyof typeof languages].countryCode} svg style={{ width: '1em', height: '1em' }} />
        <span>{getLanguageName(app.locale as keyof typeof languages)}</span>
        <DownOutlined />
      </Space>
    </a>
  </Dropdown>
);
}

export default LanguageDropdown;