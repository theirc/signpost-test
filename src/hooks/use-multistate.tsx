import { useReducer, useRef } from "react"


export function useForceUpdate() {
  const [, forceUpdate] = useReducer(x => x + 1, 0)
  return forceUpdate
}

export function useMultiState<T extends object>(state: T): [state: T, setState: (v: Partial<T>) => void] {

  const stateRef = useRef(state)
  const update = useForceUpdate()

  return [
    stateRef.current,
    (newState: any) => {
      if (!newState || typeof newState != "object") return
      let needUpdate = false
      const state = stateRef.current
      for (const key in newState) {
        const newValue = newState[key]
        const prevValue = state[key]
        if (Object.is(newValue, prevValue) === false) {
          state[key] = newValue
          needUpdate = true
        }
      }
      if (needUpdate) update()
    }
  ]

}