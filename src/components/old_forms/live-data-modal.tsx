import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { useState, useEffect } from "react"
import { Switch } from "@/components/ui/switch"
import { availableSources, updateAvailableSources } from "./files-modal"
import type { Source } from "@/components/sources-table"
import { Textarea } from "@/components/ui/textarea"
import { useWebScraping } from "@/hooks/use-web-scraping"

interface LiveDataModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSourcesUpdate: (sources: Source[]) => void
}

interface SourceConfig {
  name: string
  enabled: boolean
  url?: string
  sitemap?: string
  subdomain?: string
  mapId?: string
  prompt?: string
  botLogId?: string
  maxLinks?: number
  crawlDepth?: number
  maxTotalLinks?: number
  includeExternalLinks?: boolean
  extractMainContent?: boolean
}

interface LiveDataConfig {
  sourceId: string
  enabled: boolean
  url?: string
  sitemap?: string
  subdomain?: string
  mapId?: string
  prompt?: string
  botLogId?: string
  maxLinks?: number
  crawlDepth?: number
  maxTotalLinks?: number
  content?: string
}

const DEFAULT_CONFIG: SourceConfig = {
  name: '',
  enabled: true,
  maxLinks: 10,
  crawlDepth: 0,
  maxTotalLinks: 50,
  includeExternalLinks: true,
  extractMainContent: true,
}

// Store configurations separately
export const liveDataConfigs: LiveDataConfig[] = []

