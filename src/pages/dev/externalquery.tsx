import { Page, PageTitle } from "@/components/page"
import { usePaginatedSupabaseTable } from "@/hooks/usePaginatedSupabaseTable"
import { Table } from "lucide-react"
import { DataTable } from "../../components/ui/datatable/datatable"
import { useMultiState } from "@/hooks/use-multistate"

export const dev_external_supa = {
  title: "Exernal Supabase",
  description: "Demo DataTable usage with external supabase data.",
  path: "/dev_external_supa",
  url: "/dev_external_supa",
  icon: Table,
  component,
  resource: "agents",
  action: "read",
  group: "dev",
} satisfies PageConfig


const columns: Columns<Table<"logs">> = {
  id: { header: "ID" },
  uid: { header: "UID" },
  created_at: { header: "Created", },
  agent: { header: "Agent" },
  team_id: { header: "Team" },
  type: { header: "Type" },
  worker: { header: "Worker" },
  workerId: { header: "Worker ID" },
  message: { header: "Message" },
  parameters: { header: "Parameters" }, // Json,
  handles: { header: "Handles" }, // Json,

  inputTokens: { header: "Input Tokens" },
  outputTokens: { header: "Output Tokens" },
  execution: { header: "Execution" },
}

function component() {

  const [{ pageIndex: page, pageSize }, setPage] = useMultiState<PaginationData>({ pageIndex: 0, pageSize: 20 })

  const { data: qd, isPending, status } = usePaginatedSupabaseTable({
    table: "logs",
    page,
    pageSize,
  })

  const { data = [], error, total } = (qd || {})

  function onPaginationChange(p: PaginationData) {
    setPage(p)
  }

  console.log('state', isPending, status)

  return <Page config={dev_external_supa}>
    <div className="h-full grid grid-rows-[auto,1fr] gap-4">
      <PageTitle />
      <DataTable
        data={data}
        columns={columns}
        hideActions
        hideSelection
        onPaginationChange={onPaginationChange}
        total={total}
      />
    </div>
  </Page>

}

