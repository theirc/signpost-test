import { CSSProperties } from "react"
import { Blocks } from "./blocks"

interface Props {
  children: React.ReactNode
  block?: Block
  className?: string
}

export function Container(props: Props) {

  const { block, className } = props
  const styles = Blocks.buildStyle(block)

  return <div className={`py-16 w-full flex items-center justify-center ${className || ""}`} style={styles}>
    <div className="sm:w-full px-4 md:w-2/3 overflow-auto">
      {props.children}
    </div>
  </div>

}

