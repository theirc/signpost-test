import Markdown from "react-markdown"
import remarkBreaks from "remark-breaks"
import remarkGfm from "remark-gfm"
import remarkImages from "remark-images"

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


export function ToMarkdown(props: { children: string }) {

  const cleanedValue = cleanMarkdownUrls(props.children || "")

  return <Markdown
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

}