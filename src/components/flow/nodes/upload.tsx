import { LabeledHandle } from "@/components/labeled-handle"
import { Position } from '@xyflow/react'
import { Upload } from "lucide-react"
import { NodeLayout } from './node'
import { NodeTitle } from './title'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { useState, useRef, useEffect } from "react"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

// CDN imports for parsers
const READABILITY_CDN = "https://cdn.jsdelivr.net/npm/@mozilla/readability@0.5.0/Readability.min.js"
const URL_PARSE_CDN = "https://cdn.jsdelivr.net/npm/url-parse@1.5.10/dist/url-parse.min.js"

// File Parser CDN Imports - NOTE: This is a temporary solution and will be replaced with some real dependencies
const PDF_JS_CDN = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"
const MAMMOTH_CDN = "https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js"
const DOCX2HTML_CDN = "https://cdn.jsdelivr.net/npm/docx2html@1.3.2/dist/docx2html.min.js"
const CSV_PARSE_CDN = "https://cdn.jsdelivr.net/npm/papaparse@5.4.1/papaparse.min.js"

// Initialize PDF.js worker
const initPdfJs = async () => {
  await loadScript(PDF_JS_CDN)
  const pdfjsLib = (window as any).pdfjsLib
  pdfjsLib.GlobalWorkerOptions.workerSrc = PDF_JS_CDN.replace('pdf.min.js', 'pdf.worker.min.js')
  return pdfjsLib
}

// Load external scripts dynamically
const loadScript = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve()
      return
    }
    const script = document.createElement('script')
    script.src = src
    script.onload = () => resolve()
    script.onerror = (e) => reject(e)
    document.head.appendChild(script)
  })
}

// Parse web content from URL
const parseWebContent = async (url: string, depth: string = "1"): Promise<{ title: string; content: string; excerpt: string; siteName: string }> => {
  try {
    // Load required libraries
    await Promise.all([
      loadScript(READABILITY_CDN),
      loadScript(URL_PARSE_CDN)
    ])

    // List of CORS proxies to try in order
    const corsProxies = [
      'https://api.allorigins.win/raw?url=',
      'https://corsproxy.io/?',
      'https://proxy.cors.sh/'
    ]

    let response = null
    let error = null

    // Try each proxy in sequence until one works
    for (const proxy of corsProxies) {
      try {
        response = await fetch(proxy + encodeURIComponent(url), {
          headers: {
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Origin': window.location.origin
          }
        })
        
        if (response.ok) break
      } catch (e) {
        error = e
        continue
      }
    }

    if (!response?.ok) {
      throw new Error(`Failed to fetch content: ${error?.message || 'All proxies failed'}`)
    }

    const html = await response.text()
    
    // Parse with DOM Parser
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    
    // Extract main content using Readability
    const reader = new (window as any).Readability(doc)
    const article = reader.parse()

    // Fallback if Readability fails
    if (!article) {
      const title = doc.querySelector('title')?.textContent || url
      const content = doc.body?.textContent?.trim() || 'No content could be extracted'
      const siteName = doc.querySelector('meta[property="og:site_name"]')?.getAttribute('content') || 
                      new URL(url).hostname

      return {
        title,
        content: `<div class="content"><p>${content}</p></div>`,
        excerpt: doc.querySelector('meta[name="description"]')?.getAttribute('content') || '',
        siteName
      }
    }

    return {
      title: article.title,
      content: article.content,
      excerpt: article.excerpt,
      siteName: article.siteName || new URL(url).hostname
    }
  } catch (error) {
    console.error('Error parsing web content:', error)
    throw new Error(`Failed to parse web content: ${error.message}`)
  }
}

// Format parsed web content for display
const getWebOutput = (data: { title: string; content: string; siteName: string; excerpt: string }) => `
<div class="content-wrapper">
  <h1>${data.title || 'Web Content'}</h1>
  <div class="metadata">
    ${data.siteName ? `<span>Site: ${data.siteName}</span>` : ''}
    ${data.excerpt ? `<div class="excerpt">${data.excerpt}</div>` : ''}
  </div>
  <div class="main-content">
    ${data.content || ''}
  </div>
</div>
`

