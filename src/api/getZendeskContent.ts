export interface ZendeskArticle {
  id?: number;
  title?: string;
  body?: string;
  draft?: boolean;
  locale?: string;
  html_url?: string;
  updated_at?: string;
}

// Helper function to strip HTML and clean up text
function stripHtml(html: string): string {
  // Keep links but remove other HTML tags
  return html
    .replace(/<a\s+(?:[^>]*?)href="([^"]*)"(?:[^>]*?)>([^<]*)<\/a>/gi, '$2 ($1)')  // Convert links to text with URL
    .replace(/<[^>]+>/g, '')  // Remove all other HTML tags
    .replace(/\s+/g, ' ')  // Clean up whitespace
    .trim();
}

export const zendeskApi = {
  // Get all articles from a specific subdomain
  getArticles: async (subdomain: string, email: string, apiToken: string, locale: string = 'en-us', limit: number = 200): Promise<ZendeskArticle[]> => {
    const headers = getAuthHeaders(email, apiToken);
    try {
      console.log(`Getting articles for domain ${subdomain}...`);
      console.log('Using headers:', { ...headers, Authorization: '[REDACTED]' });
      
      const url = `https://${subdomain}.zendesk.com/api/v2/help_center/${locale}/articles.json?per_page=${limit}`;
      console.log('Fetching from URL:', url);
      
      const articles = await getArticlesWithPagination(url, headers, limit);
      console.log('Raw articles response:', articles);
      
      // Clean up the articles by stripping HTML
      const cleanedArticles = articles.map(article => ({
        ...article,
        body: article.body ? stripHtml(article.body) : undefined
      }));
      
      const filteredArticles = cleanedArticles.filter(article => !article.draft && article.body);
      console.log(`${subdomain}: Found ${articles.length} total articles, ${filteredArticles.length} after filtering`);
      console.log('First article sample:', filteredArticles[0]);
      
      return filteredArticles;
    } catch (error) {
      console.error(`Error fetching articles from ${subdomain}:`, error);
      return [];
    }
  },

  // Get articles from a specific domain
  getArticlesFromDomain: async (domain: string, email: string, apiToken: string, limit: number = 200): Promise<ZendeskArticle[]> => {
    try {
      console.log(`Fetching articles from domain: ${domain}`);
      const articles = await zendeskApi.getArticles(domain, email, apiToken, 'en-us', limit);
      console.log(`Total articles collected: ${articles.length}`);
      return articles;
    } catch (error) {
      console.error(`Error fetching articles from domain ${domain}:`, error);
      return [];
    }
  }
};

// Helper function to get authentication headers
function getAuthHeaders(email: string, apiToken: string) {
  return {
    Authorization: "Basic " + btoa(`${email}/token:${apiToken}`),
    "Content-Type": "application/json"
  };
}

// Helper function to handle paginated article requests
async function getArticlesWithPagination(url: string, headers: any, limit?: number): Promise<ZendeskArticle[]> {
  let articles: ZendeskArticle[] = [];
  let nextPageUrl = url;
  let pageCount = 0;

  while (nextPageUrl) {
    try {
      console.log(`Fetching page ${pageCount + 1}...`);
      const response = await fetch(nextPageUrl, { headers });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response not OK:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        throw new Error(`Failed to fetch articles: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log(`Page ${pageCount + 1} data:`, {
        count: data.articles?.length || 0,
        nextPage: !!data.next_page,
        page: pageCount + 1
      });
      
      if (data.articles) {
        articles = [...articles, ...data.articles];
      }
      
      nextPageUrl = data.next_page;
      pageCount++;
      
      // Only stop pagination if we've exceeded the limit by a significant margin
      // This ensures we get complete data even with filtering
      if (limit && articles.length >= limit) {
        console.log(`Collected enough articles (${articles.length}), stopping pagination`);
        break;
      }
    } catch (error) {
      console.error("Error in pagination request:", error);
      break;
    }
  }
  
  console.log('Pagination complete:', {
    totalPages: pageCount,
    totalArticles: articles.length
  });
  
  // Apply the limit only after we have all articles
  return limit ? articles.slice(0, limit) : articles;
}

export default zendeskApi;
