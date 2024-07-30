import { CSSProperties } from "react"
import { Blocks } from "./blocks"
import { languages } from "../locale"
import {app} from "../app";

interface Props {
  children: React.ReactNode
  block?: Block
  className?: string
}

export function Container(props: Props) {

  const { block, className } = props
  const styles = Blocks.buildStyle(block)
  const isRTL = languages[app.locale]?.rtl;

  return  <div className={`py-8 sm:py-12 md:py-16 w-full flex items-center justify-center ${className || ""} ${isRTL ? "rtl" : ""}`} 
  style={styles}
>
  <div className="w-full px-4 sm:px-6 md:px-8 max-w-7xl mx-auto">
      {props.children}
    </div>
  </div>

}
