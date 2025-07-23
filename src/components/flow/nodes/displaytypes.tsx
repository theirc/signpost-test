import { CoreMessage } from "ai"
import React from "react"
import Markdown from "react-markdown"
import remarkBreaks from "remark-breaks"
import remarkGfm from "remark-gfm"
import remarkImages from "remark-images"

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

// Memoized component to prevent unnecessary re-renders
export const DisplayContent = React.memo<DisplayProps>(({ type, value, className }) => {

  if (value == null || value == "") return <div className={className}>Empty</div>
  if (type == "enum") type = "string"

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

  if (type == "boolean") return <div className={className}>{value ? "True" : "False"}</div>
  if (type == "number") return <div className={className}>{Intl.NumberFormat().format(value || 0)}</div>


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
      const content = typeof msg.content === 'string' ? msg.content : 
        (msg.content[0] && 'text' in msg.content[0] ? msg.content[0].text : '')
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


  if (type == "string" && typeof value === "string") {
    const cleanedValue = cleanMarkdownUrls(value || "")

    return <div className={className}>
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

