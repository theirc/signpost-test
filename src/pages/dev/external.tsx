import { Page, PageTitle } from "@/components/page"
import { Table } from "lucide-react"
import { DataTable } from "../../components/datatable/datatable"
import { columns, onLoad } from "./demodata"

export const dev_external = {
  title: "External Data",
  description: "Demo DataTable usage with external data.",
  path: "/dev_external",
  url: "/dev_external",
  icon: Table,
  component: ExternalData,
  resource: "agents",
  group: "dev",
  action: "read",
} satisfies PageConfig

function ExternalData() {

  return <Page config={dev_external}>
    <div className="h-full grid grid-rows-[auto,1fr] gap-4">
      <PageTitle />
      <DataTable onLoad={onLoad} columns={columns}>
      </DataTable>
    </div>
  </Page>

}

