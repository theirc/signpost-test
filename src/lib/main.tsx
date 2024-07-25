import React, { useEffect } from "react"
import { Page, Splash, useForceUpdate } from "./components"
import { app } from "./app"

export function App() {

  app.reactUpdate = useForceUpdate()
  app.initialize().then(() => { })

  return <React.StrictMode>
    <div className="grid h-full grid-rows-1 grid-cols-1">
      <Splash />
      <Page />
    </div>
  </React.StrictMode >

}

