import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState, useEffect } from "react"

// CDN URLs for various file parsers
const READABILITY_CDN = "https://cdnjs.cloudflare.com/ajax/libs/Readability.js/0.4.4/Readability.min.js"
const PDF_JS_CDN = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"
const MAMMOTH_CDN = "https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js"
const DOCX2HTML_CDN = "https://cdn.jsdelivr.net/npm/docx2html@0.1.13/dist/docx2html.min.js"
const CSV_PARSE_CDN = "https://cdn.jsdelivr.net/npm/papaparse@5.4.1/papaparse.min.js"

interface FilesModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

// This would normally be in your backend/database
export let availableSources = [
  { 
    id: '1', 
    name: 'Help Center Articles', 
    type: 'Zendesk', 
    lastUpdated: '2024-02-20',
    content: `How to Reset Your Password
    1. Click on the "Forgot Password" link
    2. Enter your email address
    3. Check your inbox for reset instructions
    4. Click the reset link and create a new password
    
    Common Account Issues
    - Unable to log in
    - Email verification problems
    - Two-factor authentication setup
    - Account recovery options`
  },
  { 
    id: '2', 
    name: 'Product Documentation', 
    type: 'Files', 
    lastUpdated: '2024-02-19',
    content: `Product Features Overview...`
  }
]

// Function to load a script from CDN
const loadScript = (url: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = url
    script.onload = () => resolve()
    script.onerror = () => reject()
    document.head.appendChild(script)
  })
}

export function FilesModal({ open, onOpenChange }: FilesModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [processedContent, setProcessedContent] = useState<string>("")

  // Load required CDNs
  useEffect(() => {
    const loadDependencies = async () => {
      try {
        await Promise.all([
          loadScript(READABILITY_CDN),
          loadScript(PDF_JS_CDN),
          loadScript(MAMMOTH_CDN),
          loadScript(DOCX2HTML_CDN),
          loadScript(CSV_PARSE_CDN)
        ])
      } catch (error) {
        console.error('Error loading dependencies:', error)
      }
    }
    loadDependencies()
  }, [])

  // Function to parse PDF files
  const parsePDF = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = async (e) => {
        try {
          const typedarray = new Uint8Array(e.target?.result as ArrayBuffer)
          const pdf = await (window as any).pdfjsLib.getDocument({ data: typedarray }).promise
          let text = ''
          
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i)
            const content = await page.getTextContent()
            text += content.items.map((item: any) => item.str).join(' ') + '\n'
          }
          
          resolve(text)
        } catch (error) {
          reject(error)
        }
      }
      reader.readAsArrayBuffer(file)
    })
  }

  // Function to parse DOCX files
  const parseDocx = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer
          const result = await (window as any).mammoth.extractRawText({ arrayBuffer })
          resolve(result.value)
        } catch (error) {
          reject(error)
        }
      }
      reader.readAsArrayBuffer(file)
    })
  }

  // Function to parse CSV files
  const parseCSV = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = async (e) => {
        try {
          const csv = e.target?.result as string
          const result = (window as any).Papa.parse(csv, { header: true })
          resolve(JSON.stringify(result.data, null, 2))
        } catch (error) {
          reject(error)
        }
      }
      reader.readAsText(file)
    })
  }

  // Function to parse text files
  const parseText = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target?.result as string)
      reader.onerror = (e) => reject(e)
      reader.readAsText(file)
    })
  }

  // Function to handle file selection
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setUploadedFiles(files)
    
    setIsLoading(true)
    try {
      for (const file of files) {
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
            content = await parseText(file)
            break
          default:
            if (file.type.startsWith('text/')) {
              content = await parseText(file)
            } else {
              console.warn(`Unsupported file type: ${file.type}`)
              continue
            }
        }

        // Add to available sources
        const newSource = {
          id: Math.random().toString(36).substring(7),
          name: file.name,
          type: 'Files',
          lastUpdated: new Date().toISOString(),
          content: content
        }
        
        availableSources = [...availableSources, newSource]
        setProcessedContent(content)
      }
    } catch (error) {
      console.error('Error processing files:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Upload Files</DialogTitle>
          <DialogDescription>
            Upload documents to include in your knowledge base. Supported formats: PDF, DOCX, TXT, MD, CSV
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <div className="grid gap-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="file-upload" className="text-right">Upload</Label>
                <div className="col-span-3">
                  <Input 
                    id="file-upload" 
                    type="file" 
                    className="cursor-pointer" 
                    multiple
                    accept=".pdf,.docx,.txt,.md,.csv"
                    onChange={handleFileSelect}
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>
          </div>

          {isLoading && (
            <div className="text-center text-sm text-muted-foreground">
              Processing files...
            </div>
          )}

          {processedContent && (
            <div className="space-y-2">
              <Label>Preview</Label>
              <div className="bg-muted p-4 rounded-md max-h-[200px] overflow-y-auto">
                <pre className="text-sm whitespace-pre-wrap">
                  {processedContent}
                </pre>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button 
            type="submit" 
            disabled={isLoading || uploadedFiles.length === 0}
            onClick={() => onOpenChange(false)}
          >
            {isLoading ? 'Processing...' : 'Done'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 