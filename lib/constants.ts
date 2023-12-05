import { AlgoliaSearchIndex } from '@ircsignpost/signpost-base/dist/src/search-common';
import { LatLngExpression } from 'leaflet';

export const SITE_TITLE = 'Refugee.info Greece';

export const COUNTRY_ID = 9;

export const MAP_DEFAULT_COORDS: LatLngExpression = [39.4589841, 23.4877237];

// Cache statically generated pages for 1 hour. The timeout was chosen
// arbitrarily. Our website has static, non-urgent resources, so we probably do
// not need to serve content faster.
export const REVALIDATION_TIMEOUT_SECONDS: number = 1 * 60 * 60;

// The "about us" article ID.
export const ABOUT_US_ARTICLE_ID: number = 4985544145943;

// The information hierary of the website.
// Set to true for the category -> section -> article hierarchy, similar to that of United for Ukraine.
// Set to false for the "information" -> category -> article hierarchy, similar to that of Beporsed.
//
// TODO
export const USE_CAT_SEC_ART_CONTENT_STRUCTURE = true;

// A mapping from category ID to a Material icon for that category.
export const CATEGORY_ICON_NAMES: { [key: string]: string } = {
  '4768127626007': 'description',
  '4768111818263': 'campaign',
  '4768127623703': 'question_mark',
  '4420351005975': 'explore',
};

// A mapping from section ID to a Material icon for that section.
export const SECTION_ICON_NAMES: { [key: string]: string } = {
  // articles section
  '4768116680855': 'content_paste',
  '4768201127959': 'favorite',
  '4768236201879': 'apartment',
  '4768229873431': 'flight_land',
  '4768215377431': 'favorite',
  '4768236226967': 'medical_services',
  '4768116667543': 'description',
  '4768116668311': 'school',
  '4768229899031': 'description',
  '4768222212887': 'payments',
  '4768201101719': 'hail',
  '4768236260759': 'female',
  '4768201105175': 'medical_services',
  '4768236267159': 'business_center',
  '4768222253335': 'directions_car',
  '4768222261655': 'flight',
  '6155198126365': '',
  // latest announcements section
  '4768116683927': '',
  // about section
  '4768236194583': '',
  '4768222161687': '',
  '4768116665751': '',
};

// A list of category IDs that the site should not display.
export const CATEGORIES_TO_HIDE: number[] = [
  5388415886487, 5451758139293, 5388415940887, 4421271418775, 4420351027479,
  4420351005975, 4768127623703, 4768111818263,
];

export const MENU_CATEGORIES_TO_HIDE: number[] = [
  5388415886487, 5451758139293, 5388415940887, 4421271418775, 4420351027479,
];

// A map from a locale code to Zendesk locale id used for dynamic content translations.
// https://developer.zendesk.com/api-reference/ticketing/account-configuration/locales/
// Keep in sync with locales configured in /next.config.js.
export const DYNAMIC_CONTENT_LOCALES: { [key: string]: number } = {
  'en-us': 1, // English locale id
  ar: 66,
  fa: 1016,
  fr: 16,
  uk: 1173,
  ur: 1183,
  so: 1403,
};

export const ZENDESK_AUTH_HEADER = {
  Authorization: 'Bearer ' + process.env.ZENDESK_OAUTH_TOKEN,
};

export const GOOGLE_ANALYTICS_IDS = [
  process.env.NEXT_PUBLIC_GA_ID ?? '',
  process.env.NEXT_PUBLIC_GA4_ID ?? '',
];

// Algolia search app ID, Search API key and search index name:
// https://www.algolia.com/account/api-keys/
export const ALGOLIA_SEARCH_APP_ID = 'BWATZIXLX6';
export const ALGOLIA_SEARCH_API_KEY = '0d9093280e7b2bc2b6ca12ed4180fd0a';
export const ALGOLIA_SEARCH_API_KEY_WRITE =
  process.env.ALGOLIA_SEARCH_API_KEY_WRITE ?? '';

// TODO: create Algolia indexes for Articles and Queries and replace the names here.
// See README for more info on how to create indexes.
export const ALGOLIA_ARTICLE_INDEX_NAME = 'zendesk_signpost-test_articles';
export const ALGOLIA_QUERY_INDEX_NAME =
  'zendesk_signpost-test_articles_query_suggestions';

export const SEARCH_BAR_INDEX: AlgoliaSearchIndex = {
  appId: ALGOLIA_SEARCH_APP_ID,
  publicApiKey: ALGOLIA_SEARCH_API_KEY,
  indexName: ALGOLIA_QUERY_INDEX_NAME,
};

export const SEARCH_RESULTS_PAGE_INDEX: AlgoliaSearchIndex = {
  appId: ALGOLIA_SEARCH_APP_ID,
  publicApiKey: ALGOLIA_SEARCH_API_KEY,
  indexName: ALGOLIA_ARTICLE_INDEX_NAME,
};

export const DIRECTUS_AUTH_TOKEN = process.env.DIRECTUS_TOKEN ?? '';
export const DIRECTUS_COUNTRY_ID = 2;
export const DIRECTUS_INSTANCE = 'https://directus-irc.azurewebsites.net/';
