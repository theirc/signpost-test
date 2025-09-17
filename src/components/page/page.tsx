import { ProtectedRoute } from "../protected-route"
import { PageContext } from "./hooks"

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  config: PageConfig
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

