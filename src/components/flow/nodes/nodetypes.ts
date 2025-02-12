import { BookTemplate, Brain, ListTree, File, GitFork, Send } from "lucide-react"
import { AINode } from "./ai"
import { SchemaNode } from "./schema"
import { TemplateNode } from "./template"
import { DocumentGeneratorNode } from "./docgen"
import { DecisionNode } from "./decision"
import { NotifyNode } from "./notifiy"

export const nodeTypes = {
  ai: AINode,
  schema: SchemaNode,
  template: TemplateNode,
  docgen: DocumentGeneratorNode,
  decision: DecisionNode,
  notify: NotifyNode,
}

export const avaialableNodes = {
  ai: { name: "ai", icon: Brain, title: "AI" },
  schema: { name: "schema", icon: ListTree, title: "Schema" },
  template: { name: "template", icon: BookTemplate, title: "Template" },
  docgen: { name: "docgen", icon: File, title: "Document Generator" },
  decision: { name: "decision", icon: GitFork, title: "Decision" },
  notify: { name: "notify", icon: Send, title: "Notify" },
}
