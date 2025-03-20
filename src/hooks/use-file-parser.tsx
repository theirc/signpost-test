import { useState, useEffect } from 'react'

// CDN URLs for file parsers
const PARSER_CDNS = {
  pdf: "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js",
  pdfWorker: "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js",
  docx: "https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js",
  csv: "https://cdn.jsdelivr.net/npm/papaparse@5.4.1/papaparse.min.js"
}

// Load a script from CDN if not already loaded
const loadScript = async (url: string): Promise<void> => {
  if (document.querySelector(`script[src="${url}"]`)) return
  
  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = url
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error(`Failed to load ${url}`))
    document.head.appendChild(script)
  })
}

export interface ParsedFile {
  id: string
  name: string
  content: string
}

export function useFileParser() {
  const [isLoading, setIsLoading] = useState(false)
  const [dependenciesLoaded, setDependenciesLoaded] = useState(false)

  // Load parser dependencies
  useEffect(() => {
    const loadDependencies = async () => {
      try {
        setIsLoading(true)
        await Promise.all([
          loadScript(PARSER_CDNS.pdf),
          loadScript(PARSER_CDNS.pdfWorker),
          loadScript(PARSER_CDNS.docx),
          loadScript(PARSER_CDNS.csv)
        ])
        setDependenciesLoaded(true)
      } finally {
        setIsLoading(false)
      }
    }

    loadDependencies()
  }, [])

  const parsePDF = async (file: File): Promise<string> => {
    if (!window.pdfjsLib) throw new Error("PDF.js not loaded")
    
    const data = await file.arrayBuffer()
    const pdf = await window.pdfjsLib.getDocument({ data }).promise
    const textContent = await Promise.all(
      Array.from({ length: pdf.numPages }, (_, i) => 
        pdf.getPage(i + 1)
          .then(page => page.getTextContent())
          .then(content => content.items.map((item: any) => item.str).join(' '))
      )
    )
    
    return textContent.join('\n')
  }

  const parseDocx = async (file: File): Promise<string> => {
    if (!window.mammoth) throw new Error("Mammoth not loaded")
    
    const arrayBuffer = await file.arrayBuffer()
    const result = await window.mammoth.extractRawText({ arrayBuffer })
    return result.value
  }

  const parseCSV = async (file: File): Promise<string> => {
    if (!window.Papa) throw new Error("Papa Parse not loaded")
    
    const text = await file.text()
    const result = window.Papa.parse(text, {
      header: true,
      skipEmptyLines: true
    })
    
    return JSON.stringify(result.data, null, 2)
  }

  const parseText = (file: File): Promise<string> => file.text()

  const parseFiles = async (files: File[]): Promise<ParsedFile[]> => {
    if (!dependenciesLoaded || files.length === 0) return []
    
    setIsLoading(true)
    try {
      const parsedFiles: ParsedFile[] = []
      
      for (const file of files) {
        try {
          let content = ""
          switch (file.type) {
            case 'application/pdf':
              content = await parsePDF(file)
              break
            case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
              content = await parseDocx(file)
              break
            case 'text/csv':
              content = await parseCSV(file)
              break
            case 'text/plain':
            case 'text/markdown':
            default:
              if (file.type.startsWith('text/')) {
                content = await parseText(file)
              } else {
                continue
              }
          }

          parsedFiles.push({
            id: Math.random().toString(36).substring(7),
            name: file.name,
            content
          })
        } catch (error) {
          console.error(`Error processing ${file.name}:`, error)
        }
      }
      
      return parsedFiles
    } finally {
      setIsLoading(false)
    }
  }

  return {
    isLoading,
    parseFiles,
    supportedTypes: ['.pdf', '.docx', '.txt', '.md', '.csv']
  }
}

declare global {
  interface Window {
    pdfjsLib: any
    mammoth: any
    Papa: any
  }
} 