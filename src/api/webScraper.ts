/**
 * Web Scraper API
 * 
 * Simple API to fetch content from URLs with proper CORS handling
 */

interface ScraperResponse {
  content: string;
  error?: string;
  success: boolean;
}

/**
 * Server-side fetching to avoid CORS issues
 */
export const webScraper = {
  fetchUrl: async (url: string): Promise<ScraperResponse> => {
    try {
      console.log(`Web scraper fetching URL: ${url}`);
      
      // Special case for Wikipedia
      if (url.includes('wikipedia.org')) {
        return await webScraper.fetchWikipedia(url);
      }
      
      // Try multiple CORS proxies in case one fails
      const proxyOptions = [
        `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
        `https://cors-anywhere.herokuapp.com/${url}`,
        `https://corsproxy.io/?${encodeURIComponent(url)}`
      ];
      
      let content = '';
      let lastError = null;
      
      // Try each proxy in order until one works
      for (const proxyUrl of proxyOptions) {
        try {
          console.log(`Trying proxy: ${proxyUrl}`);
          
          // Fetch with timeout 
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
          
          const response = await fetch(proxyUrl, { 
            signal: controller.signal,
          });
          clearTimeout(timeoutId);
          
          if (!response.ok) {
            throw new Error(`Failed with status: ${response.status} ${response.statusText}`);
          }
          
          content = await response.text();
          
          // If we get here, we successfully got content
          console.log(`Successfully fetched content via ${proxyUrl}`);
          return {
            content,
            success: true
          };
        } catch (err) {
          console.error(`Error with proxy ${proxyUrl}:`, err);
          lastError = err;
          // Continue to next proxy
        }
      }
      
      // If we get here, all proxies failed
      throw lastError || new Error('All proxies failed');
      
    } catch (error) {
      console.error(`Error scraping ${url}:`, error);
      return {
        content: '',
        error: error instanceof Error ? error.message : 'Unknown error fetching URL',
        success: false
      };
    }
  },
  
  // Special handler for Wikipedia pages
  fetchWikipedia: async (url: string): Promise<ScraperResponse> => {
    try {
      console.log('Using Wikipedia API approach for:', url);
      
      // Extract the page title from the URL
      const titleMatch = url.match(/\/wiki\/([^#?]+)/);
      if (!titleMatch) {
        throw new Error('Could not extract Wikipedia page title from URL');
      }
      
      const pageTitle = decodeURIComponent(titleMatch[1]);
      console.log('Extracted Wikipedia page title:', pageTitle);
      
      // Determine which Wikipedia domain to use
      let domain = 'en.wikipedia.org';
      if (url.includes('.wikipedia.org')) {
        const domainMatch = url.match(/\/\/([^\/]+)\.wikipedia\.org/);
        if (domainMatch) {
          domain = `${domainMatch[1]}.wikipedia.org`;
        }
      }
      
      // Use Wikipedia's API to get the content
      const apiUrl = `https://${domain}/w/api.php?action=query&format=json&prop=extracts&exintro=1&explaintext=1&titles=${encodeURIComponent(pageTitle)}&origin=*`;
      console.log('Using Wikipedia API URL:', apiUrl);
      
      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error(`Wikipedia API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Extract the page content from the response
      const pages = data.query?.pages;
      if (!pages) {
        throw new Error('Wikipedia API returned no pages');
      }
      
      // Get the first page (there should only be one)
      const pageId = Object.keys(pages)[0];
      const page = pages[pageId];
      
      if (pageId === '-1' || !page) {
        throw new Error('Wikipedia page not found');
      }
      
      // Get the first section or full content
      const content = page.extract || '';
      
      if (!content) {
        throw new Error('No content found in Wikipedia response');
      }
      
      console.log('Successfully fetched Wikipedia content');
      
      // Also try to get a fuller extract for the entire article
      try {
        const fullApiUrl = `https://${domain}/w/api.php?action=query&format=json&prop=extracts&explaintext=1&titles=${encodeURIComponent(pageTitle)}&origin=*`;
        const fullResponse = await fetch(fullApiUrl);
        if (fullResponse.ok) {
          const fullData = await fullResponse.json();
          const fullPages = fullData.query?.pages;
          const fullPage = fullPages[pageId];
          
          if (fullPage && fullPage.extract && fullPage.extract.length > content.length) {
            console.log('Successfully fetched full Wikipedia content');
            return {
              content: fullPage.extract,
              success: true
            };
          }
        }
      } catch (fullError) {
        console.error('Error fetching full Wikipedia content:', fullError);
        // Continue with the intro content
      }
      
      return {
        content,
        success: true
      };
      
    } catch (error) {
      console.error('Error in Wikipedia handler:', error);
      return {
        content: '',
        error: error instanceof Error ? error.message : 'Error fetching Wikipedia content',
        success: false
      };
    }
  }
};

export default webScraper; 