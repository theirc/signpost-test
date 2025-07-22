import { useState, useEffect } from 'react'
import Tesseract from 'tesseract.js'
import { supabase } from '../agents/db'
import { ulid } from 'ulid'
import { app } from '../app'
import { generateText } from 'ai'

// CDN URLs for file parsers
const PARSER_CDNS = {
  pdf: "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js",
  pdfWorker: "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js",
  docx: "https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js",
  csv: "https://cdn.jsdelivr.net/npm/papaparse@5.4.1/papaparse.min.js"
}

// Common MIME types and their extensions
const MIME_TYPES = {
  // PDF
  'application/pdf': '.pdf',
  // Word
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'application/msword': '.doc',
  // Text
  'text/plain': '.txt',
  'text/markdown': '.md',
  'text/html': '.html',
  'text/css': '.css',
  'text/javascript': '.js',
  // CSV
  'text/csv': '.csv',
  'application/vnd.ms-excel': '.csv',
  // JSON
  'application/json': '.json',
  // Other common formats
  'application/xml': '.xml',
  'text/xml': '.xml',
  // Images
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/bmp': '.bmp',
  'image/tiff': '.tiff',
  'image/webp': '.webp'
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
  originalPath?: string
}

export function useFileParser() {
  const [isLoading, setIsLoading] = useState(false)

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

  const uploadImageToStorage = async (file: File): Promise<string> => {
    try {
      const fileName = `${ulid()}-${file.name}`
      const { data, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('documents')
        .getPublicUrl(data.path)

      return urlData.publicUrl
    } catch (error) {
      console.error('Image upload error:', error)
      throw new Error(`Failed to upload image: ${error}`)
    }
  }

  const analyzeImageWithVision = async (imageUrl: string, ocrText: string): Promise<string> => {
    try {
      // Get API keys from the current team
      const { selectedTeam } = await import('../hooks/useTeam').then(m => m.useTeamStore.getState())
      if (!selectedTeam) {
        console.warn('No team selected, skipping vision analysis')
        return ocrText
      }

      const apiKeys = await app.fetchAPIkeys(selectedTeam.id)
      const openaiKey = apiKeys.openai

      if (!openaiKey) {
        console.warn('No OpenAI API key found, using OCR text only')
        return ocrText
      }

      // Create OpenAI client
      const { createOpenAI } = await import('@ai-sdk/openai')
      const openai = createOpenAI({ apiKey: openaiKey })
      const model = openai('gpt-4o')

      // Prepare the prompt for vision analysis
      const prompt = `Analyze this image and provide a comprehensive summary. 

If there's any text in the image, I'll provide the OCR-extracted text below. However, OCR can be inaccurate, so please:
1. Describe what you see in the image visually, do not attempt to identify any individuals or personally identifiable information
2. Correct any obvious OCR errors in the text
3. Provide a clear, structured summary of the image content

OCR Text (may contain errors):
${ocrText}

Please provide a detailed summary of this image:`

      // Convert image to base64 for the API call
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result as string)
        reader.readAsDataURL(blob)
      })

      // Call OpenAI vision API directly
      const apiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: prompt
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: base64
                  }
                }
              ]
            }
          ],
          max_tokens: 1000
        })
      })

      const result = await apiResponse.json()
      const text = result.choices?.[0]?.message?.content || ocrText

      return text
    } catch (error) {
      console.error('Vision analysis error:', error)
      // Fallback to OCR text if vision analysis fails
      return ocrText
    }
  }

  const parseImage = async (file: File): Promise<{ text: string; imageUrl: string }> => {
    try {
      // Upload image to storage first
      const imageUrl = await uploadImageToStorage(file)
      
      // Then perform OCR
      const { data } = await Tesseract.recognize(file, 'eng', {})
      const ocrText = data.text.trim()
      
      // Use vision analysis to get better summary
      const visionText = await analyzeImageWithVision(imageUrl, ocrText)
      
      return { text: visionText, imageUrl }
    } catch (error) {
      console.error('Image processing error:', error)
      throw new Error(`Failed to process image: ${error}`)
    }
  }

  // Detect file type based on MIME type or extension
  const detectFileType = (file: File): string => {
    // First try by MIME type
    if (file.type && Object.keys(MIME_TYPES).includes(file.type)) {
      return file.type
    }
    
    // Then try by extension
    const extension = `.${file.name.split('.').pop()?.toLowerCase()}`
    const mimeType = Object.entries(MIME_TYPES).find(([_, ext]) => ext === extension)?.[0]
    
    if (mimeType) return mimeType
    
    // Default to text/plain for unknown types with .txt, .md extensions
    if (['.txt', '.md'].includes(extension)) return 'text/plain'
    
    return file.type || 'application/octet-stream'
  }

  const parseFiles = async (files: File[]): Promise<ParsedFile[]> => {
    if (files.length === 0) return []
    
    setIsLoading(true)
    try {
      const parsedFiles: ParsedFile[] = []
      
      for (const file of files) {
        try {
          let content = ""
          const fileType = detectFileType(file)
          
          // Handle different file types
          if (fileType === 'application/pdf') {
            content = await parsePDF(file)
          } else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
                     fileType === 'application/msword') {
            content = await parseDocx(file)
          } else if (fileType === 'text/csv' || fileType === 'application/vnd.ms-excel') {
            content = await parseCSV(file)
          } else if (fileType.startsWith('text/') || fileType === 'application/json') {
            content = await parseText(file)
          } else if (fileType.startsWith('image/')) {
            const imageResult = await parseImage(file)
            content = `Image URL: ${imageResult.imageUrl}\n\nVision Analysis:\n${imageResult.text}`
          } else {
            console.warn(`Unsupported file type: ${fileType} for file ${file.name}`)
            continue
          }

          // Create parsed file object with original path if available
          const parsedFile: ParsedFile = {
            id: Math.random().toString(36).substring(7),
            name: file.name,
            content
          }
          
          // Add path if available (from folder crawler)
          if ('path' in file) {
            parsedFile.originalPath = (file as any).path
          }

          parsedFiles.push(parsedFile)
        } catch (error) {
          console.error(`Error processing ${file.name}:`, error)
        }
      }
      
      return parsedFiles
    } finally {
      setIsLoading(false)
    }
  }

  // Get all supported file extensions
  const getSupportedExtensions = () => {
    return Object.values(MIME_TYPES)
  }

  // Get file extensions as string for input accept attribute
  const getAcceptString = () => {
    return getSupportedExtensions().join(',')
  }

  return {
    isLoading,
    parseFiles,
    supportedTypes: ['.pdf', '.docx', '.txt', '.md', '.csv', '.json', '.xml', '.html', '.js', '.css', '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.webp'],
    supportedMimeTypes: Object.keys(MIME_TYPES),
    getSupportedExtensions,
    getAcceptString
  }
}

declare global {
  interface Window {
    pdfjsLib: any
    mammoth: any
    Papa: any
  }
} 