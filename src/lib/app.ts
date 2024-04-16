import { api } from "./api";
import { DB } from "./db";
import "./types.data";
import "./types.ai";
import isEqual from "lodash/isEqual";

type Statuses = "initializing" | "ready";

const appPrivateData = {
  status: "initializing" as Statuses,
  servicesLoaded: false,
  boot: false,
};

const defaultBlocks: Block[] = [
  {
    type: "text",
    text: { "en-US": "Welcome" },
  } satisfies BlockText,
] as Block[];

export const app = {
  country: 0,
  logo: null as any,
  locale: "en-US", //current locale
  name: "Country Name",
  defaultLocale: "en-US", //default lang of the country
  db: new DB(),

  state: {
    get status() {
      return appPrivateData.status;
    },
    set status(v: Statuses) {
      if (appPrivateData.status === v) return;
      appPrivateData.status = v;
      app.update();
    },

    info: "Initalizing",

    get servicesLoaded() {
      return appPrivateData.servicesLoaded;
    },
    set servicesLoaded(v) {
      if (appPrivateData.servicesLoaded === v) return;
      appPrivateData.servicesLoaded = v;
      app.update();
    },
  },

  page: {
    color: "#000000",
    bgcolor: "#ffffff",

    header: {
      color: null as string,
      bgcolor: null as string,
    },

    footer: {
      text: { "en-US": "Footer" },
      footerlinks: [],
    } as BlockFooter,

    content: [...defaultBlocks],
  },

  data: {
    categories: {
      providers: {},
      categories: {},
      subCategories: {},
      populations: {},
      accesibility: {},
    } as Categories,

    services: {} as Services,

    zendesk: {
      categories: {} as { [index: number]: ZendeskCategory },
      sections: {} as { [index: number]: ZendeskSection },
      articles: {} as { [index: number]: ZendeskArticle },
    }

  },

    zendesk: {
      categories: {},
      sections: {},
      articles: {},
    } as ZendeskData,
  },

  reactUpdate: null as Function,

  update() {
    console.log("Update App: ", app);
    if (app.reactUpdate) app.reactUpdate();
  },

  async initialize() {
    if (appPrivateData.boot) return;
    appPrivateData.boot = true;

    const storageCountry = localStorage.getItem("country");
    const storageCategories = localStorage.getItem("categories");

    let c: Country = null;
    let cats: Categories = null;

    try {
      c = JSON.parse(storageCountry);
    } catch (error) {}
    try {
      cats = JSON.parse(storageCategories);
    } catch (error) {}

    if (cats) app.data.categories = cats;

    if (c) {
      loadCountry(c);
      app.state.status = "ready";
    }

    setTimeout(async () => {
      let serverCountry: Country = await api.getCountry(app.country);

      if (serverCountry) {
        if (!c) {
          localStorage.setItem("country", JSON.stringify(serverCountry));
          loadCountry(serverCountry);
        } else {
          if (!isEqual(c, serverCountry)) {
            localStorage.setItem("country", JSON.stringify(serverCountry));
            loadCountry(serverCountry);
            console.log("Country Updated.");
          } else {
            console.log("Country Unchanged");
          }
        }

        app.state.status = "ready";

        const sc = await app.db.loadLocalServices()
        await app.db.loadLocalProviders()
        await app.db.loadLocalProviders()

        app.state.servicesLoaded = sc > 0
        app.update()

        await app.db.updateProviders()
        await app.db.updateServices()
        await app.db.updateArticles()

        app.state.servicesLoaded = true
        app.update()

        console.log("Updating Categories...");
        cats = await api.getCategories();

        if (cats) {
          app.data.categories = cats;
          localStorage.setItem("categories", JSON.stringify(cats));
          if (!isEqual(cats, app.data.categories)) {
            app.update();
            console.log("Categories Updated.");
          } else {
            console.log("Categories Unchanged");
          }
        }

        const mockCategories: ZendeskCategory[] = [
          {
            id: 1,
            name: "About",
            description: "",
          },
          {
            id: 2,
            name: "Safety",
            description: "",
          },
          {
            id: 3,
            name: "Civil Document Guidance",
            description: "",
          },
        ];

        const mockSections: ZendeskSection[] = [
          {
            id: 1,
            category_id: 1,
            name: "Welcome to ImportaMí ",
            description: "",
            icon: "help_outline",
          },
          {
            id: 2,
            category_id: 1,
            name: "Kabul ",
            description: "",
            icon: "help_outline",
          },
          {
            id: 3,
            category_id: 2,
            name: "Welcome to ImportaMí ",
            description: "",
            icon: "help_outline",
          },
          {
            id: 4,
            category_id: 3,
            name: "Welcome to ImportaMí ",
            description: "",
            icon: "help_outline",
          },
        ];

        const mockArticles: ZendeskArticle[] = [
          {
            id: 1,
            author_id: 10290055691549,
            draft: false,
            section_id: 1,
            updated_at: "2024-04-03T20:27:44Z",
            title: "Welcome to ImportaMí",
            edited_at: "2024-03-14T20:38:24Z",
            body: '<p><img style="max-width: 80%;" src="https://signpost-us-importami.zendesk.com/hc/article_attachments/17534964540189" alt="Soccer_Group.jpg"></p>\n<p><strong>ImportaMí</strong> provides information that is reliable, accessible, and relevant to unaccompanied children and their sponsors in the United States. We are here to facilitate access to free or low-cost legal services and local resources. Our goal is for you to better understand your rights in the US and live a better life.</p>\n<p> </p>\n<p><strong>Signpost</strong> was launched by <a href="https://www.rescue.org/" target="_blank" rel="noopener noreferrer"><strong>IRC</strong> </a>and <a href="https://www.mercycorps.org/" target="_blank" rel="noopener noreferrer"><strong>Mercy Corps</strong></a> in 2015, and empowers immigrants, refugees and asylum seekers around the world by providing access to relevant content to help make well-informed decisions for themselves and their families.<strong> ImportaMi</strong> is one of the multiple Signpost programs within the Latin American-US region, with an exclusive focus on helping unaccompanied children. Learn more about Signpost and our partners <strong><a href="https://www.signpost.ngo/who-we-are" target="_blank" rel="noopener noreferrer">here</a>.</strong></p>\n<p> </p>\n<p><strong>Questions</strong>? <strong>We can help</strong>! Send us a message via <a href="https://wa.me/19728858251">WhatsApp</a> or<a href="https://m.me/147066420849437"> Facebook Messenger</a> and we will get in touch.</p>\n<p> </p>\n<p>To see an overview of our services, click on the PDF link below.</p>\n<p><a href="https://rescue.box.com/s/0m96phvwa802gttqrdteix70bpepgsy8">ImportaMi (English)</a></p>\n<p> </p>',
          },
          {
            id: 2,
            author_id: 10290055691549,
            draft: false,
            section_id: 1,
            updated_at: "2024-04-03T20:27:44Z",
            title: "Steps to obtain a passport in Kabul Province",
            edited_at: "2024-03-14T20:38:24Z",
            body: '<p><img style="max-width: 80%;" src="https://signpost-us-importami.zendesk.com/hc/article_attachments/17534964540189" alt="Soccer_Group.jpg"></p>\n<p><strong>ImportaMí</strong> provides information that is reliable, accessible, and relevant to unaccompanied children and their sponsors in the United States. We are here to facilitate access to free or low-cost legal services and local resources. Our goal is for you to better understand your rights in the US and live a better life.</p>\n<p> </p>\n<p><strong>Signpost</strong> was launched by <a href="https://www.rescue.org/" target="_blank" rel="noopener noreferrer"><strong>IRC</strong> </a>and <a href="https://www.mercycorps.org/" target="_blank" rel="noopener noreferrer"><strong>Mercy Corps</strong></a> in 2015, and empowers immigrants, refugees and asylum seekers around the world by providing access to relevant content to help make well-informed decisions for themselves and their families.<strong> ImportaMi</strong> is one of the multiple Signpost programs within the Latin American-US region, with an exclusive focus on helping unaccompanied children. Learn more about Signpost and our partners <strong><a href="https://www.signpost.ngo/who-we-are" target="_blank" rel="noopener noreferrer">here</a>.</strong></p>\n<p> </p>\n<p><strong>Questions</strong>? <strong>We can help</strong>! Send us a message via <a href="https://wa.me/19728858251">WhatsApp</a> or<a href="https://m.me/147066420849437"> Facebook Messenger</a> and we will get in touch.</p>\n<p> </p>\n<p>To see an overview of our services, click on the PDF link below.</p>\n<p><a href="https://rescue.box.com/s/0m96phvwa802gttqrdteix70bpepgsy8">ImportaMi (English)</a></p>\n<p> </p>',
          },
          {
            id: 3,
            author_id: 10290055691549,
            draft: false,
            section_id: 2,
            updated_at: "2024-04-03T20:27:44Z",
            title: "Welcome to ImportaMí 3",
            edited_at: "2024-03-14T20:38:24Z",
            body: '<p><img style="max-width: 80%;" src="https://signpost-us-importami.zendesk.com/hc/article_attachments/17534964540189" alt="Soccer_Group.jpg"></p>\n<p><strong>ImportaMí</strong> provides information that is reliable, accessible, and relevant to unaccompanied children and their sponsors in the United States. We are here to facilitate access to free or low-cost legal services and local resources. Our goal is for you to better understand your rights in the US and live a better life.</p>\n<p> </p>\n<p><strong>Signpost</strong> was launched by <a href="https://www.rescue.org/" target="_blank" rel="noopener noreferrer"><strong>IRC</strong> </a>and <a href="https://www.mercycorps.org/" target="_blank" rel="noopener noreferrer"><strong>Mercy Corps</strong></a> in 2015, and empowers immigrants, refugees and asylum seekers around the world by providing access to relevant content to help make well-informed decisions for themselves and their families.<strong> ImportaMi</strong> is one of the multiple Signpost programs within the Latin American-US region, with an exclusive focus on helping unaccompanied children. Learn more about Signpost and our partners <strong><a href="https://www.signpost.ngo/who-we-are" target="_blank" rel="noopener noreferrer">here</a>.</strong></p>\n<p> </p>\n<p><strong>Questions</strong>? <strong>We can help</strong>! Send us a message via <a href="https://wa.me/19728858251">WhatsApp</a> or<a href="https://m.me/147066420849437"> Facebook Messenger</a> and we will get in touch.</p>\n<p> </p>\n<p>To see an overview of our services, click on the PDF link below.</p>\n<p><a href="https://rescue.box.com/s/0m96phvwa802gttqrdteix70bpepgsy8">ImportaMi (English)</a></p>\n<p> </p>',
          },
          {
            id: 4,
            author_id: 2,
            draft: false,
            section_id: 17534956935837,
            updated_at: "2024-04-03T20:27:44Z",
            title: "Welcome to ImportaMí 4",
            edited_at: "2024-03-14T20:38:24Z",
            body: '<p><img style="max-width: 80%;" src="https://signpost-us-importami.zendesk.com/hc/article_attachments/17534964540189" alt="Soccer_Group.jpg"></p>\n<p><strong>ImportaMí</strong> provides information that is reliable, accessible, and relevant to unaccompanied children and their sponsors in the United States. We are here to facilitate access to free or low-cost legal services and local resources. Our goal is for you to better understand your rights in the US and live a better life.</p>\n<p> </p>\n<p><strong>Signpost</strong> was launched by <a href="https://www.rescue.org/" target="_blank" rel="noopener noreferrer"><strong>IRC</strong> </a>and <a href="https://www.mercycorps.org/" target="_blank" rel="noopener noreferrer"><strong>Mercy Corps</strong></a> in 2015, and empowers immigrants, refugees and asylum seekers around the world by providing access to relevant content to help make well-informed decisions for themselves and their families.<strong> ImportaMi</strong> is one of the multiple Signpost programs within the Latin American-US region, with an exclusive focus on helping unaccompanied children. Learn more about Signpost and our partners <strong><a href="https://www.signpost.ngo/who-we-are" target="_blank" rel="noopener noreferrer">here</a>.</strong></p>\n<p> </p>\n<p><strong>Questions</strong>? <strong>We can help</strong>! Send us a message via <a href="https://wa.me/19728858251">WhatsApp</a> or<a href="https://m.me/147066420849437"> Facebook Messenger</a> and we will get in touch.</p>\n<p> </p>\n<p>To see an overview of our services, click on the PDF link below.</p>\n<p><a href="https://rescue.box.com/s/0m96phvwa802gttqrdteix70bpepgsy8">ImportaMi (English)</a></p>\n<p> </p>',
          },
          {
            id: 5,
            author_id: 10290055691549,
            draft: false,
            section_id: 3,
            updated_at: "2024-04-03T20:27:44Z",
            title: "Welcome to ImportaMí 5",
            edited_at: "2024-03-14T20:38:24Z",
            body: '<p><img style="max-width: 80%;" src="https://signpost-us-importami.zendesk.com/hc/article_attachments/17534964540189" alt="Soccer_Group.jpg"></p>\n<p><strong>ImportaMí</strong> provides information that is reliable, accessible, and relevant to unaccompanied children and their sponsors in the United States. We are here to facilitate access to free or low-cost legal services and local resources. Our goal is for you to better understand your rights in the US and live a better life.</p>\n<p> </p>\n<p><strong>Signpost</strong> was launched by <a href="https://www.rescue.org/" target="_blank" rel="noopener noreferrer"><strong>IRC</strong> </a>and <a href="https://www.mercycorps.org/" target="_blank" rel="noopener noreferrer"><strong>Mercy Corps</strong></a> in 2015, and empowers immigrants, refugees and asylum seekers around the world by providing access to relevant content to help make well-informed decisions for themselves and their families.<strong> ImportaMi</strong> is one of the multiple Signpost programs within the Latin American-US region, with an exclusive focus on helping unaccompanied children. Learn more about Signpost and our partners <strong><a href="https://www.signpost.ngo/who-we-are" target="_blank" rel="noopener noreferrer">here</a>.</strong></p>\n<p> </p>\n<p><strong>Questions</strong>? <strong>We can help</strong>! Send us a message via <a href="https://wa.me/19728858251">WhatsApp</a> or<a href="https://m.me/147066420849437"> Facebook Messenger</a> and we will get in touch.</p>\n<p> </p>\n<p>To see an overview of our services, click on the PDF link below.</p>\n<p><a href="https://rescue.box.com/s/0m96phvwa802gttqrdteix70bpepgsy8">ImportaMi (English)</a></p>\n<p> </p>',
          },
          {
            id: 6,
            author_id: 10290055691549,
            draft: false,
            section_id: 4,
            updated_at: "2024-04-03T20:27:44Z",
            title: "Welcome to ImportaMí",
            edited_at: "2024-03-14T20:38:24Z",
            body: '<p><img style="max-width: 80%;" src="https://signpost-us-importami.zendesk.com/hc/article_attachments/17534964540189" alt="Soccer_Group.jpg"></p>\n<p><strong>ImportaMí</strong> provides information that is reliable, accessible, and relevant to unaccompanied children and their sponsors in the United States. We are here to facilitate access to free or low-cost legal services and local resources. Our goal is for you to better understand your rights in the US and live a better life.</p>\n<p> </p>\n<p><strong>Signpost</strong> was launched by <a href="https://www.rescue.org/" target="_blank" rel="noopener noreferrer"><strong>IRC</strong> </a>and <a href="https://www.mercycorps.org/" target="_blank" rel="noopener noreferrer"><strong>Mercy Corps</strong></a> in 2015, and empowers immigrants, refugees and asylum seekers around the world by providing access to relevant content to help make well-informed decisions for themselves and their families.<strong> ImportaMi</strong> is one of the multiple Signpost programs within the Latin American-US region, with an exclusive focus on helping unaccompanied children. Learn more about Signpost and our partners <strong><a href="https://www.signpost.ngo/who-we-are" target="_blank" rel="noopener noreferrer">here</a>.</strong></p>\n<p> </p>\n<p><strong>Questions</strong>? <strong>We can help</strong>! Send us a message via <a href="https://wa.me/19728858251">WhatsApp</a> or<a href="https://m.me/147066420849437"> Facebook Messenger</a> and we will get in touch.</p>\n<p> </p>\n<p>To see an overview of our services, click on the PDF link below.</p>\n<p><a href="https://rescue.box.com/s/0m96phvwa802gttqrdteix70bpepgsy8">ImportaMi (English)</a></p>\n<p> </p>',
          },
        ];

        for (let category of mockCategories) {
          app.data.zendesk.categories[category.id] = category;
        }
        for (let section of mockSections) {
          app.data.zendesk.sections[section.id] = section;
        }

        for (let article of mockArticles) {
          app.data.zendesk.articles[article.id] = article;
        }

        localStorage.setItem("zendesk", JSON.stringify(app.data.zendesk));

        console.log("Initialized");
      }
    }, 1);
  },

  async getService(id: number) {},
};

function loadCountry(c: Country) {
  if (!c) return;
  app.country = c.id;
  app.name = c.name;
  app.locale ||= c.locale;
  app.page.content = c.content || [];
  app.defaultLocale = c.locale;

  app.page.color = c.pagecolor || "#000000";
  app.page.bgcolor = c.pagebgcolor || "#ffffff";

  app.page.header.color = c.headercolor || c.pagecolor;
  app.page.header.bgcolor = c.headerbgcolor || c.pagebgcolor;

  const footer = c.content.find((b) => b.type === "footer");
  if (footer) app.page.footer = footer as BlockFooter;
}

export function translate(t: LocalizableContent): string {
  if (!t) return "";
  if (typeof t === "string") return t;
  if (typeof t === "object") return t[app.locale] || t["en-US"] || "";
  return "";
}

export async function sleep(ms = 1000) {
  return new Promise((a) => setTimeout(a, ms));
}
