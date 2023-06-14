import { Directus } from '@directus/sdk';
import CookieBanner from '@ircsignpost/signpost-base/dist/src/cookie-banner';
import {
  getDirectusAccessibility,
  getDirectusArticles,
  getDirectusPopulationsServed,
  getDirectusProviders,
  getDirectusServiceCategories,
} from '@ircsignpost/signpost-base/dist/src/directus';
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
  getArticle,
  getCategories,
  getCategoriesWithSections,
  getTranslationsFromDynamicContent,
} from '@ircsignpost/signpost-base/dist/src/zendesk';
import type { NextPage } from 'next';
import { GetStaticProps } from 'next';
import getConfig from 'next/config';

import {
  ABOUT_US_ARTICLE_ID,
  CATEGORIES_TO_HIDE,
  CATEGORY_ICON_NAMES,
  COUNTRY_ID,
  DIRECTUS_AUTH_TOKEN,
  DIRECTUS_COUNTRY_ID,
  DIRECUTUS_INSTANCE,
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
import { getFooterItems, getMenuItems } from '../lib/menu';
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
  footerLinks?: MenuOverlayItem[];
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
  footerLinks,
}) => {
  const { publicRuntimeConfig } = getConfig();

  return (
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
      footerLinks={footerLinks}
      signpostVersion={publicRuntimeConfig?.version}
      cookieBanner={
        <CookieBanner
          strings={strings.cookieBannerStrings}
          googleAnalyticsIds={GOOGLE_ANALYTICS_IDS}
        />
      }
    />
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

  const footerLinks = getFooterItems(
    populateMenuOverlayStrings(dynamicContent),
    categories
  );

  const strings = populateHomePageStrings(dynamicContent);

  // let regions = await fetchRegions(COUNTRY_ID, currentLocale.url);
  // regions.sort((a, b) => a.name.normalize().localeCompare(b.name.normalize()));

  // const serviceCategories = await fetchServicesCategories(
  //   COUNTRY_ID,
  //   currentLocale.url
  // );
  // serviceCategories.sort((a, b) =>
  //   a.name.normalize().localeCompare(b.name.normalize())
  // );

  const directus = new Directus(DIRECUTUS_INSTANCE);
  await directus.auth.static(DIRECTUS_AUTH_TOKEN);

  // const services = await fetchServices(COUNTRY_ID, currentLocale.url);
  const services = await getDirectusArticles(DIRECTUS_COUNTRY_ID, directus);
  services.sort((a, b) => a.name.normalize().localeCompare(b.name.normalize()));

  const serviceTypes = await getDirectusServiceCategories(directus);
  const providers = await getDirectusProviders(directus, DIRECTUS_COUNTRY_ID);
  const populations = await getDirectusPopulationsServed(directus);
  const accessibility = await getDirectusAccessibility(directus);

  return {
    props: {
      currentLocale,
      strings,
      menuOverlayItems,
      headerBannerStrings: populateHeaderBannerStrings(dynamicContent),
      socialMediaLinks: populateSocialMediaLinks(dynamicContent),
      serviceMapProps: {
        // regions,
        // serviceCategories,
        services,
        defaultCoords: MAP_DEFAULT_COORDS,
        shareButton: getShareButtonStrings(dynamicContent),
        serviceTypes,
        providers,
        populations,
        accessibility,
        showDirectus: true,
      },
      categories,
      aboutUsTextHtml,
      footerLinks,
    },
    revalidate: REVALIDATION_TIMEOUT_SECONDS,
  };
};

export default Home;
