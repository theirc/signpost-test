import { agents } from "@/pages/agents"
import { dev_dtprops } from "@/pages/dev/dtprops"
import { dev_external } from "@/pages/dev/external"
import { dev_external_supa } from "@/pages/dev/externalquery"
import { Code, type LucideIcon } from "lucide-react"

export const pages = {
  agents,
  dev_external,
  dev_external_supa,
  dev_dtprops,
}

export const groups = {
  evaluation: { title: "Evaluation" },
  knowledge: { title: "Knowledge" },
  settings: { title: "Settings" },
  dev: { title: "Dev", icon: Code },
}

declare global {

  type PermissionAction = 'create' | 'read' | 'update' | 'delete' | 'share'

  interface Group {
    title: string
    icon: LucideIcon
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

