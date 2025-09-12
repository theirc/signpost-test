import { Page, PageTitle } from "@/components/page"
import { DataTableSupabase } from "@/components/ui/datatable/supadatatable"
import { Table } from "lucide-react"
import { format, formatDistance, formatRelative, subDays } from 'date-fns'

export const dev_external_supa = {
  title: "Logs",
  description: "Log data.",
  path: "/dev_external_supa",
  url: "/dev_external_supa",
  icon: Table,
  component,
  resource: "agents",
  action: "read",
  group: "dev",
} satisfies PageConfig


const columns: Columns<Table<"logs">> = {
  id: { header: "ID", },
  uid: { header: "UID" },
  created_at: {
    header: "Created",
    cell: ({ row }) => format(row.original.created_at, "MM/dd/yyyy hh:mm:ss"),
  },
  agent: { header: "Agent" },
  team_id: { header: "Team" },
  type: { header: "Type" },
  worker: { header: "Worker" },
  message: { header: "Message" },
  parameters: {
    header: "Parameters",
    cell: ({ row }) => <pre className="bg-slate-100 p-2 overflow-hidden rounded-md">{JSON.stringify(row.original.parameters, null, 2)}</pre>,
  },
  handles: {
    header: "Handles",
    cell: ({ row }) => <pre className="bg-slate-100 p-2 overflow-hidden rounded-md">{JSON.stringify(row.original.parameters, null, 2)}</pre>,
  },
  inputTokens: { header: "Input Tokens" },
  outputTokens: { header: "Output Tokens" },
  // execution: { header: "Execution" },
  // workerId: { header: "Worker ID" },
}

function component() {

  return <Page config={dev_external_supa}>
    <div className="h-full grid grid-rows-[auto,1fr] gap-4">
      <PageTitle />
      <DataTableSupabase
        columns={columns}
        hideActions
        hideSelection
        table="logs"
        orderBy={["created_at", "desc"]}
        realtime
      // filter={(b) => b.eq("agent", 247)}
      // select={`
      //   *,
      //   agent (
      //     name
      //   )
      // `}
      />
    </div>
  </Page>

}

