import { Page, PageTitle } from "@/components/page"
import { DataTableSupabase } from "@/components/datatable/supadatatable"
import { Table } from "lucide-react"
import { DataTable } from "@/components/datatable/datatable"

export const logsdev = {
  title: "Logs",
  description: "Log data.",
  route: "/logsdev",
  url: "/logsdev",
  icon: Table,
  component,
  resource: "agents",
  action: "read",
  group: "evaluation",
} satisfies PageConfig


const columns: Columns<Table<"logs">> = {
  id: { header: "ID", },
  uid: { header: "UID" },
  created_at: { header: "Created", cell: DataTable.cellRender.date, },
  agent: { header: "Agent" },
  team_id: { header: "Team" },
  type: { header: "Type" },
  worker: { header: "Worker" },
  message: { header: "Message" },
  parameters: { header: "Parameters", cell: DataTable.cellRender.json },
  handles: { header: "Handles", cell: DataTable.cellRender.json, },
  inputTokens: { header: "Input Tokens", cell: DataTable.cellRender.number },
  outputTokens: { header: "Output Tokens", cell: DataTable.cellRender.number },
}

function component() {
  return <Page >
    <div className="h-full grid grid-rows-[auto,1fr] gap-4">
      <PageTitle />
      <DataTableSupabase columns={columns} hideSelection table="logs" realtime sort={["created_at", "desc"]}>
      </DataTableSupabase>
    </div>
  </Page>
}

