import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { } from "./agents"
import { useReducer } from "react"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
export function useForceUpdate() {
  const [, forceUpdate] = useReducer(x => x + 1, 0)
  return forceUpdate
}

export function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}


// export function makeReadeableId(len = 8): string {
//   let text = ""
//   const possible = "BCDFGHJKLMNPQRSTVWXYZ"
//   const possiblev = "AEIOU"
//   let isv = false
//   for (let i = 0; i < len; i++) {
//     if (!isv) {
//       text += possible.charAt(Math.floor(Math.random() * possible.length))
//     } else {
//       text += possiblev.charAt(Math.floor(Math.random() * possiblev.length))
//     }
//     isv = !isv
//   }
//   return text + "_" + new Date().getTime()
// }

