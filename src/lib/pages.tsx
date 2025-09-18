import { PageContext } from "@/components/page/hooks"
import { ContextualPage } from "@/components/page/pagecontext"
import { agents } from "@/pages/agents"
import { dev_dtprops } from "@/pages/dev/dtprops"
import { dev_external } from "@/pages/dev/external"
import { logsdev } from "@/pages/dev/logs"
import { models } from "@/pages/dev/models"
import { models_crud } from "@/pages/dev/models/model"
import { Code, Logs, Settings, Settings2, type LucideIcon } from "lucide-react"

export const pages: Record<string, PageConfig> = {
  agents,
  dev_external,
  logsdev,
  dev_dtprops,
  models,
  models_crud,
}

// for (const key in pages) {
//   const page = pages[key]
//   page.component = <ContextualPage config={page}><page.component /></ContextualPage> as any
// }


export const groups = {
  evaluation: { title: "Evaluation (Dev)", icon: Logs },
  knowledge: { title: "Knowledge" },
  settings: { title: "Settings (Dev)", icon: Settings2 },
  dev: { title: "Dev", icon: Code },
} satisfies Record<string, Group>

declare global {

  type PermissionAction = 'create' | 'read' | 'update' | 'delete' | 'share'

  interface Group {
    title: string
    icon?: LucideIcon
  }

  interface PageConfig {
    title: string
    description?: string
    route: string
    url?: string
    icon?: LucideIcon
    component?: React.ComponentType
    group?: keyof typeof groups
    resource?: LiteralUnion<"agents" | "templates" | "playground" | "collections" | "sources" | "logs" | "scores" | "projects" | "teams" | "logs" | "billing" | "usage" | "roles" | "users" | "apikeys" | "models">
    action?: PermissionAction
  }

}

