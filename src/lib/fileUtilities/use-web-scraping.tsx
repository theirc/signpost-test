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

// Web scraping function using our API
export const performWebScrape = async (url: string): Promise<string> => {
  try {
    console.log(`Scraping URL: ${url}`);
    
    // Use our web scraper API
    const result = await webScraper.fetchUrl(url);
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch content');
    }
    
    return result.content;
  } catch (error) {
    console.error(`Error scraping ${url}:`, error);
    throw error; // Re-throw to let caller handle it
  }
};

export function useWebScraping() {
  const [isLoading, setIsLoading] = useState(false);
  
  const scrapeUrl = async (url: string): Promise<string> => {
    setIsLoading(true);
    try {
      const html = await performWebScrape(url);
      return html;
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
    htmlToPlainText
  };
} 