import { CoreMessage } from "ai"
import React from "react"
import Markdown from "react-markdown"
import remarkBreaks from "remark-breaks"
import remarkGfm from "remark-gfm"
import remarkImages from "remark-images"
import { Button } from "@/components/ui/button"
import { Download, File, Copy, Check } from "lucide-react"
import { useState } from "react"

interface DisplayProps {
  type: IOTypes
  value: any
  className?: string
}

// Function to clean up malformed URLs in markdown content
function cleanMarkdownUrls(content: string): string {
  if (!content || typeof content !== 'string') return content

  // Fix URLs with escaped backslashes and trailing spaces
  return content.replace(
    /!\[([^\]]*)\]\(([^)]*%5C[^)]*)\s*\)/g,
    (match, altText, url) => {
      // Remove %5C (escaped backslash) and trim spaces
      const cleanUrl = url.replace(/%5C/g, '/').trim()
      return `![${altText}](${cleanUrl})`
    }
  )
}

// Function to handle blob/file downloads
const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// Function to check if value is a blob-like object
const isBlobLike = (value: any): boolean => {
  return value && (
    value instanceof Blob ||
    (typeof value === 'object' && value.type && value.size) ||
    (typeof value === 'string' && value.startsWith('blob:')) ||
    (typeof value === 'string' && value.startsWith('data:')) ||
    (typeof value === 'object' && value.blob) ||
    (typeof value === 'object' && value.file)
  )
}

// Copy button component
const CopyButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy text:', err)
    }
  }

  return (
    <Button
      onClick={handleCopy}
      size="sm"
      variant="ghost"
      className="absolute top-1 right-1 h-6 w-6 p-0 opacity-30 hover:opacity-100"
      title="Copy to clipboard"
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
    </Button>
  )
}

