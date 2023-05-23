import CookieBanner from '@ircsignpost/signpost-base/dist/src/cookie-banner';
import DistanceAway from '@ircsignpost/signpost-base/dist/src/distance-away';
import { HeaderBannerStrings } from '@ircsignpost/signpost-base/dist/src/header-banner';
import HomePage, {
  HomePageStrings,
} from '@ircsignpost/signpost-base/dist/src/home-page';
import { MenuOverlayItem } from '@ircsignpost/signpost-base/dist/src/menu-overlay';
import { ServiceMapProps } from '@ircsignpost/signpost-base/dist/src/service-map';
import {
  fetchRegions,
  fetchServices,
  fetchServicesCategories,
} from '@ircsignpost/signpost-base/dist/src/service-map-common';
import {
  CategoryWithSections,
  ZendeskCategory,
} from '@ircsignpost/signpost-base/dist/src/zendesk';
import { Button } from 'antd';
import type { NextPage } from 'next';
import { GetStaticProps } from 'next';
import getConfig from 'next/config';
import React, { useState } from 'react';

import {
  ABOUT_US_ARTICLE_ID,
  CATEGORIES_TO_HIDE,
  CATEGORY_ICON_NAMES,
  COUNTRY_ID,
  GOOGLE_ANALYTICS_IDS,
  MAP_DEFAULT_COORDS,
  REVALIDATION_TIMEOUT_SECONDS,
  SEARCH_BAR_INDEX,
  SECTION_ICON_NAMES,
  SITE_TITLE,
  USE_CAT_SEC_ART_CONTENT_STRUCTURE,
  ZENDESK_AUTH_HEADER,
} from '../lib/constants';
import {
  LOCALES,
  Locale,
  getLocaleFromCode,
  getZendeskLocaleId,
} from '../lib/locale';
import { getHeaderLogoProps } from '../lib/logo';
import { getMenuItems } from '../lib/menu';
import { SocialMediaLinks, getSocialMediaProps } from '../lib/social-media';
import {
  COMMON_DYNAMIC_CONTENT_PLACEHOLDERS,
  HOME_PAGE_DYNAMIC_CONTENT_PLACEHOLDERS,
  getShareButtonStrings,
  populateHeaderBannerStrings,
  populateHomePageStrings,
  populateMenuOverlayStrings,
  populateSocialMediaLinks,
} from '../lib/translations';
import { getZendeskMappedUrl, getZendeskUrl } from '../lib/url';
// TODO Use real Zendesk API implementation.
import {
  getArticle,
  getCategories,
  getCategoriesWithSections,
  getTranslationsFromDynamicContent,
} from '../lib/zendesk-fake';

interface HomeProps {
  currentLocale: Locale;
  strings: HomePageStrings;
  headerBannerStrings: HeaderBannerStrings;
  socialMediaLinks: SocialMediaLinks;
  // A list of |MenuOverlayItem|s to be displayed in the header and side menu.
  menuOverlayItems: MenuOverlayItem[];
  serviceMapProps: ServiceMapProps;
  // The HTML text of the About Us category shown on the home page.
  aboutUsTextHtml: string;
  categories: ZendeskCategory[] | CategoryWithSections[];
}

const Home: NextPage<HomeProps> = ({
  currentLocale,
  strings,
  headerBannerStrings,
  socialMediaLinks,
  menuOverlayItems,
  serviceMapProps,
  aboutUsTextHtml,
  categories,
}) => {
  const { publicRuntimeConfig } = getConfig();

  const [distance, setDistance] = useState<number>(50);

  const handleDistanceChange = (value: number) => {
    setDistance(value);
    // Additional logic to handle the distance change
  };
  return (
    <>
      <HomePage
        title={SITE_TITLE}
        currentLocale={currentLocale}
        locales={LOCALES}
        strings={strings}
        menuOverlayItems={menuOverlayItems}
        headerBannerProps={{
          ...headerBannerStrings,
          socialMediaData: getSocialMediaProps(socialMediaLinks),
        }}
        headerLogoProps={getHeaderLogoProps(currentLocale)}
        searchBarIndex={SEARCH_BAR_INDEX}
        serviceMapProps={serviceMapProps}
        aboutUsTextHtml={aboutUsTextHtml}
        categories={categories}
        signpostVersion={publicRuntimeConfig?.version}
        cookieBanner={
          <CookieBanner
            strings={strings.cookieBannerStrings}
            googleAnalyticsIds={GOOGLE_ANALYTICS_IDS}
          />
        }
      />
      <DistanceAway distance={distance} onChange={handleDistanceChange}>
        <Button>Distance</Button>
      </DistanceAway>
    </>
  );
};

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  const currentLocale: Locale = getLocaleFromCode(locale ?? 'en-us');
  let dynamicContent = await getTranslationsFromDynamicContent(
    getZendeskLocaleId(currentLocale),
    COMMON_DYNAMIC_CONTENT_PLACEHOLDERS.concat(
      HOME_PAGE_DYNAMIC_CONTENT_PLACEHOLDERS
    ),
    getZendeskUrl(),
    ZENDESK_AUTH_HEADER
  );

  let categories: ZendeskCategory[] | CategoryWithSections[];
  if (USE_CAT_SEC_ART_CONTENT_STRUCTURE) {
    categories = await getCategoriesWithSections(
      currentLocale,
      getZendeskUrl(),
      (c) => !CATEGORIES_TO_HIDE.includes(c.id)
    );
    categories.forEach(({ sections }) => {
      sections.forEach(
        (s) => (s.icon = SECTION_ICON_NAMES[s.id] || 'help_outline')
      );
    });
  } else {
    categories = await getCategories(currentLocale, getZendeskUrl());
    categories = categories.filter((c) => !CATEGORIES_TO_HIDE.includes(c.id));
    categories.forEach(
      (c) => (c.icon = CATEGORY_ICON_NAMES[c.id] || 'help_outline')
    );
  }

  const aboutUsArticle = await getArticle(
    currentLocale,
    ABOUT_US_ARTICLE_ID,
    getZendeskUrl(),
    getZendeskMappedUrl(),
    ZENDESK_AUTH_HEADER
  );
  const aboutUsTextHtml = aboutUsArticle ? aboutUsArticle.body : '';

  const menuOverlayItems = getMenuItems(
    populateMenuOverlayStrings(dynamicContent),
    categories,
    !!aboutUsArticle
  );

  const strings = populateHomePageStrings(dynamicContent);

  let regions = await fetchRegions(COUNTRY_ID, currentLocale.url);
  regions.sort((a, b) => a.name.normalize().localeCompare(b.name.normalize()));

  const serviceCategories = await fetchServicesCategories(
    COUNTRY_ID,
    currentLocale.url
  );
  serviceCategories.sort((a, b) =>
    a.name.normalize().localeCompare(b.name.normalize())
  );

  const services = await fetchServices(COUNTRY_ID, currentLocale.url);
  services.sort((a, b) => a.name.normalize().localeCompare(b.name.normalize()));

  return {
    props: {
      currentLocale,
      strings,
      menuOverlayItems,
      headerBannerStrings: populateHeaderBannerStrings(dynamicContent),
      socialMediaLinks: populateSocialMediaLinks(dynamicContent),
      serviceMapProps: {
        regions,
        serviceCategories,
        services,
        defaultCoords: MAP_DEFAULT_COORDS,
        shareButton: getShareButtonStrings(dynamicContent),
      },
      categories,
      aboutUsTextHtml,
    },
    revalidate: REVALIDATION_TIMEOUT_SECONDS,
  };
};

export default Home;
