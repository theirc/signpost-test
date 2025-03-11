import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState, useEffect } from "react"
import { X, ArrowUpDown, Loader2 } from "lucide-react"
import { SourcesTable, type Source as SourceDisplay } from "@/components/sources-table"
import React from "react"
import { useSources, Source } from "@/hooks/use-sources"
import { useTags } from "@/hooks/use-tags"
import { useSourceTags } from "@/hooks/use-source-tags"

// CDN URLs for various file parsers
const READABILITY_CDN = "https://cdnjs.cloudflare.com/ajax/libs/Readability.js/0.4.4/Readability.min.js"
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

interface FilesModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Helper to convert DB Source to UI SourceDisplay
const mapSourceToDisplay = (source: Source): SourceDisplay => {
  return {
    id: source.id,
    name: source.name,
    type: source.type,
    lastUpdated: source.last_updated || source.created_at,
    content: source.content,
    tags: [] // Tags will be fetched separately
  }
}

export function FilesModal({ open, onOpenChange }: FilesModalProps) {
  // Supabase hooks
  const { sources, addSource, loading: sourcesLoading, error: sourcesError } = useSources()
  const { tags, addTag, loading: tagsLoading } = useTags()
  const { addTagToSource } = useSourceTags()

  // Local state
  const [isLoading, setIsLoading] = useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [processedContent, setProcessedContent] = useState<string>("")
  const [currentTags, setCurrentTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState("")
  const [processingProgress, setProcessingProgress] = useState<{current: number, total: number} | null>(null)
  const [processedSources, setProcessedSources] = useState<{
    id: string;
    name: string;
    content: string;
    url?: string;
  }[]>([])
  const [sourceNames, setSourceNames] = useState<{[key: string]: string}>({})

  // Flag to track if dependencies are loaded
  const [dependenciesLoaded, setDependenciesLoaded] = useState(false);

  // Function to load all required dependencies
  const loadDependencies = async () => {
    try {
      console.log("Loading dependencies for file processing...");
      await Promise.all([
        loadScript(READABILITY_CDN),
        loadScript(PDF_JS_CDN),
        loadScript(MAMMOTH_CDN),
        loadScript(CSV_PARSE_CDN)
      ]);
      console.log("All dependencies loaded successfully");
      setDependenciesLoaded(true);
      return true;
    } catch (error) {
      console.error("Error loading dependencies:", error);
      return false;
    }
  };

  // Load required CDNs
  useEffect(() => {
    if (!open) return;
    
    const loadDependencies = async () => {
      try {
        setIsLoading(true);
        
        // Load scripts sequentially to avoid race conditions
        await loadScript(PDF_JS_CDN);
        await loadScript(PDF_WORKER_CDN);
        await loadScript(MAMMOTH_CDN);
        await loadScript(CSV_PARSE_CDN);
        
        setDependenciesLoaded(true);
      } catch (error) {
        console.error('Error loading dependencies:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDependencies();
  }, [open]);

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

  // Function to parse PDF files
  const parsePDF = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!window.pdfjsLib) {
        reject(new Error("PDF.js library not loaded"));
        return;
      }
      
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const typedarray = new Uint8Array(e.target?.result as ArrayBuffer);
          const pdf = await window.pdfjsLib.getDocument({ data: typedarray }).promise;
          
          let text = '';
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            text += content.items.map((item: any) => item.str).join(' ') + '\n';
          }
          
          resolve(text);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  };

  // Function to parse DOCX files
  const parseDocx = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!window.mammoth) {
        reject(new Error("Mammoth library not loaded"));
        return;
      }
      
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          const result = await window.mammoth.extractRawText({ arrayBuffer });
          resolve(result.value);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  };

  // Function to parse CSV files
  const parseCSV = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!window.Papa) {
        reject(new Error("Papa Parse library not loaded"));
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const csv = e.target?.result as string;
          const result = window.Papa.parse(csv, {
            header: true,
            skipEmptyLines: true
          });
          
          // Format the parsed data in a more readable way
          const formattedData = result.data.map((row: any) => {
            // Clean up each value in the row
            const cleanRow = Object.fromEntries(
              Object.entries(row).map(([key, value]) => {
                // If value is a string that looks like JSON, try to parse it
                if (typeof value === 'string' && (value.startsWith('{') || value.startsWith('['))) {
                  try {
                    return [key, JSON.parse(value)]
                  } catch {
                    return [key, value]
                  }
                }
                return [key, value]
              })
            )
            return cleanRow
          });

          resolve(JSON.stringify(formattedData, null, 2));
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  // Function to parse text files
  const parseText = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target?.result as string)
      reader.onerror = (e) => reject(e)
      reader.readAsText(file)
    })
  }

  // Separate handler for button click
  const handleProcessButtonClick = () => {
    if (fileInputRef.current?.files?.length) {
      // Convert FileList to Array for processing
      const files = Array.from(fileInputRef.current.files);
      processFiles(files);
    }
  };

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      const files = Array.from(e.target.files);
      console.log(`${files.length} files selected`);
    }
  };

  // Process the selected files
  const processFiles = async (files: File[]) => {
    // Load required dependencies
    if (!dependenciesLoaded) {
      await loadDependencies();
    }
    
    console.log("Files selected:", files.map(f => ({ name: f.name, type: f.type, size: f.size })));
    
    if (!dependenciesLoaded) {
      console.error("Dependencies not loaded yet");
      return;
    }
    
    if (files.length === 0) {
      console.log("No files selected");
      return;
    }
    
    setUploadedFiles(files)
    setProcessingProgress({ current: 0, total: files.length })
    setProcessedSources([])
    setSourceNames({})
    
    setIsLoading(true)
    try {
      const newSources: {
        id: string;
        name: string;
        content: string;
        url?: string;
      }[] = []
      const newSourceNames: {[key: string]: string} = {}
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        console.log(`Processing file ${i+1}/${files.length}: ${file.name}`);
        setProcessingProgress({ current: i + 1, total: files.length })
        let content = ""
        
        try {
          switch (file.type) {
            case 'application/pdf':
              console.log(`Parsing PDF: ${file.name}`);
              content = await parsePDF(file)
              break
            case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
              console.log(`Parsing DOCX: ${file.name}`);
              content = await parseDocx(file)
              break
            case 'text/csv':
              console.log(`Parsing CSV: ${file.name}`);
              content = await parseCSV(file)
              break
            case 'text/plain':
            case 'text/markdown':
              console.log(`Parsing text file: ${file.name}`);
              content = await parseText(file)
              break
            default:
              if (file.type.startsWith('text/')) {
                console.log(`Parsing generic text file: ${file.name}`);
                content = await parseText(file)
              } else {
                console.warn(`Unsupported file type: ${file.type} for file ${file.name}`)
                continue
              }
          }
          console.log(`Successfully parsed file: ${file.name}, content length: ${content.length}`);
        } catch (error) {
          console.error(`Error parsing file ${file.name}:`, error);
          continue; // Skip this file and move to next
        }

        // Upload file to storage and get URL
        console.log(`Processing file: ${file.name}`);
        try {
          // Skip file upload - we're just processing content
          // const fileUrl = await uploadFile(file);
          // console.log(`File uploaded successfully, URL: ${fileUrl}`);
          
          const sourceId = Math.random().toString(36).substring(7)
          // Create new source for processing
          const newSource = {
            id: sourceId,
            name: file.name,
            content: content,
            // No URL since we're not uploading
            // url: fileUrl
          }
          
          newSources.push(newSource)
          newSourceNames[sourceId] = file.name
          setProcessedContent(content)
          console.log(`Added source to processed list: ${file.name} with ID ${sourceId}`);
        } catch (uploadError) {
          console.error(`Error processing file ${file.name}:`, uploadError);
        }
      }
      
      setProcessedSources(newSources)
      console.log("All files processed. Total sources:", newSources.length);
      setSourceNames(newSourceNames)
    } catch (error) {
      console.error('Error processing files:', error)
    } finally {
      setIsLoading(false)
      setProcessingProgress(null)
    }
  }

  // Updated to add sources to Supabase
  const handleAddSources = async () => {
    if (processedSources.length > 0) {
      console.log("Adding sources to Supabase:", processedSources.length);
      setIsLoading(true)
      
      try {
        // First, ensure all tags exist in the database
        const tagIds: Record<string, string> = {}
        
        console.log("Ensuring tags exist:", ['File Upload', ...currentTags]);
        for (const tagName of ['File Upload', ...currentTags]) {
          const existingTag = tags.find(t => t.name.toLowerCase() === tagName.toLowerCase())
          
          if (existingTag) {
            console.log(`Tag already exists: ${tagName} with ID ${existingTag.id}`);
            tagIds[tagName] = existingTag.id
          } else {
            console.log(`Creating new tag: ${tagName}`);
            const newTag = await addTag(tagName)
            if (newTag) {
              console.log(`New tag created: ${tagName} with ID ${newTag.id}`);
              tagIds[tagName] = newTag.id
            } else {
              console.error(`Failed to create tag: ${tagName}`);
            }
          }
        }
        
        // Add each source to the database
        for (const source of processedSources) {
          // Get the custom name or fallback to original name
          const customName = sourceNames[source.id] && sourceNames[source.id].trim() !== '' 
            ? sourceNames[source.id] 
            : source.name;
            
          console.log(`Adding source to database: ${customName} (original: ${source.name})`);
          
          const sourceData = {
            name: customName,
            type: 'File',
            content: source.content,
            // Include the file extension, "File" tag and any user-added tags
            tags: JSON.stringify(['File', ...currentTags, source.name.split('.').pop() || ''])
              .replace(/"/g, '')
              .replace('[', '{')
              .replace(']', '}')
          }
          
          console.log("Source data:", { 
            name: sourceData.name, 
            type: sourceData.type, 
            contentLength: sourceData.content.length
          });
          
          // Add source to database
          try {
            const newSource = await addSource(sourceData)
            
            if (newSource) {
              console.log(`Source added successfully: ID ${newSource.id}`);
            } else {
              console.error(`Failed to add source: ${sourceData.name}`);
            }
          } catch (sourceError) {
            console.error(`Error adding source to database:`, sourceError);
          }
        }
        
        console.log("All sources added successfully.");
        
        // Clear the form
        setUploadedFiles([])
        setProcessedContent("")
        setCurrentTags([])
        setProcessedSources([])
        setSourceNames({})
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
        
        // Close modal
        onOpenChange(false)
      } catch (error) {
        console.error('Error adding sources:', error)
      } finally {
        setIsLoading(false)
      }
    } else {
      console.log("No processed sources to add.");
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
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Process Files</DialogTitle>
          <DialogDescription>
            Extract content from files to create new knowledge sources.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <div className="space-y-8">
            <div className="space-y-2">
              <Label>Files</Label>
              <Input
                id="files"
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".pdf,.docx,.txt,.md,.csv"
                multiple
              />
              <p className="text-sm text-muted-foreground">
                Supported formats: PDF, DOCX, TXT, MD, CSV
              </p>
            </div>

            <div className="space-y-2">
              <Label>Process & Tags</Label>
              <div className="flex gap-4">
                <Button 
                  variant="secondary" 
                  onClick={handleProcessButtonClick}
                  disabled={!fileInputRef.current || !fileInputRef.current.files || fileInputRef.current.files.length === 0}
                  className="shrink-0"
                >
                  <ArrowUpDown className="h-4 w-4 mr-2" />
                  Process Files
                </Button>
                
                <div className="flex-1 space-y-2">
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

          {processedSources.length > 0 && !isLoading && (
            <div className="mt-8 space-y-4 p-4 border rounded-md bg-muted/30">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Name Your Sources</h3>
                <p className="text-sm text-muted-foreground">
                  Give each source a descriptive name before adding to your knowledge base.
                </p>
              </div>
              <div className="space-y-4 mt-3">
                {processedSources.map((source) => (
                  <div key={source.id} className="grid grid-cols-1 gap-1 bg-card p-3 rounded-md">
                    <Label className="mb-1">Source Name:</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        value={sourceNames[source.id] || source.name}
                        onChange={(e) => handleNameChange(source.id, e.target.value)}
                        className="flex-1"
                        placeholder="Enter a descriptive name"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Original file: {source.name}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Content Preview */}
          {processedContent && !isLoading && (
            <div className="mt-8 space-y-2">
              <div className="flex items-center justify-between">
                <Label>Content Preview</Label>
                <div className="text-sm text-muted-foreground">
                  {uploadedFiles.length} file(s) processed
                </div>
              </div>
              <div className="bg-muted p-4 rounded-md min-h-[200px] max-h-[400px] overflow-y-auto">
                <pre className="text-sm font-mono whitespace-pre-wrap break-words" style={{ maxWidth: '100%' }}>
                  {processedContent}
                </pre>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="mt-6 border-t pt-4">
          <div className="flex justify-between w-full items-center">
            <div className="flex items-center gap-2">
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {isLoading && <span>Processing...</span>}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              {processedSources.length > 0 && !isLoading && (
                <Button onClick={handleAddSources}>Add {processedSources.length} Source{processedSources.length > 1 ? 's' : ''} to Knowledge Base</Button>
              )}
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Add this export to maintain compatibility with existing imports
// This can be removed once all imports are updated to use Supabase hooks
export const availableSources: any[] = [];

// Update the function definition to accept but ignore the argument
export const updateAvailableSources = (_sources?: any) => {};

// Add TypeScript global declarations
declare global {
  interface Window {
    pdfjsLib: any;
    mammoth: any;
    Papa: any;
  }
} 