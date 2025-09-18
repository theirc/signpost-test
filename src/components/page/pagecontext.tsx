import { useTeamStore } from "@/lib/hooks/useTeam"
import { ProtectedRoute } from "../protected-route"
import { PageContext } from "./hooks"
import { useNavigate, useParams } from "react-router-dom"
import { useUser } from "@/lib/hooks/useUser"

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  config: PageConfig
}

export function ContextualPage(props: Props) {

  const { config, children } = props
  const { resource, action } = config

  let { id } = useParams()
  const { selectedTeam } = useTeamStore()
  const user = useUser()
  const navigate = useNavigate()


  if (id === "new") id = null

  const value: PageContextValues = {
    config,
    id,
    navigate,
    team: selectedTeam,
    user: user as any,
  }

  const isProtected = resource && action

  return <PageContext.Provider value={value}>
    {isProtected && <ProtectedRoute resource={resource} action={action}>{children}</ProtectedRoute>}
    {!isProtected && <>{children}</>}
  </PageContext.Provider>
}

