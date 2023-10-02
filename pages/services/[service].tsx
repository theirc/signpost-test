// import {PartialDirectusArticle} from '@ircsignpost/signpost-base/dist/src/service-content'
import { Directus } from '@directus/sdk';
import { extractMetaTags } from '@ircsignpost/signpost-base/dist/src/article-content';
import { getErrorResponseProps } from '@ircsignpost/signpost-base/dist/src/article-page';
import CookieBanner from '@ircsignpost/signpost-base/dist/src/cookie-banner';
import {
  DirectusArticle,
  getDirectusArticle,
  getDirectusArticles,
} from '@ircsignpost/signpost-base/dist/src/directus';
import { ErrorProps } from '@ircsignpost/signpost-base/dist/src/error';
import Footer from '@ircsignpost/signpost-base/dist/src/footer';
import LayoutWithMenu, {
  LayoutWithMenuProps,
} from '@ircsignpost/signpost-base/dist/src/layout-with-menu';
import { MenuOverlayItem } from '@ircsignpost/signpost-base/dist/src/menu-overlay';
import { createDefaultSearchBarProps } from '@ircsignpost/signpost-base/dist/src/search-bar';
import {
  ServicePageProps,
  ServicePageStrings,
} from '@ircsignpost/signpost-base/dist/src/service-page';
import ServicePage, {
  MountService,
} from '@ircsignpost/signpost-base/dist/src/service-page';
import {
  CategoryWithSections,
  ZendeskCategory,
  getArticle,
  getCategories,
  getCategoriesWithSections,
  getTranslationsFromDynamicContent,
} from '@ircsignpost/signpost-base/dist/src/zendesk';
import { GetStaticProps } from 'next';
import getConfig from 'next/config';
import { useRouter } from 'next/router';
import React from 'react';

import {
  ABOUT_US_ARTICLE_ID,
  CATEGORIES_TO_HIDE,
  CATEGORY_ICON_NAMES,
  DIRECTUS_AUTH_TOKEN,
  DIRECTUS_COUNTRY_ID,
  DIRECUTUS_INSTANCE,
  GOOGLE_ANALYTICS_IDS,
  REVALIDATION_TIMEOUT_SECONDS,
  SEARCH_BAR_INDEX,
  SECTION_ICON_NAMES,
  SITE_TITLE,
  USE_CAT_SEC_ART_CONTENT_STRUCTURE,
  ZENDESK_AUTH_HEADER,
} from '../../lib/constants';
import {
  LOCALES,
  LOCALE_CODES_TO_CANONICAL_LOCALE_CODES,
  Locale,
  getLocaleFromCode,
  getZendeskLocaleId,
} from '../../lib/locale';
import { getHeaderLogoProps } from '../../lib/logo';
import { getFooterItems, getMenuItems } from '../../lib/menu';
import {
  COMMON_DYNAMIC_CONTENT_PLACEHOLDERS,
  ERROR_DYNAMIC_CONTENT_PLACEHOLDERS,
  generateArticleErrorProps,
  populateMenuOverlayStrings,
  populateServicePageStrings,
} from '../../lib/translations';
import { getSiteUrl, getZendeskMappedUrl, getZendeskUrl } from '../../lib/url';

interface ServiceProps {
  pageTitle: string;
  serviceId: number;
  pageUnderConstruction?: boolean;
  siteUrl: string;
  preview: boolean;
  metaTagAttributes: object[];
  lastEditedValue: string;
  locale: Locale;
  strings: ServicePageStrings;
  menuOverlayItems: MenuOverlayItem[];
  footerLinks?: MenuOverlayItem[];
  service: DirectusArticle;
}

export default function Service({
  pageTitle,
  serviceId,
  pageUnderConstruction,
  siteUrl,
  preview,
  metaTagAttributes,
  lastEditedValue,
  locale,
  strings,
  menuOverlayItems,
  footerLinks,
  service,
}: ServiceProps) {
  const router = useRouter();
  const { publicRuntimeConfig } = getConfig();

  return (
    <ServicePage
      pageTitle={pageTitle}
      serviceId={serviceId}
      canonicalLocales={LOCALE_CODES_TO_CANONICAL_LOCALE_CODES}
      pageUnderConstruction={pageUnderConstruction}
      siteUrl={siteUrl}
      preview={preview}
      errorProps={strings.serviceErrorStrings}
      metaTagAttributes={metaTagAttributes}
      layoutWithMenuProps={{
        headerProps: {
          currentLocale: locale,
          locales: LOCALES,
          logoProps: getHeaderLogoProps(locale),
          searchBarProps: createDefaultSearchBarProps(
            strings.searchBarStrings,
            SEARCH_BAR_INDEX,
            locale,
            router
          ),
        },
        menuOverlayItems: menuOverlayItems,
        cookieBanner: (
          <CookieBanner
            strings={strings.cookieBannerStrings}
            googleAnalyticsIds={GOOGLE_ANALYTICS_IDS}
          />
        ),
        footerComponent: (
          <Footer
            currentLocale={locale}
            locales={LOCALES}
            strings={strings.footerStrings}
            links={footerLinks}
            signpostVersion={publicRuntimeConfig?.version}
          />
        ),
        layoutDirection: locale.direction,
        children: [],
      }}
    >
      <MountService
        serviceProps={{
          service,
          lastEdit: {
            label: strings.lastUpdatedLabel,
            value: lastEditedValue,
            locale: locale,
          },
          disableShareButton: true,
          strings: strings.serviceContentStrings,
        }}
      />
    </ServicePage>
  );
}