const SUPPORTED_FILE_TYPES = {
  document: '.pdf,.doc,.docx,.txt',
  data: '.csv,.json',
  audio: '.wav,.mp3',
  web: '.url,http:,https:'  // Add support for web URLs
}

const DEFAULT_OUTPUT = `
<div class="content-wrapper">
  <h1>No Content Selected</h1>
  <div class="main-content">
    <p>Please select a file to view its parsed content here.</p>
    <p>Supported file types:</p>
    <ul>
      <li>Documents: PDF, DOC, DOCX, TXT</li>
      <li>Data: CSV, JSON</li>
      <li>Audio: WAV, MP3</li>
    </ul>
  </div>
</div>
`

// Sample output templates for different file types
const getDocumentOutput = (content: string, metadata: any) => `
<div class="content-wrapper">
  <h1>${metadata.title || 'Document Content'}</h1>
  <div class="metadata">
    ${metadata.author ? `<span>Author: ${metadata.author}</span>` : ''}
    ${metadata.date ? `<span>Date: ${metadata.date}</span>` : ''}
    ${metadata.pages ? `<span>Pages: ${metadata.pages}</span>` : ''}
  </div>
  <div class="main-content">
    ${content}
  </div>
</div>
`

const getDataOutput = (data: any, type: string) => {
  if (type === 'json') {
    return `
<div class="content-wrapper">
  <h1>JSON Data Structure</h1>
  <div class="main-content">
    <pre>${JSON.stringify(data, null, 2)}</pre>
  </div>
</div>
    `
  }
  
  // CSV
  return `
<div class="content-wrapper">
  <h1>CSV Data Preview</h1>
  <div class="metadata">
    <span>Rows: ${data.length}</span>
    ${data[0] ? `<span>Columns: ${Object.keys(data[0]).length}</span>` : ''}
  </div>
  <div class="main-content">
    <table class="border-collapse w-full">
      ${data.slice(0, 10).map((row: any, i: number) => `
        ${i === 0 ? `
          <tr>
            ${Object.keys(row).map((key: string) => `<th class="border p-2">${key}</th>`).join('')}
          </tr>
        ` : ''}
        <tr>
          ${Object.values(row).map((val: any) => `<td class="border p-2">${val}</td>`).join('')}
        </tr>
      `).join('')}
    </table>
    ${data.length > 10 ? `<p class="mt-4 text-muted-foreground">Showing first 10 rows of ${data.length} total rows</p>` : ''}
  </div>
</div>
  `
}

const getAudioOutput = (transcript: string, metadata: any) => `
<div class="content-wrapper">
  <h1>Audio Transcript</h1>
  <div class="metadata">
    <span>Duration: ${metadata.duration}</span>
    <span>Format: ${metadata.format}</span>
  </div>
  <div class="main-content">
    <p>${transcript}</p>
  </div>
</div>
`

