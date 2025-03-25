import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, FolderOpen, File as FileIcon, CheckCircle } from "lucide-react"
import { useFileParser } from "@/hooks/use-file-parser"
import { useSourceUpload } from "@/hooks/use-source-upload"

// TypeScript declarations for File System Access API
declare global {
  interface Window {
    showDirectoryPicker: (options?: {
      id?: string;
      mode?: 'read' | 'readwrite';
      startIn?: 'desktop' | 'documents' | 'downloads' | 'music' | 'pictures' | 'videos';
    }) => Promise<FileSystemDirectoryHandle>;
  }
  
  interface FileSystemDirectoryHandle {
    values(): AsyncIterable<FileSystemHandle>;
    readonly kind: 'directory';
    readonly name: string;
  }
  
  interface FileSystemFileHandle {
    readonly kind: 'file';
    readonly name: string;
    getFile(): Promise<File>;
  }
}

interface FileWithPath extends File {
  path: string;
}

interface FolderCrawlerProps {
  onSourcesUpdated: () => void
  onComplete: () => void
}

export function FolderCrawler({ onSourcesUpdated, onComplete }: FolderCrawlerProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isCrawling, setIsCrawling] = useState(false)
  const [foundFiles, setFoundFiles] = useState<FileWithPath[]>([])
  const [selectedFiles, setSelectedFiles] = useState<FileWithPath[]>([])
  const [fileExtensions, setFileExtensions] = useState(".pdf,.docx,.txt,.md")
  const [processingStatus, setProcessingStatus] = useState<string>("")
  const [processedCount, setProcessedCount] = useState(0)
  
  const { parseFiles, supportedTypes } = useFileParser()
  const { handleProcessedFiles, uploadSources } = useSourceUpload()

  // Function to recursively read a directory
  const crawlDirectory = async (dirHandle: FileSystemDirectoryHandle, path = "") => {
    setIsCrawling(true)
    const extensions = fileExtensions.split(",").map(ext => ext.trim().toLowerCase())
    const files: FileWithPath[] = []

    try {
      // Process all entries in the directory
      for await (const entry of dirHandle.values()) {
        const entryPath = path ? `${path}/${entry.name}` : entry.name
        
        if (entry.kind === "file") {
          // Check if file has a supported extension
          const fileExt = `.${entry.name.split('.').pop()?.toLowerCase()}`
          if (extensions.includes(fileExt) || extensions.includes("*")) {
            const fileHandle = entry as FileSystemFileHandle
            const file = await fileHandle.getFile()
            // Create a File object with the proper path information
            const fileWithPath = file as FileWithPath
            fileWithPath.path = entryPath
            files.push(fileWithPath)
          }
        } else if (entry.kind === "directory") {
          // Recursively process subdirectories
          setProcessingStatus(`Scanning folder: ${entryPath}`)
          const subFiles = await crawlDirectory(entry as FileSystemDirectoryHandle, entryPath)
          files.push(...subFiles)
        }
      }
    } catch (error) {
      console.error("Error crawling directory:", error)
    }

    setIsCrawling(false)
    return files
  }

  // Handle directory selection
  const handleSelectDirectory = async () => {
    try {
      // Request directory access with minimal restrictions
      const dirHandle = await window.showDirectoryPicker({
        mode: 'read',
        // Remove the startIn option to let user choose any accessible folder
      })

      setIsLoading(true)
      setFoundFiles([])
      setProcessingStatus("Starting folder scan...")
      
      // Crawl the directory recursively
      const files = await crawlDirectory(dirHandle)
      setFoundFiles(files)
      setSelectedFiles(files) // Select all files by default
      
      setProcessingStatus(`Found ${files.length} files`)
    } catch (error) {
      if (error instanceof Error) {
        console.error("Error selecting directory:", error)
        if (error.name === 'AbortError') {
          setProcessingStatus("Directory selection canceled")
        } else if (error.message?.includes('system files')) {
          setProcessingStatus("Can't access system folders. Please choose a different folder.")
        } else {
          setProcessingStatus(`Error: ${error.message || "Could not access folder"}`)
        }
      } else {
        setProcessingStatus("Directory selection canceled")
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Handle file selection
  const toggleFileSelection = (file: FileWithPath) => {
    setSelectedFiles(prev => 
      prev.some(f => f.path === file.path)
        ? prev.filter(f => f.path !== file.path)
        : [...prev, file]
    )
  }

  // Handle "Select All" checkbox
  const handleSelectAll = (checked: boolean) => {
    setSelectedFiles(checked ? [...foundFiles] : [])
  }

  // Import selected files
  const importSelectedFiles = async () => {
    if (selectedFiles.length === 0) return
    
    setIsLoading(true)
    setProcessingStatus("Parsing files...")
    setProcessedCount(0)
    
    try {
      // Parse files in batches to prevent UI blocking
      const batchSize = 5
      for (let i = 0; i < selectedFiles.length; i += batchSize) {
        const batch = selectedFiles.slice(i, i + batchSize)
        
        // Parse the current batch
        setProcessingStatus(`Parsing files ${i+1}-${Math.min(i+batchSize, selectedFiles.length)} of ${selectedFiles.length}...`)
        const parsedFiles = await parseFiles(batch)
        
        // Process parsed content
        setProcessingStatus(`Processing files ${i+1}-${Math.min(i+batchSize, selectedFiles.length)} of ${selectedFiles.length}...`)
        await handleProcessedFiles(parsedFiles)
        
        setProcessedCount(prev => prev + batch.length)
      }
      
      // Actually upload the sources to the database
      setProcessingStatus(`Uploading ${processedCount} files to database...`)
      const success = await uploadSources()
      
      if (success) {
        // Notify parent component that sources have been updated
        onSourcesUpdated()
        setProcessingStatus(`Successfully imported ${processedCount} files`)
        
        // Reset state after successful import
        setTimeout(() => {
          setFoundFiles([])
          setSelectedFiles([])
          onComplete()
        }, 2000)
      } else {
        setProcessingStatus("Error: Failed to upload files to database")
      }
    } catch (error) {
      console.error("Error importing files:", error)
      setProcessingStatus(`Error importing files: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Supported file types</Label>
        <Input 
          value={fileExtensions} 
          onChange={(e) => setFileExtensions(e.target.value)} 
          placeholder=".pdf,.docx,.txt,.md"
        />
        <p className="text-xs text-muted-foreground">
          Enter comma-separated file extensions (e.g., .pdf,.docx,.txt) or * for all files
        </p>
      </div>
      
      <Button 
        onClick={handleSelectDirectory} 
        className="w-full"
        disabled={isLoading || isCrawling}
      >
        {isLoading || isCrawling ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <FolderOpen className="mr-2 h-4 w-4" />
        )}
        Select Folder to Import
      </Button>
      
      {processingStatus && (
        <div className="bg-secondary/30 p-2 rounded text-sm text-center">
          {processingStatus}
        </div>
      )}
      
      {foundFiles.length > 0 && (
        <div className="border rounded-md">
          <div className="flex items-center justify-between p-2 border-b bg-muted/50">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="select-all" 
                checked={selectedFiles.length === foundFiles.length}
                onCheckedChange={handleSelectAll}
              />
              <Label htmlFor="select-all" className="text-sm font-medium">
                Select All ({foundFiles.length} files)
              </Label>
            </div>
            <span className="text-sm text-muted-foreground">
              {selectedFiles.length} selected
            </span>
          </div>
          
          <div className="max-h-60 overflow-y-auto">
            {foundFiles.map((file, index) => (
              <div 
                key={index} 
                className="flex items-center p-2 hover:bg-muted/50 border-b last:border-0"
              >
                <Checkbox 
                  id={`file-${index}`}
                  checked={selectedFiles.some(f => f.path === file.path)}
                  onCheckedChange={() => toggleFileSelection(file)}
                  className="mr-2"
                />
                <Label htmlFor={`file-${index}`} className="flex items-center cursor-pointer flex-1">
                  <FileIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span className="text-sm truncate">{file.path}</span>
                </Label>
                <span className="text-xs text-muted-foreground">
                  {(file.size / 1024).toFixed(1)} KB
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {foundFiles.length > 0 && (
        <Button 
          onClick={importSelectedFiles} 
          disabled={selectedFiles.length === 0 || isLoading}
          className="w-full"
          variant="default"
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle className="mr-2 h-4 w-4" />
          )}
          Import {selectedFiles.length} Selected Files
        </Button>
      )}
    </div>
  )
} 