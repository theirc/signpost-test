import { useMemo } from 'react';
import { Dropdown, Space } from "antd";
import { DownOutlined } from "@ant-design/icons";
import { languages } from "../locale";
import { app } from "../app";

interface LanguageDropdownProps {
  isMobile?: boolean;
}

export function LanguageDropdown({ isMobile = false }: LanguageDropdownProps) {
  const supportedLocales = useMemo(() => {
    const locales = new Set<string>([app.defaultLocale]);
    app.page.content.forEach(contentItem => {
      if (contentItem.text && typeof contentItem.text === 'object') {
        Object.keys(contentItem.text).forEach(locale => {
          locales.add(locale);
        });
      }
    });
    return Array.from(locales);
  }, [app.page.content, app.defaultLocale]);

  const handleLanguageChange = (lang: string) => {
    if (lang === app.locale) return;

    app.locale = lang;
    app.update();

    const shortCode = lang.split('-')[0];
    const newPath = `/${shortCode}`;
    window.history.pushState(null, '', newPath);
  };

  const getLanguageName = (localeCode: string) => {
    return languages[localeCode]?.[localeCode] || languages[localeCode]?.en || localeCode;
  };

  const getShortCode = (localeCode: string) => localeCode.split('-')[0];

  const items = supportedLocales
    .filter(localeCode => localeCode !== app.locale) 
    .map((localeCode) => ({
      key: localeCode,
      label: getLanguageName(localeCode),
      onClick: () => handleLanguageChange(localeCode),
    }));

  return (
    <Dropdown menu={{ items }} trigger={['click']} className='nav-dropdown'>
      <a onClick={(e) => e.preventDefault()} className={`language-dropdown text-white font-inter ${isMobile ? "w-full" : ""}`}>
        {getLanguageName(app.locale)}
        <Space>
          <DownOutlined />
        </Space>
      </a>
    </Dropdown>
  );
}

export default LanguageDropdown;