export function DocumentUploadNode({ data, isConnectable }) {
  // File Upload Form State
  const [uploadType, setUploadType] = useState("file")
  const [files, setFiles] = useState<File[]>([])
  const [description, setDescription] = useState("")
  const [dragActive, setDragActive] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [parsedContent, setParsedContent] = useState<string>(data?.content || DEFAULT_OUTPUT)
  
  // Web Crawler Form State
  const [urls, setUrls] = useState<string>("")
  const [crawlDepth, setCrawlDepth] = useState<string>("1")
  
  // AI Source Form State
  const [aiSource, setAiSource] = useState("perplexity")
  const [model, setModel] = useState("pplx-7b-online")
  const [apiKey, setApiKey] = useState("")
  const [query, setQuery] = useState("")

  // Modal State
  const [showOutput, setShowOutput] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Update node data when content changes
  const updateNodeData = (content: string, newDescription?: string) => {
    const descToUse = newDescription !== undefined ? newDescription : description
    
    // Wrap the content with description if it exists
    const contentWithDescription = `
      <div class="content-wrapper">
        ${descToUse ? `
          <div class="description mb-4 text-muted-foreground">
            <h2 class="text-lg font-semibold mb-2">Description</h2>
            <p>${descToUse}</p>
          </div>
        ` : ''}
        ${content}
      </div>
    `

    console.log('Updating node data:', {
      content: contentWithDescription,
      files: files.map(f => f.name),
      description: descToUse
    })
    
    setParsedContent(contentWithDescription)
    
    // Update the node's data
    if (data) {
      // Preserve existing data structure and just update what we need
      data.content = contentWithDescription
      data.files = files.map(f => f.name)
      data.type = "upload"
      data.description = descToUse
      data.uploadType = uploadType
      data.lastUpdated = new Date().toISOString()
      
      console.log('Updated node data:', data)
    }
  }

  // Initialize from existing data
  useEffect(() => {
    console.log('Node data received:', data)
    if (data?.content) {
      console.log('Setting content from node data:', data.content)
      setParsedContent(data.content)
      
      // Restore other state if available
      if (data.description) setDescription(data.description)
      if (data.uploadType) setUploadType(data.uploadType)
      if (data.files) {
        console.log('Files in node data:', data.files)
      }
    }
  }, [data])

  // Handle description changes
  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newDescription = e.target.value
    setDescription(newDescription)
  }

  const getAcceptedFileTypes = () => Object.values(SUPPORTED_FILE_TYPES).join(',')

  const handleFiles = async (newFiles: FileList | null) => {
    if (!newFiles) return
    setFiles(prev => [...prev, ...Array.from(newFiles)])
  }

  const parseAllFiles = async () => {
    if (files.length === 0) return

    setIsLoading(true)
    try {
      console.log('Starting to parse files:', files.map(f => f.name))
      const results = await Promise.all(files.map(file => parseFile(file)))
      console.log('Parse results:', results)
      
      // Combine all results into one output
      const combinedContent = `
        <div class="content-wrapper">
          <h1>Combined File Contents</h1>
          <div class="file-count mb-4">
            <span class="text-sm text-muted-foreground">Processed ${files.length} file(s)</span>
          </div>
          <div class="files-content space-y-8">
            ${results.map((result, index) => `
              <div class="file-section">
                <h2 class="text-lg font-semibold mb-2">${files[index].name}</h2>
                ${result.content}
              </div>
            `).join('\n')}
          </div>
        </div>
      `
      console.log('Combined content:', combinedContent)
      setParsedContent(combinedContent)
      // Update node data with both content and description
      updateNodeData(combinedContent, description)
    } catch (error) {
      console.error('Error parsing files:', error)
      const errorContent = `<div class="error">Error parsing files: ${error.message}</div>`
      setParsedContent(errorContent)
      updateNodeData(errorContent, description)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (e.target.files) {
      handleFiles(e.target.files)
    }
  }

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const parseFile = async (file: File | string): Promise<{ content: string; type: string }> => {
    try {
      // Handle URLs
      if (typeof file === 'string' && (file.startsWith('http://') || file.startsWith('https://'))) {
        const webContent = await parseWebContent(file)
        return {
          content: getWebOutput(webContent),
          type: 'web'
        }
      }

      // Handle files
      if (!(file instanceof File)) {
        throw new Error('Invalid input: expected File object')
      }

      const text = await file.text()
      const extension = file.name.split('.').pop()?.toLowerCase() || ''

      switch (extension) {
        case 'txt': {
          const parsedContent = getDocumentOutput(text, {
            title: file.name,
            date: new Date().toISOString().split('T')[0]
          })
          return {
            content: parsedContent,
            type: 'document'
          }
        }

        case 'json': {
          const jsonData = JSON.parse(text)
          const parsedContent = getDataOutput(jsonData, 'json')
          return {
            content: parsedContent,
            type: 'data'
          }
        }

        case 'csv': {
          await loadScript(CSV_PARSE_CDN)
          return new Promise((resolve, reject) => {
            const Papa = (window as any).Papa
            Papa.parse(file, {
              header: true,
              skipEmptyLines: true,
              complete: (results: any) => {
                const parsedContent = getDataOutput(results.data, 'csv')
                resolve({
                  content: parsedContent,
                  type: 'data'
                })
              },
              error: (error: any) => {
                reject(new Error(`Failed to parse CSV: ${error}`))
              }
            })
          })
        }

        case 'pdf': {
          const pdfjsLib = await initPdfJs()
          const arrayBuffer = await file.arrayBuffer()
          const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
          
          let fullText = ''
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i)
            const textContent = await page.getTextContent()
            const pageText = textContent.items.map((item: any) => item.str).join(' ')
            fullText += pageText + '\n\n'
          }

          const parsedContent = getDocumentOutput(fullText, {
            title: file.name,
            date: new Date().toISOString().split('T')[0],
            pages: pdf.numPages
          })
          return {
            content: parsedContent,
            type: 'document'
          }
        }

        case 'docx': {
          await loadScript(MAMMOTH_CDN)
          const arrayBuffer = await file.arrayBuffer()
          const result = await (window as any).mammoth.convertToHtml({ arrayBuffer })
          const parsedContent = getDocumentOutput(result.value, {
            title: file.name,
            date: new Date().toISOString().split('T')[0]
          })
          return {
            content: parsedContent,
            type: 'document'
          }
        }

        case 'doc': {
          await loadScript(DOCX2HTML_CDN)
          const arrayBuffer = await file.arrayBuffer()
          const docx2html = (window as any).docx2html
          const result = await docx2html(arrayBuffer)
          const parsedContent = getDocumentOutput(result, {
            title: file.name,
            date: new Date().toISOString().split('T')[0]
          })
          return {
            content: parsedContent,
            type: 'document'
          }
        }

        case 'mp3':
        case 'wav': {
          // Audio transcription would require a backend service NOT READY YET
          const parsedContent = getAudioOutput(
            'Audio transcription requires a backend speech-to-text service.',
            {
              duration: '00:00:00',
              format: extension.toUpperCase()
            }
          )
          return {
            content: parsedContent,
            type: 'audio'
          }
        }

        default:
          throw new Error('Unsupported file type')
      }
    } catch (error) {
      console.error('Error parsing file:', error)
      return {
        content: `<div class="error">Error parsing file: ${error.message}</div>`,
        type: 'error'
      }
    }
  }

  const handleCrawl = async () => {
    try {
      setIsLoading(true)
      const urlList = urls.split('\n').filter(url => url.trim())
      if (urlList.length === 0) return
      
      // Parse the first URL for now (multi-URL support can be added later)
      const result = await parseWebContent(urlList[0], crawlDepth)
      const webContent = getWebOutput(result)
      updateNodeData(webContent)
    } catch (error) {
      const errorContent = `<div class="error">Error crawling web content: ${error.message}</div>`
      updateNodeData(errorContent)
    } finally {
      setIsLoading(false)
    }
  }

  const FileUploadForm = () => (
    <div className="space-y-4">
      <div>
        <Label>Upload Files</Label>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={getAcceptedFileTypes()}
          onChange={handleChange}
          className="hidden"
          disabled={isLoading}
        />
        <div 
          onClick={() => !isLoading && inputRef.current?.click()}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-md p-4 text-center transition-colors ${
            isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
          } ${dragActive ? 'border-primary bg-accent' : 'hover:bg-accent'}`}
        >
          <p className="text-sm text-muted-foreground">
            {isLoading ? (
              <>
                <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-background border-r-foreground"></span>
                Processing files...
              </>
            ) : dragActive ? (
              "Drop files here"
            ) : (
              "Drag and drop files here or click to browse"
            )}
          </p>
        </div>

        {files.length > 0 && (
          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              {files.map((file, index) => (
                <div key={index} className="flex items-center justify-between bg-accent rounded-md p-2">
                  <span className="text-sm truncate">{file.name}</span>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => removeFile(index)}
                    disabled={isLoading}
                  >×</Button>
                </div>
              ))}
            </div>
            
            <Button
              className="w-full"
              onClick={parseAllFiles}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-r-foreground"></span>
                  Processing...
                </>
              ) : (
                'Parse All Files'
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  )

  const WebCrawlerForm = () => {
    return (
      <div className="space-y-4">
        <div>
          <Label>Crawl Depth</Label>
          <Select 
            value={crawlDepth}
            onValueChange={setCrawlDepth}
            disabled={isLoading}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select crawl depth" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Single Page</SelectItem>
              <SelectItem value="2">Follow Direct Links</SelectItem>
              <SelectItem value="3">Deep Crawl</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button 
          className="w-full"
          onClick={handleCrawl}
          disabled={!urls.trim() || isLoading}
        >
          {isLoading ? (
            <>
              <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-r-foreground"></span>
              Crawling...
            </>
          ) : (
            'Start Crawling'
          )}
        </Button>
      </div>
    )
  }

  const AISourceForm = () => (
    <div className="space-y-4">
      <div>
        <Label>AI Source</Label>
        <Select 
          value={aiSource}
          onValueChange={setAiSource}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select AI source" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="perplexity">Perplexity</SelectItem>
            <SelectItem value="exa">Exa</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Model/Endpoint</Label>
        <Select 
          value={model}
          onValueChange={setModel}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select model" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pplx-7b-online">pplx-7b-online</SelectItem>
            <SelectItem value="pplx-70b-online">pplx-70b-online</SelectItem>
            <SelectItem value="pplx-7b-chat">pplx-7b-chat</SelectItem>
            <SelectItem value="pplx-70b-chat">pplx-70b-chat</SelectItem>
            <SelectItem value="mixtral-8x7b-instruct">mixtral-8x7b-instruct</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>API Key*</Label>
        <Input 
          type="password" 
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="Enter API key" 
        />
      </div>

      <div>
        <Label>Query</Label>
        <Textarea 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter your search query..."
          className="min-h-[80px]"
        />
      </div>
    </div>
  )

  const BotLogsForm = () => (
    <div className="space-y-4">
      <div>
        <Label>Bot ID*</Label>
        <Input 
          placeholder="Enter Bot ID" 
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>From Date</Label>
          <Input 
            type="date"
            placeholder="Start date"
          />
        </div>
        <div>
          <Label>To Date</Label>
          <Input 
            type="date"
            placeholder="End date"
          />
        </div>
      </div>
    </div>
  )

  const getForm = () => {
    switch (uploadType) {
      case "file":
        return <FileUploadForm />
      case "crawler":
        return <WebCrawlerForm />
      case "ai":
        return <AISourceForm />
      case "logs":
        return <BotLogsForm />
      default:
        return <FileUploadForm />
    }
  }

  return <NodeLayout>
    <NodeTitle title="Input Content" icon={Upload} />
    <div className="relative">
      <LabeledHandle 
        id="output" 
        title="Output" 
        type="source" 
        position={Position.Right} 
        style={{ top: 20 }}
      />
      <div className="w-full px-4 pt-16 pb-4">
        <div className='space-y-4'>
          <div className="flex justify-between items-center">
            <Label>Upload Type</Label>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowOutput(true)}
              className="px-2 py-1 h-7"
            >
              View Output
            </Button>
          </div>
          <Select 
            value={uploadType}
            onValueChange={setUploadType}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="file">File Upload</SelectItem>
              <SelectItem value="crawler">Web Crawler</SelectItem>
              <SelectItem value="ai">AI Source</SelectItem>
              <SelectItem value="logs">Bot Logs</SelectItem>
            </SelectContent>
          </Select>

          <Separator className="my-2" />
          
          {uploadType === "crawler" && (
            <div>
              <Label>URLs to Crawl</Label>
              <Textarea 
                value={urls}
                onChange={(e) => setUrls(e.target.value)}
                placeholder="Enter Page URL or sitemap.xml (one per line)..."
                className="min-h-[100px]"
              />
            </div>
          )}
          
          {getForm()}

          <div>
            <Label>Description</Label>
            <Textarea 
              value={description}
              onChange={handleDescriptionChange}
              placeholder="Enter a description..."
              className="min-h-[80px]"
            />
          </div>
        </div>
      </div>

      <Dialog open={showOutput} onOpenChange={setShowOutput}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Generated Output</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <div className="bg-accent p-4 rounded-md">
              <div 
                className="whitespace-pre-wrap text-sm"
                dangerouslySetInnerHTML={{ 
                  __html: parsedContent || DEFAULT_OUTPUT 
                }}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  </NodeLayout>
} 