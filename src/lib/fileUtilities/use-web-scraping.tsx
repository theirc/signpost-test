/**
 * useWebScraping Hook
 * 
 * A simplified hook that provides basic web scraping functionality.
 * Just fetches content from a single URL without additional processing.
 * 
 * @returns {Object} An object containing:
 *   - performWebScrape: Function to scrape content from a URL
 *   - htmlToPlainText: Function to convert HTML to plain text
 */
import { useState } from 'react'
import { webScraper } from '@/api/webScraper'

// Convert HTML to plain text
export const htmlToPlainText = (html: string): string => {
  if (!html) return '';
  
  try {
    // Create temp element to extract text
    const temp = document.createElement('div');
    temp.innerHTML = html;
    
    // Remove scripts, styles, etc.
    const elementsToRemove = ['script', 'style', 'iframe', 'noscript'];
    elementsToRemove.forEach(tag => {
      const elements = temp.getElementsByTagName(tag);
      for (let i = elements.length - 1; i >= 0; i--) {
        elements[i].parentNode?.removeChild(elements[i]);
      }
    });
    
    // Get text content
    let text = temp.textContent || temp.innerText || '';
    
    // Clean up whitespace
    text = text.replace(/\s+/g, ' ').trim();
    
    return text;
  } catch (error) {
    console.error('Error converting HTML to plain text:', error);
    return html; // Fallback to returning the raw HTML
  }
};

// Add meta information to the top of content to improve RAG retrieval context
export const addSourceMetadata = (url: string, content: string, title?: string): string => {
  const timestamp = new Date().toISOString();
  const metaHeader = `
SOURCE INFORMATION
Title: ${title || 'Web Content'}
URL: ${url}
Scraped On: ${timestamp}
Source Type: Web Scrape

CONTENT SUMMARY
The following content was scraped from the URL above. This information can be used to provide context for questions related to this content.

---

`;
  
  return metaHeader + content;
};

// Web scraping function using our API
export const performWebScrape = async (url: string): Promise<string> => {
  try {
    console.log(`Scraping URL: ${url}`);
    
    // Use our web scraper API
    const result = await webScraper.fetchUrl(url);
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch content');
    }
    
    // Extract title if available in the response
    const title = extractTitleFromHTML(result.content);
    
    // Convert HTML to plain text
    const plainText = htmlToPlainText(result.content);
    
    // Add metadata to the top of the content
    const enhancedContent = addSourceMetadata(url, plainText, title);
    
    return enhancedContent;
  } catch (error) {
    console.error(`Error scraping ${url}:`, error);
    throw error; // Re-throw to let caller handle it
  }
};

// Helper function to extract title from HTML
const extractTitleFromHTML = (html: string): string => {
  try {
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    return titleMatch ? titleMatch[1].trim() : 'Untitled Page';
  } catch (error) {
    console.error('Error extracting title from HTML:', error);
    return 'Untitled Page';
  }
};

export function useWebScraping() {
  const [isLoading, setIsLoading] = useState(false);
  
  const scrapeUrl = async (url: string): Promise<string> => {
    setIsLoading(true);
    try {
      const content = await performWebScrape(url);
      return content;
    } catch (error) {
      console.error('Error in scrapeUrl:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  return {
    isLoading,
    performWebScrape: scrapeUrl,
    htmlToPlainText,
    addSourceMetadata
  };
} 