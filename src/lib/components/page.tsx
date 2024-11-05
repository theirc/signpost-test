import { CSSProperties } from "react"
import { AIBot, Blocks, Footer, Header, app } from ".."
import { BrowserRouter, createBrowserRouter, Link, Route, RouterProvider, Routes } from "react-router-dom"
import { Service } from "./service"
import { Categories } from "./categories"
import { Article } from "./article"
import { SearchResults } from "./searchresults"
import { Redirect } from "./redirect"


export function Page() {

  if (app.state.status != "ready") return null
  const styles: CSSProperties = {
    gridTemplateRows: "auto 1fr",
  }

  if (app.page.color) styles.color = app.page.color
  if (app.page.bgcolor) styles.backgroundColor = app.page.bgcolor

  return <div className="grid" style={styles}>
    <BrowserRouter>
      <Header />
      <Routes>
        <Route path="/" element={<Blocks />} />
        <Route path="/:locale/service/:id?" element={<Service />} />
        <Route path="/:locale/article/:id?" element={<Article />} />
        <Route path="/:locale/categories/:categoryid?/:sectionid?" element={<Categories />} />
        <Route path="/signpostbot" element={<AIBot />} />
        <Route path="/:locale/search-results" element={<SearchResults />} />
        <Route path="/:locale/sections/:sectionid" element={<Redirect />} />
      </Routes>
    </BrowserRouter>
  </div>

  // return <div className="h-full" style={styles}>
  //   <BrowserRouter>
  //     <Header />
  //     <Routes>
  //       <Route path="/" element={<Blocks />} />
  //       <Route path="/service/:id?" element={<Service />} />
  //       <Route path="/signpostbot" element={<AIBot />} />
  //     </Routes>
  //   </BrowserRouter>
  // </div>

}

