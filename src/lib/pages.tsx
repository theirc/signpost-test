import { agents } from "@/pages/dev/agents"
import { apikeys } from "@/pages/dev/apikeys"
import { dev_dtprops } from "@/pages/dev/dtprops"
import { dev_external } from "@/pages/dev/external"
import { logsdev } from "@/pages/dev/agentlogs"
import { models } from "@/pages/dev/models"
import { models_crud } from "@/pages/dev/models/model"
import { projects } from "@/pages/dev/projects"
import { roles } from "@/pages/dev/roles"
import { teams } from "@/pages/dev/teams"
import { users } from "@/pages/dev/users"
import { Book, Code, Logs, Settings2, type LucideIcon } from "lucide-react"
import { templates } from "@/pages/dev/templates"
import { collections } from "@/pages/dev/collections"
import { sources } from "@/pages/dev/sources"

export const pages: Record<string, PageConfig> = {
  agents,
  templates,
  dev_external,
  logsdev,
  dev_dtprops,
  projects,
  teams,
  apikeys,
  models,
  models_crud,
  users,
  roles,
  collections,
  sources,
}

export const groups = {
  evaluation: { title: "Evaluation 🧪", icon: Logs },
  knowledge: { title: "Knowledge 🧪", icon: Book },
  settings: { title: "Settings 🧪", icon: Settings2 },
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
