import { useContext, createContext } from "react"
import { ProtectedRoute } from "./protected-route"

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  config: PageConfig
}

interface PageContextValues extends PageConfig {

}

const PageContext = createContext(null)

export function usePage() {
  return useContext<PageContextValues>(PageContext)
}

export function Page(props: Props) {
  const { config, children } = props
  const { resource, action } = config
  const isProtected = resource && action

  return <PageContext.Provider value={config}>
    <div className="flex flex-col flex-1 p-4 overflow-y-auto min-h-0 h-full" id="page">
      {isProtected && <ProtectedRoute resource={resource} action={action}>{children}</ProtectedRoute>}
      {!isProtected && <>{children}</>}
    </div>
  </PageContext.Provider>
}

export function PageTitle() {
  const page = usePage()
  return <div className="flex flex-col gap-2">
    <div>
      <div className="flex items-center">
        <page.icon className="mr-2" />
        <h1 className="text-2xl font-bold">{page.title}</h1>
      </div>
    </div>
    <div className="text-muted-foreground">{page.description}</div>
  </div>
}

