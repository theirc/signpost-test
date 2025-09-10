import { Page, PageTitle } from "@/components/page"
import { usePaginatedSupabaseTable } from "@/hooks/usePaginatedSupabaseTable"
import { Table } from "lucide-react"
import { DataTable } from "../../components/ui/datatable/datatable"

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



const columns: Columns<Table<"agents">> = {
  title: { header: "Title" },
  created_at: { header: "Created", },
  description: { header: "Description", },
}

function component() {

  const query = usePaginatedSupabaseTable({ table: "agents" })
  return <Page config={dev_external_supa}>
    <div className="h-full grid grid-rows-[auto,1fr] gap-4">
      <PageTitle />
      <DataTable data={query.data?.data} columns={columns} />
    </div>
  </Page>

}

