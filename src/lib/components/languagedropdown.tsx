
import { useMemo } from 'react';
import React from 'react';
import { Dropdown, Divider, Space, Button } from "antd";
import { DownOutlined } from "@ant-design/icons";
import { langauages } from "../locale";
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
    app.locale = lang;
    app.update();
  };

  const items = supportedLocales.map((localeCode) => ({
    key: localeCode,
    label: langauages[localeCode as keyof typeof langauages]?.name || localeCode,
    onClick: () => handleLanguageChange(localeCode),
  }));

  return (
    <Dropdown menu={{ items }} trigger={['click']} >
      <a onClick={(e) => e.preventDefault()} className={`language-dropdown text-white font-inter ${isMobile ? "w-full" : ""}`}>
          {langauages[app.locale as keyof typeof langauages]?.name || app.locale}
          <Space>
          <DownOutlined />
          </Space>
      </a>
    </Dropdown>
  );
}

export default LanguageDropdown;