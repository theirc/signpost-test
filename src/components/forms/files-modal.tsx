import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState, useEffect } from "react"
import { X, ArrowUpDown } from "lucide-react"
import { SourcesTable, type Source } from "@/components/sources-table"

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
export let availableSources: Source[] = [
  { 
    id: '1', 
    name: 'Help Center Articles', 
    type: 'Zendesk', 
    lastUpdated: '2024-02-20',
    tags: ['documentation', 'help', 'user-guide'],
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
    tags: ['documentation', 'technical', 'product'],
    content: `Product Features Overview...`
  }
]

// Function to update available sources
export const updateAvailableSources = (newSources: Source[]) => {
  availableSources = newSources
}

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
  const [currentTags, setCurrentTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState("")
  const [processingProgress, setProcessingProgress] = useState<{current: number, total: number} | null>(null)
  const [processedSources, setProcessedSources] = useState<Source[]>([])
  const [sourceNames, setSourceNames] = useState<{[key: string]: string}>({})

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!open) {
      setUploadedFiles([])
      setProcessedContent("")
      setCurrentTags([])
      setTagInput("")
      setProcessedSources([])
      setSourceNames({})
    }
  }, [open])

  // Handle tag input
  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault()
      if (!currentTags.includes(tagInput.trim())) {
        setCurrentTags([...currentTags, tagInput.trim()])
      }
      setTagInput("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    setCurrentTags(currentTags.filter(tag => tag !== tagToRemove))
  }

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

  // Update handleFileSelect to store processed sources separately
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setUploadedFiles(files)
    setProcessingProgress({ current: 0, total: files.length })
    setProcessedSources([]) // Clear previously processed sources
    setSourceNames({}) // Clear source names
    
    setIsLoading(true)
    try {
      const newSources: Source[] = []
      const newSourceNames: {[key: string]: string} = {}
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        setProcessingProgress({ current: i + 1, total: files.length })
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

        const sourceId = Math.random().toString(36).substring(7)
        // Create new source but don't add to availableSources yet
        const newSource: Source = {
          id: sourceId,
          name: file.name,
          type: 'Files',
          lastUpdated: new Date().toISOString(),
          content: content,
          tags: [...currentTags] // Create a new array to avoid reference issues
        }
        
        newSources.push(newSource)
        newSourceNames[sourceId] = file.name
        setProcessedContent(content)
      }
      setProcessedSources(newSources)
      setSourceNames(newSourceNames)
    } catch (error) {
      console.error('Error processing files:', error)
    } finally {
      setIsLoading(false)
      setProcessingProgress(null)
    }
  }

  // Handle adding processed sources to availableSources
  const handleAddSources = () => {
    if (processedSources.length > 0) {
      // Ensure each source has the current tags and updated names
      const sourcesWithTagsAndNames = processedSources.map(source => ({
        ...source,
        name: sourceNames[source.id] || source.name,
        tags: [...currentTags] // Create a new array with current tags
      }))
      
      // Update available sources
      updateAvailableSources([...availableSources, ...sourcesWithTagsAndNames])
      
      // Clear the form
      setUploadedFiles([])
      setProcessedContent("")
      setCurrentTags([])
      setProcessedSources([])
      setSourceNames({})
    }
  }

  // Handle name change for a source
  const handleNameChange = (sourceId: string, newName: string) => {
    setSourceNames(prev => ({
      ...prev,
      [sourceId]: newName
    }))
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

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="tags" className="text-right">Tags</Label>
                <div className="col-span-3 space-y-2">
                  <Input
                    id="tags"
                    placeholder="Add tags (press Enter)"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagInputKeyDown}
                  />
                  {currentTags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {currentTags.map(tag => (
                        <span 
                          key={tag}
                          className="inline-flex items-center gap-1 bg-muted px-2 py-1 rounded-md text-sm"
                        >
                          {tag}
                          <button
                            onClick={() => removeTag(tag)}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {isLoading && (
            <div className="space-y-2 text-center text-sm text-muted-foreground">
              <div>Processing files...</div>
              {processingProgress && (
                <div>
                  File {processingProgress.current} of {processingProgress.total}
                </div>
              )}
            </div>
          )}

          {/* Show list of processed files with editable names */}
          {processedSources.length > 0 && !isLoading && (
            <div className="space-y-4">
              <Label>Processed Files</Label>
              <div className="space-y-3">
                {processedSources.map((source) => (
                  <div key={source.id} className="grid grid-cols-1 gap-2">
                    <div className="flex items-center gap-4">
                      <Label className="min-w-[80px]">Name:</Label>
                      <Input
                        value={sourceNames[source.id] || source.name}
                        onChange={(e) => handleNameChange(source.id, e.target.value)}
                        className="flex-1"
                      />
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setProcessedContent(source.content)}
                      >
                        Preview
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Content Preview */}
          {processedContent && !isLoading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Content Preview</Label>
                <div className="text-sm text-muted-foreground">
                  {uploadedFiles.length} file(s) processed
                </div>
              </div>
              <div className="bg-muted p-4 rounded-md max-h-[200px] overflow-y-auto">
                <pre className="text-sm whitespace-pre-wrap">
                  {processedContent}
                </pre>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="mt-6">
          <div className="flex justify-between w-full">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <div className="space-x-2">
              <Button 
                variant="default" 
                disabled={isLoading || processedSources.length === 0}
                onClick={handleAddSources}
              >
                Add to Library
              </Button>
              <Button 
                variant="outline" 
                onClick={() => onOpenChange(false)}
              >
                Done
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 