// Memoized component to prevent unnecessary re-renders
export const DisplayContent = React.memo<DisplayProps>(({ type, value, className }) => {

  if (value == null || value == "") return <div className={className}>Empty</div>
  if (type == "enum") type = "string"

  // Handle blob/file downloads
  if (isBlobLike(value)) {
    let blob: Blob
    let filename = "download"
    
    if (value instanceof Blob) {
      blob = value
      // Try to get filename from blob type or generate one
      const extension = blob.type.split('/')[1] || 'bin'
      filename = `file.${extension}`
    } else if (typeof value === 'object' && value.blob) {
      // Handle objects with a blob property
      blob = value.blob
      filename = value.filename || value.name || `file.${blob.type.split('/')[1] || 'bin'}`
    } else if (typeof value === 'object' && value.file) {
      // Handle objects with a file property
      blob = value.file
      filename = value.filename || value.name || `file.${blob.type.split('/')[1] || 'bin'}`
    } else if (typeof value === 'object' && value.type && value.size) {
      // Handle blob-like objects
      blob = new Blob([value], { type: value.type })
      const extension = value.type.split('/')[1] || 'bin'
      filename = `file.${extension}`
    } else if (typeof value === 'string' && (value.startsWith('blob:') || value.startsWith('data:'))) {
      // Handle blob/data URLs - show download button that will handle the URL
      return (
        <div className={className}>
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-gray-50">
            <div className="flex items-center space-x-3">
              <File className="h-8 w-8 text-blue-500" />
              <div>
                <p className="font-medium text-gray-900">File from URL</p>
                <p className="text-sm text-gray-500">Click download to save file</p>
              </div>
            </div>
            <Button
              onClick={() => {
                const link = document.createElement('a')
                link.href = value
                link.download = 'download'
                document.body.appendChild(link)
                link.click()
                document.body.removeChild(link)
              }}
              className="flex items-center space-x-2"
              variant="outline"
            >
              <Download className="h-4 w-4" />
              <span>Download</span>
            </Button>
          </div>
        </div>
      )
    } else {
      return <div className={className}>Invalid blob data</div>
    }

    return (
      <div className={className}>
        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-gray-50">
          <div className="flex items-center space-x-3">
            <File className="h-8 w-8 text-blue-500" />
            <div>
              <p className="font-medium text-gray-900">{filename}</p>
              <p className="text-sm text-gray-500">
                {blob.type} • {(blob.size / 1024).toFixed(1)} KB
              </p>
            </div>
          </div>
          <Button
            onClick={() => downloadBlob(blob, filename)}
            className="flex items-center space-x-2"
            variant="outline"
          >
            <Download className="h-4 w-4" />
            <span>Download</span>
          </Button>
        </div>
      </div>
    )
  }

  if (type == "doc") {
    type = "string"
    if (!Array.isArray(value)) value = []

    value = ((value as VectorDocument[]) || []).map((doc, i) => {
      if (!doc || typeof doc !== "object") return ""
      return `
## ${doc.title}

${doc.body}

[${doc.title}](${doc.source})  

---
`}).join("\n\n")
  }

  if (type == "boolean") {
    const text = value ? "True" : "False"
    return <div className={`${className} relative`}>
      <CopyButton text={text} />
      {text}
    </div>
  }
  
  if (type == "number") {
    const text = Intl.NumberFormat().format(value || 0)
    return <div className={`${className} relative`}>
      <CopyButton text={text} />
      {text}
    </div>
  }


  if (type == "number[]") {
    if (!Array.isArray(value)) value = []
    type = "string"
    value = (value as number[]).map((n, i) => Intl.NumberFormat().format(n || 0)).join("\n\n")
  }

  if (type == "string[]") {
    type = "string"
    if (!Array.isArray(value)) value = []
    value = ((value || []) as string[]).join("\n\n")
  }

  if (type == "chat") {
    type = "string"
    if (!Array.isArray(value)) value = []
    value = ((value || []) as CoreMessage[]).map((msg, i) => {
      const role = msg.role == "user" ? "User" : "AI"
      let content = ""
      if (typeof msg.content === 'string') {
        content = msg.content
      } else if (Array.isArray(msg.content) && msg.content.length > 0) {
        content = (msg.content[0] as any)?.text || 'Empty'
      }
      return `## ${role} 
      ${content}`
    }).join("\n\n")
  }


  if (type == "json") {
    type = "string"
    value = "```json" + "\n" + JSON.stringify(value, null, 2) + "\n" + "```"
  }

  if (type == "date") {
    type = "string"
    value = value?.toLocaleString() || "Empty"
  }

  if (type == "file") {
    // Handle file type from document generators and other file outputs
    if (value && typeof value === 'object') {
      const { buffer, mimeType, filename, content, type: fileType } = value
      
      if (buffer && mimeType) {
        // Create blob from buffer
        const blob = new Blob([buffer], { type: mimeType })
        const displayFilename = filename || `file.${mimeType.split('/')[1] || 'bin'}`
        
        return (
          <div className={className}>
            <div className="flex items-center justify-between p-2 border border-gray-200 rounded bg-gray-100 my-2">
              <div className="flex items-center space-x-3">
                <File className="h-6 w-6 text-gray-600" />
                <div>
                  <p className="font-medium text-gray-900">{displayFilename}</p>
                  <p className="text-sm text-gray-600">
                    {mimeType} • {(blob.size / 1024).toFixed(1)} KB
                  </p>
                  {content && (
                    <p className="text-xs text-gray-500 mt-1">
                      Content preview: {content.substring(0, 100)}...
                    </p>
                  )}
                </div>
              </div>
              <Button
                onClick={() => downloadBlob(blob, displayFilename)}
                className="flex items-center space-x-2"
                variant="outline"
                size="sm"
              >
                <Download className="h-4 w-4" />
                <span>Download</span>
              </Button>
            </div>
          </div>
        )
      }
    }
    
    return (
      <div className={className}>
        <div className="p-2 border border-gray-200 rounded bg-gray-100 my-2">
          <p className="text-gray-600">File data (use download button above to save)</p>
          <pre className="mt-2 text-xs bg-white p-2 rounded overflow-auto">
            {JSON.stringify(value, null, 2)}
          </pre>
        </div>
      </div>
    )
  }


  if (type == "string" && typeof value === "string") {
    const cleanedValue = cleanMarkdownUrls(value || "")

    return <div className={`${className} relative`}>
      <CopyButton text={cleanedValue} />
      <Markdown
        components={{
          h1: ({ node, ...rest }) => <h1 className="font-semibold my-2" {...rest} />,
          h2: ({ node, ...rest }) => <h2 className="font-semibold my-2" {...rest} />,
          h3: ({ node, ...rest }) => <h3 className="font-semibold my-2" {...rest} />,
          a: ({ node, ...rest }) => <a className="text-blue-600 hover:underline" {...rest} />,
          hr: ({ node, ...rest }) => <hr className="my-2 border-t border-gray-300" {...rest} />,
          img: ({ node, ...props }) => (
            <img
              className="max-w-full h-auto my-2 rounded"
              {...props}
              alt={props.alt || ''}
              loading="lazy"
              onError={(e) => {
                console.error('Image failed to load:', props.src)
                e.currentTarget.style.display = 'none'
              }}
            />
          ),
          p: ({ node, ...rest }) => <p className="my-2" {...rest} />,
          ul: ({ node, ...rest }) => <ul className="list-disc list-inside my-2" {...rest} />,
          ol: ({ node, ...rest }) => <ol className="list-decimal list-inside my-2" {...rest} />,
          li: ({ node, ...rest }) => <li className="ml-4" {...rest} />,
          blockquote: ({ node, ...rest }) => (
            <blockquote className="border-l-4 border-gray-300 pl-4 my-2 italic" {...rest} />
          ),
          code: ({ node, ...props }: any) => {
            const inline = !node?.position
            return inline
              ? <code className="bg-gray-100 px-1 py-0.5 rounded text-sm" {...props} />
              : <code className="block bg-gray-100 p-2 rounded my-2 overflow-x-auto" {...props} />
          },
          pre: ({ node, ...rest }) => <pre className="bg-gray-100 p-2 rounded my-2 overflow-x-auto" {...rest} />,
          table: ({ node, ...rest }) => <table className="border-collapse border border-gray-300 my-2" {...rest} />,
          th: ({ node, ...rest }) => <th className="border border-gray-300 px-2 py-1 bg-gray-100" {...rest} />,
          td: ({ node, ...rest }) => <td className="border border-gray-300 px-2 py-1" {...rest} />,
        }}
        remarkPlugins={[remarkGfm, remarkBreaks, remarkImages]}
      >{cleanedValue}</Markdown>
    </div>
  }


  return <div className={className}>
    <pre className="bg-gray-100 p-2 rounded my-2 overflow-x-auto">Unsupported Type</pre>
  </div>



}, (prevProps, nextProps) => {
  return prevProps.type == nextProps.type && prevProps.value == nextProps.value
})