// Add a new function to perform web scraping using only native browser capabilities
const performWebScrape = async (url: string) => {
  try {
    console.log(`Starting web scrape for: ${url}`)
    
    // Try multiple CORS proxies in case some are down or blocked
    const corsProxies = [
      `https://corsproxy.org/?${encodeURIComponent(url)}`,
      `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
      `https://cors.eu.org/${url}`
    ]
    
    let html = null
    let proxyUsed = null
    
    // Try each proxy until one works
    for (const proxy of corsProxies) {
      try {
        console.log(`Trying proxy: ${proxy}`)
        const response = await fetch(proxy, { 
          method: 'GET',
          headers: {
            'Accept': 'text/html,application/xhtml+xml,application/xml',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        })
        
        if (response.ok) {
          html = await response.text()
          proxyUsed = proxy
          console.log(`Successfully fetched content using proxy: ${proxy}`)
          break
        }
      } catch (proxyError) {
        console.warn(`Proxy ${proxy} failed:`, proxyError)
        // Continue to next proxy
      }
    }
    
    if (!html) {
      throw new Error('All proxies failed to fetch the content')
    }
    
    console.log(`Retrieved HTML content length: ${html.length} bytes`)
    console.log(`First 200 chars: ${html.substring(0, 200)}...`)
    
    // Create a virtual DOM to parse the HTML without external libraries
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    
    // Extract page title
    const title = doc.querySelector('title')?.textContent || 'No title found'
    console.log(`Page title: ${title}`)
    
    // Extract text content from paragraphs
    const paragraphs = Array.from(doc.querySelectorAll('p')).map(p => p.textContent?.trim()).filter(Boolean)
    if (paragraphs.length > 0) {
      console.log(`Found ${paragraphs.length} paragraphs. First paragraph:`)
      console.log(paragraphs[0])
    }
    
    // Extract headings
    const headings = Array.from(doc.querySelectorAll('h1, h2, h3')).map(h => h.textContent?.trim()).filter(Boolean)
    if (headings.length > 0) {
      console.log(`Found ${headings.length} headings:`, headings.slice(0, 5))
    }
    
    return html
  } catch (error) {
    console.error(`Web scraping error:`, error)
    
    // Provide some fallback content to avoid completely failing
    return `Failed to scrape the URL: ${url}. Error: ${error.message}. Please try again later or try a different URL.`
  }
}

// Add a new function to parse sitemap XML and extract URLs
const parseSitemap = async (sitemapUrl: string): Promise<string[]> => {
  try {
    console.log(`Fetching sitemap from: ${sitemapUrl}`)
    
    // Use the same proxying approach as the main scraping function
    const corsProxies = [
      `https://corsproxy.org/?${encodeURIComponent(sitemapUrl)}`,
      `https://api.allorigins.win/raw?url=${encodeURIComponent(sitemapUrl)}`,
      `https://cors.eu.org/${sitemapUrl}`
    ]
    
    let xml = null
    
    // Try each proxy until one works
    for (const proxy of corsProxies) {
      try {
        const response = await fetch(proxy)
        if (response.ok) {
          xml = await response.text()
          console.log(`Successfully fetched sitemap using proxy: ${proxy}`)
          break
        }
      } catch (error) {
        console.warn(`Failed to fetch sitemap with proxy ${proxy}:`, error)
      }
    }
    
    if (!xml) {
      throw new Error('Failed to fetch sitemap')
    }
    
    // Parse the XML
    const parser = new DOMParser()
    const xmlDoc = parser.parseFromString(xml, 'text/xml')
    
    // Extract URLs from the sitemap
    const urls: string[] = []
    const locationNodes = xmlDoc.querySelectorAll('url > loc')
    
    locationNodes.forEach(node => {
      const url = node.textContent
      if (url) urls.push(url)
    })
    
    console.log(`Found ${urls.length} URLs in sitemap`)
    return urls
  } catch (error) {
    console.error(`Error parsing sitemap:`, error)
    return []
  }
}

// Add type definition for cheerio on the window object
declare global {
  interface Window {
    cheerio: any
  }
}

// Add a function to extract the main content from a webpage
const extractMainContent = (html: string): string => {
  // Create a virtual DOM to parse the HTML
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  
  // Remove script, style, nav, header, footer, and ad-related elements
  const elementsToRemove = doc.querySelectorAll('script, style, nav, header, footer, [class*="ads"], [class*="banner"], [id*="ads"], [class*="menu"], [class*="nav"], [class*="sidebar"], iframe')
  elementsToRemove.forEach(el => el.remove())
  
  // First try: Look for article element or main content identifiers
  let mainContent = doc.querySelector('article, [role="main"], main, #main, #content, .content, .article, .post, .entry')
  
  // If that didn't work, try to find the element with the most text content
  if (!mainContent) {
    let maxTextLength = 0
    let bestElement: Element | null = null
    
    // Look at content containers (div, section, etc) to find the one with most text
    const contentContainers = doc.querySelectorAll('div, section, article')
    contentContainers.forEach(container => {
      // Skip very small elements and likely navigation elements
      if (container.textContent && container.textContent.length > 200) {
        const text = container.textContent
        // Check the text-to-link ratio (high ratio suggests content, not navigation)
        const links = container.querySelectorAll('a')
        const linkTextLength = Array.from(links).reduce((sum, link) => sum + (link.textContent?.length || 0), 0)
        
        // Calculate content density
        const contentDensity = text.length - linkTextLength
        
        if (contentDensity > maxTextLength) {
          maxTextLength = contentDensity
          bestElement = container
        }
      }
    })
    
    mainContent = bestElement
  }
  
  // If we found something, extract its content
  if (mainContent) {
    // Clean up further by removing likely non-content elements inside our main content
    const nonContentElements = mainContent.querySelectorAll('[class*="related"], [class*="recommended"], [class*="share"], [class*="social"], [class*="comment"]')
    nonContentElements.forEach(el => el.remove())
    
    return mainContent.innerHTML
  }
  
  // Fallback to body content if we couldn't identify the main content
  return doc.body.innerHTML
}

// Update the htmlToPlainText function to use our content extraction
const htmlToPlainText = (html: string, externalLinks: { url: string, text: string }[] = []): string => {
  try {
    // First extract the main content
    const mainContent = extractMainContent(html)
    
    // Create a virtual DOM to parse just the main content
    const parser = new DOMParser()
    const doc = parser.parseFromString(mainContent, 'text/html')
    
    // Clean up heading elements to make them stand out in plain text
    const headings = doc.querySelectorAll('h1, h2, h3, h4, h5, h6')
    headings.forEach(heading => {
      const level = parseInt(heading.tagName.substring(1))
      const prefix = '#'.repeat(level) + ' '
      const text = heading.textContent?.trim() || ''
      const newHeading = document.createElement('p')
      newHeading.innerHTML = `<strong>${prefix}${text}</strong>`
      heading.parentNode?.replaceChild(newHeading, heading)
    })
    
    // Format paragraphs with line breaks
    const paragraphs = doc.querySelectorAll('p')
    paragraphs.forEach(p => {
      // Add a newline after each paragraph
      if (p.nextSibling) {
        p.insertAdjacentHTML('afterend', '\n')
      }
    })
    
    // Format list items
    const listItems = doc.querySelectorAll('li')
    listItems.forEach(li => {
      const text = li.textContent?.trim() || ''
      li.textContent = `• ${text}`
    })
    
    // Preserve links by replacing them with text and URL format
    const links = doc.querySelectorAll('a[href]')
    links.forEach(link => {
      const url = link.getAttribute('href')
      const text = link.textContent?.trim() || url
      
      // Skip empty or javascript links
      if (!url || url.startsWith('javascript:') || url.startsWith('#')) return
      
      // Create a format that preserves the link information
      const linkNode = document.createTextNode(` ${text} [${url}] `)
      link.parentNode?.replaceChild(linkNode, link)
    })
    
    // Get the text content and normalize whitespace
    let text = doc.body.textContent || ''
    text = text.replace(/\n\s+/g, '\n').replace(/\n{3,}/g, '\n\n').trim()
    
    // Add a section with external links if provided
    if (externalLinks && externalLinks.length > 0) {
      text += '\n\n--- EXTERNAL LINKS FOUND ON THIS PAGE ---\n\n'
      externalLinks.forEach((link, index) => {
        text += `${index + 1}. ${link.text} - ${link.url}\n`
      })
    }
    
    return text
  } catch (error) {
    console.error('Error in htmlToPlainText:', error)
    // Fallback to simpler approach if something goes wrong
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    return doc.body.textContent || html
  }
}

// Helper function to truncate URLs for display
const truncateUrl = (url: string, maxLength: number = 50): string => {
  if (url.length <= maxLength) return url;
  
  // Try to find a good breaking point
  const protocol = url.split('://')[0] + '://';
  const urlWithoutProtocol = url.substring(protocol.length);
  
  if (urlWithoutProtocol.length <= maxLength - 3) return url;
  
  // Keep the protocol and some of the beginning, then ellipsis, then some of the end
  const frontChars = Math.floor(maxLength / 2) - 2;
  const backChars = Math.floor(maxLength / 2) - 1;
  
  return protocol + urlWithoutProtocol.substring(0, frontChars) + 
         '...' + 
         urlWithoutProtocol.substring(urlWithoutProtocol.length - backChars);
}

export function LiveDataModal({ open, onOpenChange, onSourcesUpdate }: LiveDataModalProps) {
  const { 
    isLoading: dependenciesLoading, 
    dependenciesLoaded, 
    loadDependencies,
    extractLinks,
    htmlToPlainText,
    performWebScrape
  } = useWebScraping();
  
  const [sourceType, setSourceType] = useState<string>('')
  const [config, setConfig] = useState<SourceConfig>(DEFAULT_CONFIG)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [progress, setProgress] = useState<{current: number, total: number, status: string}>({
    current: 0,
    total: 0,
    status: ''
  })

  // Load dependencies when modal opens
  useEffect(() => {
    if (open && !dependenciesLoaded) {
      loadDependencies();
    }
  }, [open, dependenciesLoaded, loadDependencies]);

  const handleSave = async () => {
    if (!sourceType || !config.name) return
    
    // Start loading and reset progress
    setIsLoading(true)
    setProgress({
      current: 0,
      total: 0,
      status: 'Initializing...'
    })

    try {
      const newSource: Source = {
        id: Math.random().toString(36).substring(7),
        name: config.name,
        type: sourceType,
        lastUpdated: new Date().toISOString(),
        content: '',
        tags: ['Live Data', sourceType.toLowerCase()]
      }

      // Handle web scraping sources
      if (sourceType === 'web-scraping' && config.url) {
        let combinedContent = ''
        
        // Ensure crawlDepth is defined and valid
        const crawlDepth = config.crawlDepth !== undefined ? 
                          config.crawlDepth : 
                          DEFAULT_CONFIG.crawlDepth;
        
        console.log(`Starting web scrape with crawl depth: ${crawlDepth}`);
        
        // For crawl depth 0, just scrape the main page without following links
        if (crawlDepth === 0) {
          console.log(`Scraping only the main page: ${config.url}`);
          setProgress({
            current: 0,
            total: 1,
            status: `Scraping page: ${truncateUrl(config.url)}`
          });
          
          const content = await performWebScrape(config.url);
          
          if (content) {
            // Extract external links if enabled
            const { externalLinks } = extractLinks(content, config.url);
            
            // Clean up and add the content
            const cleanContent = config.includeExternalLinks 
              ? htmlToPlainText(content, externalLinks)
              : htmlToPlainText(content);
            
            combinedContent = `URL: ${config.url}\n\n${cleanContent}\n\n`;
            console.log(`Added content from ${config.url}`);
            console.log(`Found ${externalLinks.length} external links on this page`);
            
            // Update progress
            setProgress({
              current: 1,
              total: 1,
              status: `Completed scraping page: ${truncateUrl(config.url)}`
            });
          }
          
          // Assign the content to the source
          newSource.content = combinedContent;
          console.log(`Web scraping completed successfully for: ${config.name}`);
        } else {
          // Track all URLs to avoid duplication
          const processedUrls = new Set<string>()
          // Queue of URLs to process with their levels
          const urlQueue: Array<{url: string, level: number}> = [{url: config.url, level: 0}]
          // Total URLs found (to update progress)
          let totalUrlsFound = 1
          let processedCount = 0
          
          // Set max links per level and total max links
          const maxLinks = config.maxLinks || DEFAULT_CONFIG.maxLinks || 10
          const maxTotalLinks = config.maxTotalLinks || DEFAULT_CONFIG.maxTotalLinks || 50
          
          // Update progress with initial state
          setProgress({
            current: 0,
            total: totalUrlsFound,
            status: `Starting multi-level crawl of ${truncateUrl(config.url)} (max depth: ${crawlDepth})`
          })
          
          // Process URLs in queue until empty or limits reached
          while (urlQueue.length > 0) {
            const {url, level} = urlQueue.shift()!
            
            console.log(`Processing URL at level ${level}, max depth is ${crawlDepth}`);
            
            // Skip if we've already processed this URL
            if (processedUrls.has(url)) continue
            
            // Mark as processed
            processedUrls.add(url)
            processedCount++
            
            // Update progress
            setProgress({
              current: processedCount,
              total: totalUrlsFound,
              status: `Scraping page ${processedCount}/${totalUrlsFound}: ${truncateUrl(url)} (level ${level})`
            })
            
            console.log(`Scraping URL (level ${level}): ${truncateUrl(url)}`)
            
            // Add a small delay between requests
            if (processedCount > 1) {
              await new Promise(resolve => setTimeout(resolve, 500))
            }
            
            // Scrape the content
            const content = await performWebScrape(url)
            
            if (content) {
              // Extract all links before processing content
              const { internalLinks, externalLinks } = extractLinks(content, url)
              
              // Clean up and add the content, including external links if enabled
              const cleanContent = config.includeExternalLinks 
                ? htmlToPlainText(content, externalLinks)
                : htmlToPlainText(content)
              
              // Add separator only if not the first page
              if (combinedContent) {
                combinedContent += `\n\n--- NEW PAGE (level ${level}) ---\n\n`
              }
              
              combinedContent += `URL: ${truncateUrl(url)}\n\n${cleanContent}\n\n`
              console.log(`Added content from ${truncateUrl(url)} (level ${level})`)
              console.log(`Found ${externalLinks.length} external links on this page`)
              
              // Extract links if we haven't reached max depth
              if (level < crawlDepth) {
                console.log(`Found ${internalLinks.length} internal links on page: ${truncateUrl(url)}`)
                
                // Filter links we haven't processed yet and limit by maxLinks
                const newLinks = internalLinks
                  .filter(link => !processedUrls.has(link)) // Only links we haven't seen
                  .slice(0, maxLinks) // Limit per page
                
                // Add new links to the queue with increased level
                newLinks.forEach(link => {
                  urlQueue.push({url: link, level: level + 1})
                })
                
                // Update total URLs counter
                totalUrlsFound += newLinks.length
                
                // Update progress with new total
                setProgress(prev => ({
                  ...prev,
                  total: totalUrlsFound,
                  status: `Found ${newLinks.length} new links on ${truncateUrl(url)} (level ${level})`
                }))
              }
            }
            
            // Break if we've processed too many URLs (global limit)
            if (processedCount >= maxTotalLinks) {
              console.log(`Reached maximum total link limit (${maxTotalLinks}). Stopping crawl.`)
              break
            }
          }
          
          newSource.content = combinedContent
          console.log(`Web scraping completed. Processed ${processedCount} pages.`)
          
          // Final progress update
          setProgress({
            current: processedCount,
            total: processedCount,
            status: `Web scraping completed! Processed ${processedCount} pages across ${crawlDepth + 1} levels.`
          })
        }
      }

      const updatedSources = [...availableSources, newSource]
      
      // Don't pass argument to updateAvailableSources
      updateAvailableSources()
      
      // Update UI with new sources
      onSourcesUpdate(updatedSources)

      // Store configuration separately - include the content in the config
      liveDataConfigs.push({
        sourceId: newSource.id,
        enabled: config.enabled,
        url: config.url,
        sitemap: config.sitemap,
        subdomain: config.subdomain,
        mapId: config.mapId,
        prompt: config.prompt,
        botLogId: config.botLogId,
        maxLinks: config.maxLinks,
        crawlDepth: config.crawlDepth,
        maxTotalLinks: config.maxTotalLinks,
        content: newSource.content
      })

      // Reset form and close modal
      setSourceType('')
      setConfig(DEFAULT_CONFIG)
      setIsLoading(false)
      setProgress({current: 0, total: 0, status: ''})
      onOpenChange(false)
      
    } catch (error) {
      console.error('Error during save operation:', error)
      setProgress(prev => ({
        ...prev,
        status: `Error: ${error.message}`
      }))
      setIsLoading(false)
    }
  }

  const updateConfig = (updates: Partial<SourceConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }))
  }

  // Add the maxLinks input field to the UI when web-scraping is selected
  const renderSourceTypeFields = () => {
    if (!sourceType) return null;
    
    return (
      <>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="source-name" className="text-right">Name</Label>
          <Input
            id="source-name"
            className="col-span-3"
            value={config.name}
            onChange={(e) => updateConfig({ name: e.target.value })}
            placeholder="Enter source name"
          />
        </div>

        <div className="grid grid-cols-4 items-center gap-4">
          <Label className="text-right">Enabled</Label>
          <div className="col-span-3">
            <Switch
              checked={config.enabled}
              onCheckedChange={(enabled) => updateConfig({ enabled })}
            />
          </div>
        </div>

        {sourceType === 'zendesk' && (
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Subdomain</Label>
            <Input
              className="col-span-3"
              value={config.subdomain || ''}
              onChange={(e) => updateConfig({ subdomain: e.target.value })}
              placeholder="your-company"
            />
          </div>
        )}

        {sourceType === 'directus' && (
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Map ID</Label>
            <Input
              className="col-span-3"
              value={config.mapId || ''}
              onChange={(e) => updateConfig({ mapId: e.target.value })}
              placeholder="Enter map ID"
            />
          </div>
        )}

        {sourceType === 'web-scraping' && (
          <>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">URL</Label>
              <Input
                className="col-span-3"
                value={config.url || ''}
                onChange={(e) => updateConfig({ url: e.target.value })}
                placeholder="https://example.com"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Max Links per Page</Label>
              <Input
                type="number"
                min="1"
                max="50"
                className="col-span-3"
                value={config.maxLinks || 10}
                onChange={(e) => updateConfig({ maxLinks: parseInt(e.target.value) || 10 })}
                placeholder="Maximum number of links to scrape per page"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Crawl Depth</Label>
              <Select 
                value={String(config.crawlDepth || 0)} 
                onValueChange={(value) => updateConfig({ crawlDepth: parseInt(value) })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select crawl depth" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">0 - This page only</SelectItem>
                  <SelectItem value="1">1 - Main page + direct links</SelectItem>
                  <SelectItem value="2">2 - Include links from linked pages (same domain only)</SelectItem>
                  <SelectItem value="3">3 - Deep crawl within domain (use cautiously)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(config.crawlDepth !== undefined && config.crawlDepth > 1) && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Max Total Links</Label>
                <Input
                  type="number"
                  min="10"
                  max="200"
                  className="col-span-3"
                  value={config.maxTotalLinks || 50}
                  onChange={(e) => updateConfig({ maxTotalLinks: parseInt(e.target.value) || 50 })}
                  placeholder="Maximum total links to process"
                />
              </div>
            )}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Include External Links</Label>
              <div className="col-span-3 flex items-center">
                <Switch
                  checked={config.includeExternalLinks !== false}
                  onCheckedChange={(checked) => updateConfig({ includeExternalLinks: checked })}
                />
                <span className="ml-2 text-sm text-muted-foreground">
                  Show links to external websites in the content
                </span>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Extract Main Content</Label>
              <div className="col-span-3 flex items-center">
                <Switch
                  checked={config.extractMainContent !== false}
                  onCheckedChange={(checked) => updateConfig({ extractMainContent: checked })}
                />
                <span className="ml-2 text-sm text-muted-foreground">
                  Extract only the main article content (recommended)
                </span>
              </div>
            </div>
          </>
        )}

        {sourceType === 'bot-logs' && (
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Bot Log ID</Label>
            <Input
              className="col-span-3"
              value={config.botLogId || ''}
              onChange={(e) => updateConfig({ botLogId: e.target.value })}
              placeholder="Enter bot log ID"
            />
          </div>
        )}

        {(sourceType === 'perplexity' || sourceType === 'exa') && (
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Prompt</Label>
            <div className="col-span-3">
              <Textarea
                value={config.prompt || ''}
                onChange={(e) => updateConfig({ prompt: e.target.value })}
                placeholder={`Enter ${sourceType} prompt...`}
                className="min-h-[100px]"
              />
            </div>
          </div>
        )}
      </>
    );
  };

  return (
    <Dialog open={open} onOpenChange={isLoading ? undefined : onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-w-[95vw]">
        <DialogHeader>
          <DialogTitle>Live Data Source Configuration</DialogTitle>
          <DialogDescription>
            Configure and manage your live data sources for real-time data processing.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {isLoading ? (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-medium truncate max-w-full">Scraping in progress...</h3>
                <p className="text-sm text-muted-foreground break-words overflow-hidden max-h-20 overflow-y-auto whitespace-normal">
                  {progress.status}
                </p>
              </div>
              {progress.total > 0 && (
                <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full" 
                    style={{ width: `${(progress.current / progress.total) * 100}%` }}
                  ></div>
                </div>
              )}
              <div className="text-center text-sm text-muted-foreground">
                {progress.total > 0 ? `${progress.current} of ${progress.total} pages processed` : ''}
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="source-type" className="text-right">Source Type</Label>
                <Select value={sourceType} onValueChange={setSourceType}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select source type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="zendesk">Zendesk</SelectItem>
                    <SelectItem value="perplexity">Perplexity</SelectItem>
                    <SelectItem value="directus">Directus</SelectItem>
                    <SelectItem value="exa">Exa</SelectItem>
                    <SelectItem value="web-scraping">Web Scraping</SelectItem>
                    <SelectItem value="bot-logs">Bot Logs</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {renderSourceTypeFields()}
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>Cancel</Button>
          <Button 
            type="submit" 
            onClick={handleSave}
            disabled={isLoading || !sourceType || !config.name || (sourceType === 'web-scraping' && !config.url)}
          >
            {isLoading ? 'Processing...' : 'Save Configuration'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 