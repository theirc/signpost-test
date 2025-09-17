import { agents } from "@/pages/agents"
import { dev_dtprops } from "@/pages/dev/dtprops"
import { dev_external } from "@/pages/dev/external"
import { logsdev } from "@/pages/dev/logs"
import { Code, Logs, type LucideIcon } from "lucide-react"

export const pages: Record<string, PageConfig> = {
  agents,
  dev_external,
  logsdev,
  dev_dtprops,
}

export const groups = {
  evaluation: { title: "Evaluation (Dev)", icon: Logs },
  knowledged: { title: "Knowledge" },
  settingsd: { title: "Settings" },
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
    path: string
    url: string
    icon: LucideIcon
    component?: React.ComponentType
    group?: keyof typeof groups
    resource?: LiteralUnion<"agents" | "templates" | "playground" | "collections" | "sources" | "logs" | "scores" | "projects" | "teams" | "logs" | "billing" | "usage" | "roles" | "users" | "apikeys" | "models">
    action?: PermissionAction
  }

}