async function getStaticParams() {
  const directus = new Directus(DIRECUTUS_INSTANCE);
  await directus.auth.static(DIRECTUS_AUTH_TOKEN);
  const services = await getDirectusArticles(DIRECTUS_COUNTRY_ID, directus);
  const allowedLanguageCodes = Object.values(LOCALES).map(
    (locale) => locale.directus
  );

  const servicesFiltered = services.filter((service) => {
    const translation = service.translations.find((translation) =>
      allowedLanguageCodes.includes(translation.languages_id.code)
    );
    return translation;
  });

  return servicesFiltered.flatMap((service) =>
    service.translations.map((translation) => {
      const locale = Object.values(LOCALES).find(
        (x) => x.directus === translation.languages_id.code
      );

      return {
        service: service.id.toString(),
        locale: locale?.url,
      };
    })
  );
}

export async function getStaticPaths() {
  const articleParams = await getStaticParams();

  return {
    paths: articleParams.map(({ service, locale }) => {
      return {
        params: { service },
        locale,
      };
    }),
    fallback: 'blocking',
  };
}

function getStringPath(service: string, locale: string = 'en-us'): string {
  return `/${locale}/services/${service}`;
}

export async function getStringPaths(): Promise<string[]> {
  const params = await getStaticParams();
  return params.map((param) => getStringPath(param.service, param.locale));
}

export const getStaticProps: GetStaticProps = async ({
  params,
  locale,
  preview,
}) => {
  const currentLocale = getLocaleFromCode(locale ?? '');
  let dynamicContent = await getTranslationsFromDynamicContent(
    getZendeskLocaleId(currentLocale),
    [
      ...COMMON_DYNAMIC_CONTENT_PLACEHOLDERS,
      ...ERROR_DYNAMIC_CONTENT_PLACEHOLDERS,
    ],
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
  const menuOverlayItems = getMenuItems(
    populateMenuOverlayStrings(dynamicContent),
    categories,
    !!aboutUsArticle
  );

  const strings = populateServicePageStrings(dynamicContent);

  const footerLinks = getFooterItems(
    populateMenuOverlayStrings(dynamicContent),
    categories
  );

  const directus = new Directus(DIRECUTUS_INSTANCE);
  await directus.auth.static(DIRECTUS_AUTH_TOKEN);

  const article = await getDirectusArticle(Number(params?.service), directus);

  const articleTranslated = article.translations.filter(
    (x) => x.languages_id.code === currentLocale.directus
  );

  // If article does not exist, return an error.
  if (!articleTranslated.length) {
    const errorProps = await getErrorResponseProps(
      Number(params?.article),
      currentLocale,
      preview ?? false,
      LOCALES,
      {
        url: getZendeskUrl(),
        mappedUrl: getZendeskMappedUrl(),
        authHeader: ZENDESK_AUTH_HEADER,
      }
    );

    const subtitle = generateArticleErrorProps(dynamicContent).subtitle ?? '';
    return errorProps.notFound
      ? // When the error is notFound, router automatically redirects
        // to 404 page which has its own logic for fetching props.
        errorProps
      : // For other error types we have custom error handling logic inside
        // ArticlePage component, so we pass ArticlePage's and error props.
        {
          props: {
            ...errorProps,
            pageTitle: `${subtitle} - ${SITE_TITLE}`,
            strings,
            menuOverlayItems,
            siteUrl: getSiteUrl(),
            articleId: Number(params?.article),
            locale: currentLocale,
            preview: preview ?? false,
            metaTagAttributes: [],
          },
        };
  }

  const [metaTagAttributes, content] = articleTranslated[0].description
    ? extractMetaTags(articleTranslated[0].description)
    : [[], articleTranslated[0].description];

  return {
    props: {
      pageTitle: `${articleTranslated[0].name} - ${SITE_TITLE}`,
      serviceId: article.id,
      siteUrl: getSiteUrl(),
      preview: preview ?? false,
      metaTagAttributes,
      lastEditedValue: article.date_updated,
      locale: currentLocale,
      strings,
      menuOverlayItems,
      footerLinks,
      service: article,
    },
    revalidate: REVALIDATION_TIMEOUT_SECONDS,
  };
};
