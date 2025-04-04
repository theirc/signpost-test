import MD from "react-markdown"

export function Markdown({ content }: { content: string }) {

  content ||= ""
  content = content.replace(/\\([\\`*_{}\[\]()#+\-.!])/g, "$1")

  return <MD
    components={{
      p(props) {
        const { node, ...rest } = props
        return <p className="mb-4" {...rest} />
      },
      h2(props) {
        const { node, ...rest } = props
        return <h2 className="font-semibold mb-4" {...rest} />
      },
      a(props) {
        const { node, ...rest } = props
        return <a className="text-blue-600" {...rest} />
      }
    }}
  >
    {content}
  </MD>

}

