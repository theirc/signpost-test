/**
 * useWebScraping Hook
 * 
 * A hook that provides web scraping functionality for the application.
 * Manages loading of required CDN libraries for processing web content,
 * and provides utility functions for extracting content and links from web pages.
 * 
 * @returns {Object} An object containing:
 *   - isLoading: Boolean indicating if dependencies are loading
 *   - dependenciesLoaded: Boolean indicating if all dependencies are loaded
 *   - loadDependencies: Function to manually load dependencies
 *   - performWebScrape: Function to scrape content from a URL
 *   - extractLinks: Function to extract links from HTML content
 *   - htmlToPlainText: Function to convert HTML to plain text
 */
import { useState, useEffect } from 'react'

// CDN URLs for various libraries... NOTE: This is not the best way to do this, but it is a quick and dirty solution. Once we land on which libraries we want to use, we should yarn add them to the project and remove the CDN links.
const PDF_JS_CDN = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"
const PDF_WORKER_CDN = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js"
const MAMMOTH_CDN = "https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js"
const CSV_PARSE_CDN = "https://cdn.jsdelivr.net/npm/papaparse@5.4.1/papaparse.min.js"

// Function to load a script from CDN
const loadScript = (url: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Check if script is already loaded
    if (document.querySelector(`script[src="${url}"]`)) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = url;
    script.async = true;

    script.onload = () => resolve();
    script.onerror = (e) => reject(new Error(`Script load error for ${url}: ${e}`));

    document.head.appendChild(script);
  });
};

// Extract links from HTML content
export const extractLinks = (html: string, baseUrl: string) => {
  // Create a DOM parser
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  
  // Extract all links
  const links = Array.from(doc.querySelectorAll('a[href]'))
    .map(a => {
      const href = a.getAttribute('href') || '';
      // Convert relative URLs to absolute
      try {
        return new URL(href, baseUrl).href;
      } catch (e) {
        return '';
      }
    })
    .filter(Boolean);
  
  // Separate internal and external links
  const urlObj = new URL(baseUrl);
  const domain = urlObj.hostname;
  
  const internalLinks = links.filter(link => {
    try {
      return new URL(link).hostname === domain;
    } catch {
      return false;
    }
  });
  
  const externalLinks = links.filter(link => {
    try {
      return new URL(link).hostname !== domain;
    } catch {
      return false;
    }
  });
  
  return { internalLinks, externalLinks, allLinks: links };
};

// Convert HTML to plain text
export const htmlToPlainText = (html: string, externalLinks: string[] = []) => {
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
  
  // Add external links if provided
  if (externalLinks.length > 0) {
    text += '\n\nExternal Links:\n' + externalLinks.join('\n');
  }
  
  return text;
};

// Web scraping function
export const performWebScrape = async (url: string) => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
    }
    
    const html = await response.text();
    return html;
  } catch (error) {
    console.error(`Error scraping ${url}:`, error);
    return '';
  }
};

export function useWebScraping() {
  const [isLoading, setIsLoading] = useState(false);
  const [dependenciesLoaded, setDependenciesLoaded] = useState(false);
  
  // Load required CDNs
  const loadDependencies = async () => {
    try {
      setIsLoading(true);
      
      // Load scripts sequentially to avoid race conditions
      await loadScript(PDF_JS_CDN);
      await loadScript(PDF_WORKER_CDN);
      await loadScript(MAMMOTH_CDN);
      await loadScript(CSV_PARSE_CDN);
      
      setDependenciesLoaded(true);
      return true;
    } catch (error) {
      console.error('Error loading dependencies:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Preload scripts when component mounts
    loadDependencies();
  }, []);
  
  return {
    isLoading,
    dependenciesLoaded,
    loadDependencies,
    performWebScrape,
    extractLinks,
    htmlToPlainText
  };
}

// Add TypeScript global declarations for the libraries we are using
declare global {
  interface Window {
    pdfjsLib: any;
    mammoth: any;
    Papa: any;
  }
} 