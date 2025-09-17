import { useContext, createContext } from "react"


interface PageContextValues extends PageConfig {

}

export const PageContext = createContext(null)

export function usePage() {
  return useContext<PageContextValues>(PageContext)
}